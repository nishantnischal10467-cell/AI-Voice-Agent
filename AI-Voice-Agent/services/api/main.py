from __future__ import annotations

import logging
import os
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from agents import Agent, Runner
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams
from fastembed import TextEmbedding

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("voice-agent-api")

BASE_DIR = Path(__file__).resolve().parent
COLLECTION_NAME = os.getenv("QDRANT_COLLECTION", "voice-rag-agent")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
QDRANT_URL = os.getenv("QDRANT_URL", "").strip()
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", "").strip()
QDRANT_LOCAL_PATH = os.getenv("QDRANT_LOCAL_PATH", str(BASE_DIR / ".qdrant")).strip()
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "BAAI/bge-small-en-v1.5").strip()
AI_SERVICE_API_KEY = os.getenv("AI_SERVICE_API_KEY", "").strip()
ALLOWED_VOICES = {
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "fable",
    "onyx",
    "nova",
    "sage",
    "shimmer",
    "verse",
}


class AgentState:
    client: QdrantClient | None = None
    embedding_model: TextEmbedding | None = None
    processor_agent: Agent | None = None
    tts_agent: Agent | None = None
    selected_voice: str = "coral"
    processed_documents: list[str] = []
    setup_complete: bool = False


state = AgentState()

app = FastAPI(title="AI Voice Agent Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class VoiceRequest(BaseModel):
    voice: str = Field(default="coral")


class QueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=4000)
    voice: str | None = None


class StatusResponse(BaseModel):
    setup_complete: bool
    processed_documents: list[str]
    selected_voice: str


def require_service_key(x_service_key: str | None = Header(default=None)) -> None:
    if AI_SERVICE_API_KEY and x_service_key != AI_SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid service key")


def setup_qdrant() -> tuple[QdrantClient, TextEmbedding]:
    if QDRANT_URL:
        client = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY or None, check_compatibility=False)
    else:
        os.makedirs(QDRANT_LOCAL_PATH, exist_ok=True)
        client = QdrantClient(path=QDRANT_LOCAL_PATH)

    try:
        embedding_model = TextEmbedding(model_name=EMBEDDING_MODEL_NAME)
    except Exception as exc:
        raise RuntimeError(
            "Embedding model initialization failed. FastEmbed may need internet on first run "
            f"to download '{EMBEDDING_MODEL_NAME}'. Original error: {exc}"
        ) from exc

    test_emb = list(embedding_model.embed(["test"]))[0]
    dim = len(test_emb)
    try:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
        )
    except Exception as exc:
        if "already exists" not in str(exc):
            raise
    return client, embedding_model


def ensure_vector_stack() -> tuple[QdrantClient, TextEmbedding]:
    if not state.client or not state.embedding_model:
        state.client, state.embedding_model = setup_qdrant()
    return state.client, state.embedding_model


def process_pdf(filepath: str, filename: str) -> list[Any]:
    loader = PyPDFLoader(filepath)
    documents = loader.load()
    for doc in documents:
        doc.metadata.update(
            {
                "source_type": "pdf",
                "file_name": filename,
                "timestamp": datetime.now().isoformat(),
            }
        )
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    return splitter.split_documents(documents)


def store_embeddings(documents: list[Any]) -> None:
    client, emb_model = ensure_vector_stack()
    points: list[models.PointStruct] = []
    for doc in documents:
        embedding = list(emb_model.embed([doc.page_content]))[0]
        points.append(
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=embedding.tolist(),
                payload={"content": doc.page_content, **doc.metadata},
            )
        )
    client.upsert(collection_name=COLLECTION_NAME, points=points)


def get_agents() -> tuple[Agent, Agent]:
    if state.processor_agent and state.tts_agent:
        return state.processor_agent, state.tts_agent

    state.processor_agent = Agent(
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
    state.tts_agent = Agent(
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
    return state.processor_agent, state.tts_agent


def build_local_response(query: str, results: list[Any]) -> str:
    snippets: list[str] = []
    for index, result in enumerate(results[:3], 1):
        payload = result.payload or {}
        content = (payload.get("content") or "").strip().replace("\n", " ")
        if content:
            snippets.append(f"{index}. {content[:500]}")

    if not snippets:
        return "I found relevant matches in the PDF, but could not extract readable text for a response."

    return (
        f"OpenAI is not configured, so this is a local document match for: {query}\n\n"
        f"Top relevant excerpts:\n{chr(10).join(snippets)}"
    )


async def run_query(query: str, voice: str) -> dict[str, Any]:
    client, emb_model = ensure_vector_stack()
    query_embedding = list(emb_model.embed([query]))[0]
    search_response = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding.tolist(),
        limit=3,
        with_payload=True,
    )
    results = search_response.points if hasattr(search_response, "points") else []
    if not results:
        raise ValueError("No relevant documents found in the vector database.")

    sources = [result.payload.get("file_name", "Unknown") for result in results if result.payload]
    if not OPENAI_API_KEY:
        return {"text_response": build_local_response(query, results), "audio_id": None, "sources": sources}

    context = "Based on the following documentation:\n\n"
    for result in results:
        payload = result.payload or {}
        context += f"From {payload.get('file_name', 'Unknown')}:\n{payload.get('content', '')}\n\n"
    context += f"\nUser Question: {query}\n\nPlease provide a clear, concise answer that can be easily spoken out loud."

    processor_agent, tts_agent = get_agents()
    processed = await Runner.run(processor_agent, context)
    text_response = processed.final_output
    speech_plan = await Runner.run(tts_agent, text_response)

    client = AsyncOpenAI(api_key=OPENAI_API_KEY)
    mp3_response = await client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice=voice,
        input=text_response,
        instructions=speech_plan.final_output,
        response_format="mp3",
    )
    audio_id = f"response_{uuid.uuid4()}.mp3"
    audio_path = Path(tempfile.gettempdir()) / audio_id
    audio_path.write_bytes(mp3_response.content)
    return {"text_response": text_response, "audio_id": audio_id, "sources": sources}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/status", response_model=StatusResponse, dependencies=[Depends(require_service_key)])
def status() -> StatusResponse:
    return StatusResponse(
        setup_complete=state.setup_complete,
        processed_documents=state.processed_documents,
        selected_voice=state.selected_voice,
    )


@app.post("/api/voice", dependencies=[Depends(require_service_key)])
def set_voice(payload: VoiceRequest) -> dict[str, str | bool]:
    if payload.voice not in ALLOWED_VOICES:
        raise HTTPException(status_code=400, detail="Unsupported voice")
    state.selected_voice = payload.voice
    return {"ok": True, "voice": payload.voice}


@app.post("/api/upload", dependencies=[Depends(require_service_key)])
async def upload_pdf(file: UploadFile = File(...)) -> dict[str, str | int | bool]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file. PDF only.")

    filename = Path(file.filename).name
    if filename in state.processed_documents:
        return {"message": f"'{filename}' already processed.", "already": True}

    upload_path = Path(tempfile.gettempdir()) / filename
    upload_path.write_bytes(await file.read())
    try:
        docs = process_pdf(str(upload_path), filename)
        if not docs:
            raise HTTPException(status_code=422, detail="Could not extract text from PDF")
        store_embeddings(docs)
        state.processed_documents.append(filename)
        state.setup_complete = True
        return {"ok": True, "filename": filename, "chunks": len(docs)}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("PDF upload failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/api/query", dependencies=[Depends(require_service_key)])
async def query(payload: QueryRequest) -> dict[str, Any]:
    if not state.setup_complete:
        raise HTTPException(status_code=400, detail="Upload a PDF first.")

    voice = payload.voice or state.selected_voice
    if voice not in ALLOWED_VOICES:
        raise HTTPException(status_code=400, detail="Unsupported voice")

    try:
        return await run_query(payload.query.strip(), voice)
    except Exception as exc:
        logger.exception("Query failed")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/api/audio/{filename}", dependencies=[Depends(require_service_key)])
def audio(filename: str) -> FileResponse:
    safe_name = Path(filename).name
    path = Path(tempfile.gettempdir()) / safe_name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Audio not found")
    return FileResponse(path, media_type="audio/mpeg")
