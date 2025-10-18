# AI Service (FastAPI on Hugging Face Spaces)

- Endpoint: `POST /analyze` with JSON `{ "message": "text" }`
- Returns: `{ "sentiment": "positive|neutral|negative", "score": 0.98 }`

## Run locally
```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```
