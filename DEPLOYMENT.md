# 🚀 Deployment Kılavuzu

Bu proje ücretsiz platformlarda deploy edilecek şekilde tasarlanmıştır.

## 📋 Platformlar

### 🤖 AI Servisi - Hugging Face Spaces
1. **Hugging Face Spaces'e giriş yapın**: https://huggingface.co/spaces
2. **Yeni Space oluşturun**: "Create new Space"
3. **Ayarlar**:
   - Name: `sentiment-chat-ai`
   - SDK: `Docker`
   - Hardware: `CPU basic` (ücretsiz)
4. **Dosyaları yükleyin**:
   - `ai-service/app.py`
   - `ai-service/requirements.txt`
   - `ai-service/Dockerfile`
5. **Deploy edin** ve URL'i not edin

### 🔧 Backend - Render
1. **Render'a giriş yapın**: https://render.com
2. **Yeni Web Service oluşturun**
3. **Ayarlar**:
   - Build Command: `dotnet publish -c Release -o out`
   - Start Command: `dotnet out/backend.dll`
   - Environment Variables:
     - `AI_URL`: Hugging Face Spaces URL'iniz
4. **GitHub repo'yu bağlayın** ve deploy edin

### 🌐 Frontend - Vercel
1. **Vercel'e giriş yapın**: https://vercel.com
2. **Import Project** ile GitHub repo'yu bağlayın
3. **Ayarlar**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Environment Variables:
     - `VITE_API_URL`: Render backend URL'iniz
4. **Deploy edin**

### 📱 Mobile - APK Build
1. **React Native CLI kurulumu**:
   ```bash
   npm install -g react-native-cli
   ```
2. **Android Studio kurun** ve SDK'yı yapılandırın
3. **Projeyi build edin**:
   ```bash
   cd mobile
   npm install
   npx react-native run-android --variant=release
   ```

## 🐳 Local Development

### Docker ile çalıştırma:
```bash
# Tüm servisleri başlat
docker-compose up --build

# Servisler:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - AI Service: http://localhost:8001
```

### Manuel çalıştırma:
```bash
# 1. AI Service
cd ai-service
pip install -r requirements.txt
uvicorn app:app --reload --port 8001

# 2. Backend
cd backend
dotnet restore
dotnet run

# 3. Frontend
cd frontend
npm install
npm run dev
```

## 🔧 Environment Variables

### AI Service (Hugging Face)
- `MODEL_NAME`: Kullanılacak model (varsayılan: cardiffnlp/twitter-xlm-roberta-base-sentiment)

### Backend (Render)
- `AI_URL`: AI servisinin URL'i
- `ConnectionStrings__ChatDb`: Veritabanı bağlantı string'i

### Frontend (Vercel)
- `VITE_API_URL`: Backend API URL'i

### Mobile
- `API_URL`: Backend API URL'i (gerçek cihaz için bilgisayarınızın IP'si)

## 📊 Monitoring ve Logs

- **Hugging Face Spaces**: Built-in logs
- **Render**: Dashboard'da logs
- **Vercel**: Function logs

## 🚨 Troubleshooting

### AI Service Sorunları
- Model yüklenme süresi uzun olabilir (ilk deploy)
- Memory limit aşımı durumunda daha küçük model kullanın

### Backend Sorunları
- CORS hataları: `AllowAll` policy kontrol edin
- Database bağlantı hataları: Connection string kontrol edin

### Frontend Sorunları
- API URL yanlış: Environment variable kontrol edin
- Build hataları: Node.js versiyonu kontrol edin

### Mobile Sorunları
- Network hataları: API URL'i gerçek cihaz IP'si olmalı
- Build hataları: Android SDK ve React Native CLI versiyonları kontrol edin

## 📈 Performance Optimization

1. **AI Service**: Model caching kullanın
2. **Backend**: Database indexing ekleyin
3. **Frontend**: Code splitting ve lazy loading
4. **Mobile**: FlatList optimization

## 🔒 Security

- HTTPS kullanın (ücretsiz platformlar otomatik sağlar)
- API rate limiting ekleyin
- Input validation güçlendirin
- Database backup stratejisi oluşturun
