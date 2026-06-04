<div align="center">

# 🎙️ AI Voice Agent — Customer Support

### A production-ready, voice-enabled AI customer support system powered by OpenAI Agents SDK, Qdrant, and Streamlit

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)
[![Streamlit](https://img.shields.io/badge/Streamlit-UI-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-DC244C?style=for-the-badge)](https://qdrant.tech/)


---

> **Turn any documentation website into a fully functional, voice-powered customer support agent — in minutes.**

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Demo](#-demo)
- [Key Features](#-key-features)
- [Technologies Used](#-technologies-used)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Dataset & Files Included](#-dataset--files-included)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Usage in Industry](#-usage-in-industry)
- [Contributing](#-contributing)

---

## 🧠 Overview

The **AI Voice Agent** is a multi-agent, voice-first customer support system that crawls your product documentation, indexes it into a vector database, and responds to user queries with both **text and natural-sounding speech**. It uses OpenAI's Agents SDK with GPT-4o for reasoning, Firecrawl for documentation ingestion, Qdrant for semantic search, and OpenAI TTS for high-quality voice responses — all wrapped in a clean Streamlit interface.

This system replaces traditional FAQ bots with a truly conversational experience where customers can **speak their questions** and receive **spoken answers** grounded in your actual documentation.

---

## 🎬 Demo

```
User speaks: "How do I reset my password?"
    ↓
[STT] Whisper transcribes audio → text
    ↓
[RAG] Semantic search over ingested docs in Qdrant
    ↓
[LLM] GPT-4o generates a grounded, accurate answer
    ↓
[TTS Optimization] Response refined for natural speech pacing
    ↓
[TTS] OpenAI TTS converts text → audio
    ↓
User hears a clear, natural voice answer
```

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🕷️ **Doc Crawler** | Automatically crawls and ingests documentation websites via Firecrawl |
| 🗃️ **Vector Knowledge Base** | Stores and retrieves documentation chunks using Qdrant + FastEmbed |
| 🤖 **Multi-Agent Pipeline** | Separate agents for retrieval, response generation, and TTS optimization |
| 🔊 **Voice I/O** | Full speech-to-text (Whisper) and text-to-speech (OpenAI TTS) pipeline |
| 🎛️ **Voice Customization** | Choose from 11 voices: `alloy`, `ash`, `ballad`, `coral`, `echo`, `fable`, `onyx`, `nova`, `sage`, `shimmer`, `verse` |
| 💬 **Multi-turn Conversation** | Maintains context across multiple questions in a session |
| 🖥️ **Streamlit UI** | Clean, interactive web interface — no frontend skills needed |

---

## 🛠️ Technologies Used

### Core AI & LLM
| Technology | Role |
|---|---|
| **OpenAI GPT-4o** | Primary LLM for answering customer queries |
| **OpenAI Agents SDK** | Multi-agent orchestration framework |
| **OpenAI Whisper (STT)** | Converts spoken user input to text |
| **OpenAI TTS** | Converts agent responses to natural speech |

### Data Ingestion & Retrieval
| Technology | Role |
|---|---|
| **Firecrawl** | Crawls and scrapes documentation websites |
| **Qdrant** | Cloud-native vector database for semantic search |
| **FastEmbed** | Fast, lightweight embedding generation for vector indexing |

### Backend & UI
| Technology | Role |
|---|---|
| **Python 3.10+** | Core programming language |
| **Streamlit** | Interactive web application framework |
| **asyncio** | Async execution for non-blocking agent calls |
| **python-dotenv** | Environment variable management |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        STREAMLIT UI                             │
│         (Voice Input / Text Input / Audio Playback)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │     AUDIO PIPELINE      │
              │  STT: OpenAI Whisper    │
              │  TTS: OpenAI TTS Model  │
              └────────────┬────────────┘
                           │
         ┌─────────────────▼──────────────────┐
         │         AGENT ORCHESTRATOR          │
         │         (OpenAI Agents SDK)         │
         │                                     │
         │  ┌─────────────────────────────┐    │
         │  │  1. Retrieval Agent         │    │
         │  │     └─ Qdrant Semantic      │    │
         │  │        Search               │    │
         │  ├─────────────────────────────┤    │
         │  │  2. Response Agent          │    │
         │  │     └─ GPT-4o Generation    │    │
         │  ├─────────────────────────────┤    │
         │  │  3. TTS Optimization Agent  │    │
         │  │     └─ Natural Speech       │    │
         │  │        Refinement           │    │
         │  └─────────────────────────────┘    │
         └─────────────────┬──────────────────-┘
                           │
         ┌─────────────────▼──────────────────┐
         │         KNOWLEDGE BASE              │
         │                                     │
         │  Firecrawl  ──►  FastEmbed          │
         │  (Crawl Docs)    (Embeddings)       │
         │                      │              │
         │                      ▼              │
         │               Qdrant Cloud          │
         │               (Vector Store)        │
         └─────────────────────────────────────┘
```

### Data Flow

1. **Ingestion Phase**: Firecrawl scrapes your documentation URL → FastEmbed generates vector embeddings → Qdrant stores them.
2. **Query Phase**: User speaks/types a query → Whisper transcribes audio → Retrieval Agent performs semantic search → Response Agent generates a grounded answer → TTS Optimization Agent refines for speech → TTS converts to audio.

---

## 📁 Project Structure

```
AI-Voice-Agent/
│
├── customer_support_voice_agent_/
│   ├── customer_support_voice_agent.py   # Main Streamlit app & agent logic
│   ├── requirements.txt                  # Python dependencies
│   └── .env.example                      # Environment variable template
│
└── README.md                             # Project documentation
```

### Key File Breakdown

| File | Purpose |
|---|---|
| `customer_support_voice_agent.py` | Core app — Streamlit UI, agent definitions, STT/TTS pipeline, Qdrant client, Firecrawl ingestion |
| `requirements.txt` | All Python package dependencies |
| `.env.example` | Template for API keys (OpenAI, Firecrawl, Qdrant) |

---

## 🗂️ Dataset & Files Included

This project does **not rely on a static dataset**. Instead, the knowledge base is dynamically constructed at runtime:

| Data Source | Description |
|---|---|
| **Documentation URLs** | Any publicly accessible product/API documentation website you provide |
| **Firecrawl-scraped Content** | Raw HTML pages converted to clean markdown via Firecrawl |
| **Qdrant Vector Index** | Chunked, embedded documentation stored as high-dimensional vectors |
| **Session Conversation History** | In-memory multi-turn dialogue context per user session |

> **Supported Documentation Formats**: Any website accessible by Firecrawl — including docs.yourproduct.com, GitHub wikis, Notion public pages, ReadTheDocs sites, and more.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- API keys for: OpenAI, Firecrawl, Qdrant Cloud

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/nishantnischal10467-cell/AI-Voice-Agent.git
cd AI-Voice-Agent/customer_support_voice_agent_

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate       # macOS/Linux
venv\Scripts\activate          # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env and add your API keys
```

### Environment Variables

```env
OPENAI_API_KEY=sk-...
FIRECRAWL_API_KEY=fc-...
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key
```

### Run the App

```bash
streamlit run customer_support_voice_agent.py
```

Open your browser at `http://localhost:8501`

---

## ⚙️ Configuration

### Voice Selection

You can configure the TTS voice in the Streamlit sidebar. Supported voices:

```
alloy | ash | ballad | coral | echo | fable | onyx | nova | sage | shimmer | verse
```

### Ingesting Your Documentation

In the app UI:
1. Enter your documentation URL (e.g., `https://docs.yourproduct.com`)
2. Click **"Ingest Documentation"** — Firecrawl crawls and indexes it into Qdrant
3. Start asking questions via voice or text

---

## 🏭 Usage in Industry

The AI Voice Agent architecture is applicable across a wide range of real-world business verticals:

### 💼 SaaS & Product Companies
Replace static help centers with a live voice agent that always answers from the latest documentation. Reduce support ticket volume by enabling users to self-serve via voice.

### 🏥 Healthcare & Insurance
Build HIPAA-compliant voice FAQ bots for patient portals, insurance policy lookup, appointment scheduling guidance, and benefits explanation — reducing call center load.

### 🏦 Financial Services & Banking
Deploy voice agents for account FAQs, loan product explanations, regulatory disclosures, and onboarding assistance — with responses grounded in official documentation.

### 🛒 E-Commerce & Retail
Handle order status, return policy, product information, and shipping queries via voice — especially effective for mobile shoppers.

### 🎓 Education & E-Learning
Create voice-powered course assistants that answer questions about syllabus content, assignment guidelines, and platform how-tos.

### 📞 Call Center Augmentation
Act as a first-line voice triage agent that resolves common queries instantly and escalates complex issues to human agents — complete with full conversation context.

### 🏗️ Enterprise Internal Tools
Build internal knowledge bots for HR policies, IT helpdesks, onboarding documentation, and compliance guidelines — accessible by voice.


</div>
