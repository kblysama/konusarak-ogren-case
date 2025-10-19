from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import os
import re

app = FastAPI(title="Sentiment Analyzer API", version="1.0.0")

# CORS middleware ekle
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Türkçe metin desteği için daha iyi bir model kullan
MODEL_NAME = os.getenv("MODEL_NAME", "cardiffnlp/twitter-xlm-roberta-base-sentiment")
analyzer = pipeline("sentiment-analysis", model=MODEL_NAME)

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

@app.post("/analyze")
async def analyze(request: Request):
    try:
        data = await request.json()
        text = data.get("message", "")
        
        if not text or not isinstance(text, str):
            return JSONResponse({"error": "message is required"}, status_code=400)
        
        # Metni ön işleme tabi tut
        processed_text = preprocess_text(text)
        
        if not processed_text:
            return JSONResponse({"sentiment": "neutral", "score": 0.5})
        
        # Duygu analizi yap
        result = analyzer(processed_text)[0]
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
        
        return JSONResponse({
            "sentiment": sentiment, 
            "score": score,
            "original_text": text,
            "processed_text": processed_text
        })
        
    except Exception as e:
        print(f"Analiz hatası: {e}")
        return JSONResponse({"sentiment": "neutral", "score": 0.5})
