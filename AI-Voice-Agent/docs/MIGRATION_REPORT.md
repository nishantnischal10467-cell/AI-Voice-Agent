# Migration Report

## Legacy Flask Audit

Routes:

- `GET /`: serves `static/index.html`.
- `GET /api/status`: returns setup status, processed documents, and selected voice.
- `POST /api/voice`: stores the selected OpenAI voice in process memory.
- `POST /api/upload`: accepts one PDF, extracts pages, chunks text, embeds chunks, and upserts into Qdrant.
- `POST /api/query`: embeds the question, retrieves top Qdrant matches, generates a response, optionally produces MP3 audio.
- `GET /api/audio/<filename>`: serves generated MP3 files from temp storage.

Dependencies:

- Flask and Werkzeug runtime.
- Qdrant vector storage through `qdrant-client`.
- FastEmbed embeddings with `BAAI/bge-small-en-v1.5` by default.
- LangChain community PDF loader and text splitter.
- OpenAI Agents SDK and OpenAI TTS.
- `streamlit` was present in requirements but unused by the Flask app.

Templates and static assets:

- Single static HTML application at `static/index.html`.
- No separate CSS, image, or JavaScript assets.

AI integrations:

- Qdrant collection: `voice-rag-agent`.
- Embedding model: environment-controlled FastEmbed model.
- Answer agent: OpenAI Agents SDK model `gpt-4o`.
- Speech instruction agent: OpenAI Agents SDK model `gpt-4o`.
- TTS model: `gpt-4o-mini-tts`.
- Local fallback: when OpenAI is not configured, returns top document excerpts without audio.

## New Architecture

```text
Browser
  |
  | Next.js App Router UI
  v
Next.js Route Handlers
  |  Zod validation, rate limits, logging, service auth header
  v
FastAPI AI Service
  |  PDF parsing, chunking, embeddings, Qdrant, OpenAI Agents, TTS
  v
Qdrant + OpenAI
```

## Key Changes

- Created `AI-Voice-Agent/` as the migrated production application.
- Preserved substantial Python AI logic in `services/api/main.py`.
- Added Next.js 15, strict TypeScript, Tailwind CSS, shadcn-style reusable components, React Hook Form, Zod, Axios, Zustand, next-themes, and Auth.js scaffolding.
- Added validated API proxy routes under `app/api/*`.
- Added responsive UI with upload, chat, recorder, playback, history, settings, dark mode, loading, error boundaries, and accessible labels.
- Added SEO metadata, Open Graph/Twitter metadata, sitemap, robots, and PWA manifest.
- Added Vitest unit/component tests, Playwright E2E smoke test, and GitHub Actions CI.
- Added Vercel config for frontend and Docker/Railway deployment files for FastAPI.

## Preserved Features

- PDF-only upload.
- Duplicate document detection by filename.
- Qdrant local or remote storage.
- FastEmbed-based document and query embeddings.
- Retrieval from top matching document chunks.
- OpenAI Agents response processing and voice instruction generation.
- OpenAI TTS MP3 generation.
- Audio download/playback.
- Source filenames returned with answers.
- Local non-OpenAI fallback response.

## Placeholders

- Auth.js is installed and modular, but no provider is enabled because the legacy app had no authentication business rules. Add OAuth or credentials providers in `auth.ts`.
- Conversation history is browser-session state. Persist it with a database when user accounts are enabled.

## Verification

- `npm run lint`: passed.
- `npm run type-check`: passed.
- `npm run test`: passed.
- `npm run test:e2e`: passed after installing Playwright Chromium locally.
- `npm run build`: passed.
- `python -m py_compile services/api/main.py`: passed.
- `npm audit --omit=dev`: reports a moderate advisory through the current Next/next-auth dependency chain. The automated fix suggests downgrading to Next 9.3.3, so it was not applied.
