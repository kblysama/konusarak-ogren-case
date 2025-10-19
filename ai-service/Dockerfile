FROM python:3.9-slim

WORKDIR /app

# Sistem bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python bağımlılıklarını kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodunu kopyala
COPY app.py .

# Port aç
EXPOSE 8000

# Uygulamayı başlat
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
