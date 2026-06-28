"""
app.py  —  Voice RAG Agent  (Flask backend, no Streamlit)
Run:  python run.py   or   python app.py
"""

from typing import List, Dict, Tuple
import os, tempfile, uuid, asyncio, logging
from pathlib import Path
from datetime import datetime

from flask import Flask, request, jsonify, send_file, send_from_directory
from werkzeug.utils import secure_filename

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from openai import AsyncOpenAI, OpenAI
from agents import Agent, Runner


def load_dotenv_file(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value

# ── Suppress Flask/Werkzeug startup noise ────────────────────────────────────
log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)

# ── API Keys — fill these in ──────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
load_dotenv_file(BASE_DIR / ".env")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
QDRANT_URL = os.getenv("QDRANT_URL", "").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip()
QDRANT_LOCAL_PATH = os.getenv("QDRANT_LOCAL_PATH", str(BASE_DIR / ".qdrant")).strip()
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "text-embedding-3-small").strip()
EMBEDDING_DIMENSIONS = int(os.getenv("EMBEDDING_DIMENSIONS", "1536"))
EMBEDDING_BATCH_SIZE = int(os.getenv("EMBEDDING_BATCH_SIZE", "16"))
# ─────────────────────────────────────────────────────────────────────────────

if OPENAI_API_KEY:
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

COLLECTION_NAME = "voice-rag-agent"
UPLOAD_FOLDER   = tempfile.gettempdir()
ALLOWED_EXT     = {"pdf"}

app = Flask(__name__, static_folder="static", template_folder="static")
app.config["UPLOAD_FOLDER"]        = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"]   = 50 * 1024 * 1024  # 50 MB

# ── Shared state (single-user local app) ─────────────────────────────────────
state: Dict = {
    "client":              None,
    "embedding_client":    None,
    "processor_agent":     None,
    "tts_agent":           None,
    "selected_voice":      "coral",
    "processed_documents": [],
    "setup_complete":      False,
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT


def setup_qdrant() -> Tuple[QdrantClient, OpenAI]:
    use_remote_qdrant = bool(QDRANT_URL)
    if use_remote_qdrant:
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY or None,
            check_compatibility=False,
        )
    else:
        os.makedirs(QDRANT_LOCAL_PATH, exist_ok=True)
        client = QdrantClient(path=QDRANT_LOCAL_PATH)

    if not OPENAI_API_KEY:
        raise RuntimeError("OPENAI_API_KEY is required for OpenAI embeddings.")

    embedding_client = OpenAI(api_key=OPENAI_API_KEY)
    try:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=EMBEDDING_DIMENSIONS, distance=Distance.COSINE),
        )
    except Exception as e:
        if "already exists" not in str(e):
            raise
    return client, embedding_client


def embed_texts(texts: List[str]) -> List[List[float]]:
    embedding_client = state["embedding_client"]
    if not embedding_client:
        raise RuntimeError("Embedding client is not initialized.")

    response = embedding_client.embeddings.create(
        model=EMBEDDING_MODEL_NAME,
        input=texts,
    )
    return [item.embedding for item in response.data]


def process_pdf(filepath: str, filename: str) -> List:
    loader    = PyPDFLoader(filepath)
    documents = loader.load()
    for doc in documents:
        doc.metadata.update({
            "source_type": "pdf",
            "file_name":   filename,
            "timestamp":   datetime.now().isoformat(),
        })
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    return splitter.split_documents(documents)


def store_embeddings(documents: List) -> None:
    client    = state["client"]
    for start in range(0, len(documents), EMBEDDING_BATCH_SIZE):
        batch = documents[start:start + EMBEDDING_BATCH_SIZE]
        embeddings = embed_texts([doc.page_content for doc in batch])
        points = []
        for doc, emb in zip(batch, embeddings):
            points.append(models.PointStruct(
                id=str(uuid.uuid4()),
                vector=emb,
                payload={"content": doc.page_content, **doc.metadata},
            ))
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points,
        )


def get_agents() -> Tuple[Agent, Agent]:
    if state["processor_agent"] and state["tts_agent"]:
        return state["processor_agent"], state["tts_agent"]

    processor = Agent(
        name="Documentation Processor",
        instructions="""You are a helpful documentation assistant. Your task is to:
        1. Analyze the provided documentation content
        2. Answer the user's question clearly and concisely
        3. Include relevant examples when available
        4. Cite the source files when referencing specific content
        5. Keep responses natural and conversational
        6. Format your response in a way that's easy to speak out loud""",
        model="gpt-4o",
    )
    tts = Agent(
        name="Text-to-Speech Agent",
        instructions="""You are a text-to-speech agent. Your task is to:
        1. Convert the processed documentation response into natural speech
        2. Maintain proper pacing and emphasis
        3. Handle technical terms clearly
        4. Keep the tone professional but friendly
        5. Use appropriate pauses for better comprehension
        6. Ensure the speech is clear and well-articulated""",
        model="gpt-4o",
    )
    state["processor_agent"] = processor
    state["tts_agent"]       = tts
    return processor, tts


def build_local_response(query: str, results: List) -> str:
    snippets = []
    for i, r in enumerate(results[:3], 1):
        payload = r.payload or {}
        content = (payload.get("content") or "").strip().replace("\n", " ")
        if not content:
            continue
        snippets.append(f"{i}. {content[:500]}")

    if not snippets:
        return "I found relevant matches in the PDF, but could not extract readable text for a response."

    joined = "\n\n".join(snippets)
    return (
        f"OpenAI is not configured, so this is a local document match for: {query}\n\n"
        f"Top relevant excerpts:\n{joined}"
    )


async def run_query(query: str, voice: str) -> Dict:
    client    = state["client"]

    # Embed query & search
    q_emb = embed_texts([query])[0]
    search_resp = client.query_points(
        collection_name=COLLECTION_NAME,
        query=q_emb,
        limit=3,
        with_payload=True,
    )
    results = search_resp.points if hasattr(search_resp, "points") else []
    if not results:
        raise ValueError("No relevant documents found in the vector database.")

    if not OPENAI_API_KEY:
        return {
            "text_response": build_local_response(query, results),
            "audio_path":    None,
            "sources": [r.payload.get("file_name", "Unknown") for r in results if r.payload],
        }

    # Build context
    context = "Based on the following documentation:\n\n"
    for i, r in enumerate(results, 1):
        p = r.payload or {}
        context += f"From {p.get('file_name', 'Unknown')}:\n{p.get('content', '')}\n\n"
    context += f"\nUser Question: {query}\n\nPlease provide a clear, concise answer that can be easily spoken out loud."

    # Run agents
    processor_agent, tts_agent = get_agents()
    proc_result        = await Runner.run(processor_agent, context)
    text_response      = proc_result.final_output

    tts_result         = await Runner.run(tts_agent, text_response)
    voice_instructions = tts_result.final_output

    # Generate audio — stream to speaker first, then save MP3
    # Generate an MP3 file for the browser player.
    aclient = AsyncOpenAI(api_key=OPENAI_API_KEY)
    mp3_resp = await aclient.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice=voice,
        input=text_response,
        instructions=voice_instructions,
        response_format="mp3",
    )
    audio_path = os.path.join(tempfile.gettempdir(), f"response_{uuid.uuid4()}.mp3")
    with open(audio_path, "wb") as f:
        f.write(mp3_resp.content)

    return {
        "text_response": text_response,
        "audio_path":    audio_path,
        "sources": [r.payload.get("file_name", "Unknown") for r in results if r.payload],
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/status")
def api_status():
    return jsonify({
        "setup_complete":      state["setup_complete"],
        "processed_documents": state["processed_documents"],
        "selected_voice":      state["selected_voice"],
    })


@app.route("/api/voice", methods=["POST"])
def set_voice():
    data  = request.get_json(force=True)
    voice = data.get("voice", "coral")
    state["selected_voice"] = voice
    return jsonify({"ok": True, "voice": voice})


@app.route("/api/upload", methods=["POST"])
def upload_pdf():
    if not OPENAI_API_KEY:
        return jsonify({"error": "OPENAI_API_KEY is required to index PDFs with OpenAI embeddings."}), 500

    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    f = request.files["file"]
    if f.filename == "" or not allowed_file(f.filename):
        return jsonify({"error": "Invalid file — PDF only"}), 400

    filename = secure_filename(f.filename)
    if filename in state["processed_documents"]:
        return jsonify({"message": f"'{filename}' already processed.", "already": True})

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    f.save(filepath)

    try:
        if not state["client"]:
            state["client"], state["embedding_client"] = setup_qdrant()

        docs = process_pdf(filepath, filename)
        if not docs:
            return jsonify({"error": "Could not extract text from PDF"}), 422

        store_embeddings(docs)
        state["processed_documents"].append(filename)
        state["setup_complete"] = True
        return jsonify({"ok": True, "filename": filename, "chunks": len(docs)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/query", methods=["POST"])
def query():
    if not state["setup_complete"]:
        return jsonify({"error": "Upload a PDF first."}), 400

    data  = request.get_json(force=True)
    q     = (data.get("query") or "").strip()
    voice = state["selected_voice"]

    if not q:
        return jsonify({"error": "Empty query"}), 400

    try:
        result = asyncio.run(run_query(q, voice))
        response = {
            "text_response": result["text_response"],
            "sources":       result["sources"],
        }
        if result.get("audio_path"):
            response["audio_id"] = os.path.basename(result["audio_path"])
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/audio/<filename>")
def serve_audio(filename):
    path = os.path.join(tempfile.gettempdir(), secure_filename(filename))
    if not os.path.exists(path):
        return jsonify({"error": "Audio not found"}), 404
    return send_file(path, mimetype="audio/mpeg", as_attachment=False)


if __name__ == "__main__":
    print(f"[Voice RAG] Running at http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
