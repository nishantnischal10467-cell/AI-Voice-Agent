# FastAPI AI Service

This service preserves the Flask app's Python RAG and text-to-speech business logic.

## Endpoints

- `GET /health`
- `GET /api/status`
- `POST /api/voice`
- `POST /api/upload`
- `POST /api/query`
- `GET /api/audio/{filename}`

Set `AI_SERVICE_API_KEY` in both this service and the Next.js app. The Next.js route handlers send it as `x-service-key`.

## Local Development

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Railway

1. Create a Railway service from `services/api`.
2. Set the Dockerfile path to `services/api/Dockerfile` if deploying from the repository root.
3. Add the variables from `.env.example`.
4. Use remote Qdrant for production by setting `QDRANT_URL` and `QDRANT_API_KEY`.

Local Qdrant path storage is only appropriate for development.
