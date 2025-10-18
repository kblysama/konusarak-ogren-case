# FullStack + AI Stajyer Projesi — Sentiment Chat

Monorepo: `frontend/` (Vite + React), `backend/` (.NET 8 + SQLite), `ai-service/` (FastAPI on HF), `mobile/` (RN CLI guide).

## Quickstart (local)
### 1) AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```
### 2) Backend
```bash
cd backend
dotnet restore
# Set AI_URL to your AI endpoint
dotnet run
```
### 3) Frontend
```bash
cd frontend
npm i
echo VITE_API_URL=http://localhost:5000 > .env.local
npm run dev
```

## Deploy targets
- AI: Hugging Face Spaces (FastAPI)
- Backend: Render (free web service), env: `AI_URL`
- Web: Vercel (env: `VITE_API_URL` → Render URL)
- Mobile: Build APK with RN CLI (optional for demo)

## Notes
- Minimal code paths (DB insert & API call) are handwritten (no AI generation).
- Swagger: `/swagger` on backend.

