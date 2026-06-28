# AI Voice Agent

Production-ready Next.js 15 + TypeScript migration of the Flask Voice RAG Agent.

## Architecture

```text
AI-Voice-Agent/
  app/                 Next.js App Router pages and route handlers
  components/          Reusable UI and feature components
  hooks/               Client interaction hooks
  lib/                 Validation, env, logging, API client, rate limits
  services/api/        FastAPI service preserving Python AI processing
  store/               Zustand browser-session state
  tests/               Vitest and Playwright tests
```

```text
User -> Next.js UI -> Zod API routes -> FastAPI -> Qdrant/OpenAI -> MP3 + answer
```

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

In a second terminal:

```bash
cd services/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Testing

```bash
npm run lint
npm run type-check
npm run test
npm run test:e2e
npm run build
```

## Deployment

- Deploy `AI-Voice-Agent` to Vercel.
- Deploy `services/api` to Railway with the included Dockerfile.
- Set `AI_SERVICE_URL` in Vercel to your Railway service URL.
- Set the same `AI_SERVICE_API_KEY` in both services.
- Use remote Qdrant for production.

## Environment

See `.env.example`. Never commit real keys.

## Troubleshooting

- If uploads fail, confirm FastAPI is running and `AI_SERVICE_URL` is correct.
- If embedding initialization fails, the FastAPI service may need internet access on first boot to download the FastEmbed model.
- If answers work but audio does not, confirm `OPENAI_API_KEY` is set in the FastAPI service.
- If the frontend returns 401 from API routes, make sure `AI_SERVICE_API_KEY` matches in both apps.
