# Backend (.NET 8 + SQLite)

## Run locally
```bash
dotnet restore
dotnet run
# Swagger: http://localhost:5000/swagger
```
### Required environment
- `AI_URL` → Hugging Face Spaces (or local FastAPI) base URL

### Deploy (Render)
- Build command: `dotnet publish -c Release -o out`
- Start command: `./out/sentiment-chat-backend`
- Add env var: `AI_URL=https://<your-hf-space>.hf.space`
