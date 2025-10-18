from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from transformers import pipeline
import os

app = FastAPI(title="Sentiment Analyzer API", version="1.0.0")

# Use a lightweight, commonly cached model on HF
MODEL_NAME = os.getenv("MODEL_NAME", "distilbert-base-uncased-finetuned-sst-2-english")
analyzer = pipeline("sentiment-analysis", model=MODEL_NAME)

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/analyze")
async def analyze(request: Request):
    data = await request.json()
    text = data.get("message", "")
    if not text or not isinstance(text, str):
        return JSONResponse({"error": "message is required"}, status_code=400)
    result = analyzer(text)[0]
    label = result["label"].lower()
    # Map common labels to tr-lean names: positive/neutral/negative
    # HF model returns POSITIVE or NEGATIVE; we derive neutral if score ~0.5 (rare). 
    score = float(result.get("score", 0.0))
    if label not in ("positive", "negative"):
        sentiment = "neutral"
    else:
        # ad-hoc neutral band (near 0.5); optional
        if 0.48 <= score <= 0.52:
            sentiment = "neutral"
        else:
            sentiment = label
    return JSONResponse({"sentiment": sentiment, "score": score})
