# AI Voice Agent

This repository has been migrated from the original Flask voice RAG prototype into a production-oriented Next.js 15 + TypeScript application with a FastAPI AI service.

## Current App

The migrated project lives in:

```text
AI-Voice-Agent/
```

It includes:

- Next.js App Router frontend
- TypeScript, Tailwind CSS, React Hook Form, Zod, Axios
- Auth.js scaffolding
- FastAPI service preserving the original Python PDF/RAG/TTS logic
- Qdrant + FastEmbed document indexing
- OpenAI Agents SDK answer processing
- OpenAI text-to-speech MP3 generation
- Unit, component, and Playwright E2E tests
- Vercel and Railway deployment configuration

See [AI-Voice-Agent/README.md](AI-Voice-Agent/README.md) and [AI-Voice-Agent/docs/MIGRATION_REPORT.md](AI-Voice-Agent/docs/MIGRATION_REPORT.md) for setup, architecture, deployment, and migration details.

## Legacy Baseline

The original Flask app files are retained at the repository root for audit/history:

- `app.py`
- `run.py`
- `requirements.txt`
- `static/index.html`

Do not commit `.env`, `.qdrant`, caches, generated audio, or dependency folders.
