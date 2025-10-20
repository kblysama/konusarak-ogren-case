import logging
from functools import lru_cache

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import os
import re
from pydantic import BaseModel, Field

app = FastAPI(title="Sentiment Analyzer API", version="1.0.0")

# CORS middleware ekle
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger("ai-service")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

# Türkçe metin desteği için daha iyi bir model kullan
MODEL_NAME = os.getenv("MODEL_NAME", "cardiffnlp/twitter-xlm-roberta-base-sentiment")


class AnalyzeRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Analyzed text")


class AnalyzeResponse(BaseModel):
    sentiment: str
    score: float
    original_text: str
    processed_text: str


@lru_cache(maxsize=1)
def get_analyzer():
    logger.info("Loading sentiment model %s", MODEL_NAME)
    return pipeline("sentiment-analysis", model=MODEL_NAME)

def preprocess_text(text):
    """Metni ön işleme tabi tut - emojileri ve özel karakterleri temizle"""
    if not text or not isinstance(text, str):
        return ""
    
    # Emojileri temizle
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    
    text = emoji_pattern.sub(r'', text)
    
    # Fazla boşlukları temizle
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(payload: AnalyzeRequest):
    text = payload.message

    # Metni ön işleme tabi tut
    processed_text = preprocess_text(text)

    if not processed_text:
        return AnalyzeResponse(
            sentiment="neutral",
            score=0.5,
            original_text=text,
            processed_text=processed_text,
        )

    try:
        analyzer = get_analyzer()
        result = analyzer(processed_text)[0]
    except Exception as exc:
        logger.exception("Sentiment analysis failed")
        raise HTTPException(status_code=500, detail="analysis failed") from exc

    label = result["label"].lower()
    score = float(result.get("score", 0.0))

    # Model çıktılarını standartlaştır
    if "positive" in label or "joy" in label:
        sentiment = "positive"
    elif "negative" in label or "sadness" in label or "anger" in label:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    # Nötr bant genişletilmiş (0.4-0.6 arası)
    if 0.4 <= score <= 0.6:
        sentiment = "neutral"

    return AnalyzeResponse(
        sentiment=sentiment,
        score=score,
        original_text=text,
        processed_text=processed_text,
    )
