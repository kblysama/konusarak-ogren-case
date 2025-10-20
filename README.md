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


## AI Tools

- ChatGPT, Cursor, Google Stitch, 

## Hugging Face Space

- https://huggingface.co/spaces/kblysama/sentiment-chat-ai

## Render

-https://konusarak-ogren-case.onrender.com/
-https://konusarak-ogren-case.onrender.com/swagger/index.html

## Vercel

-https://konusarak-ogren-case.vercel.app/

## Github Repo

-https://github.com/kblysama/konusarak-ogren-case

## Dosyaların temel işlevleri

README.md: Depodaki dört alt projenin (frontend, backend, ai-service, mobile) görevlerini özetleyip yerel çalıştırma adımlarını listeler.

DEPLOYMENT.md: AI servisi, .NET backend, Vercel frontend ve mobil uygulamanın ücretsiz platformlarda nasıl dağıtılacağını ayrıntılı olarak açıklar; ayrıca Docker ile yerel geliştirme, ortam değişkenleri ve sık görülen sorunlar için rehber sunar.

docker-compose.yml: AI servisi, backend ve frontend konteynerlerini tek komutla ayağa kaldırmak için yapılandırılmış Docker Compose senaryosudur; port yönlendirmeleri, healthcheck’ler ve kalıcı veri hacmini tanımlar.

Dockerfile: Backend’i Render benzeri ortamlarda yayınlamak için iki aşamalı .NET build/publish sürecini tanımlar ve çalışma zamanında PORT değişkenini dinlemeye ayarlar.

konusarak-ogren-case.sln: Visual Studio çözümü; .NET backend projesini derleyip yapılandırmak için gerekli proje ayarlarını içerir.

package.json: Monorepo için kök npm betiklerini (AI, backend, frontend geliştirme sunucuları, Docker orkestrasyonu ve mobil yardımcı betikler) ve geliştirme bağımlılıklarını tanımlar.

build.sh: Backend klasörüne geçip dotnet restore/publish çalıştıran küçük bir yayınlama komut dosyasıdır.

test-integration.js: AI servisi ile backend’in birlikte çalıştığını doğrulamak için sağlık kontrolü, duygu analizi ve mesaj döngüsü senaryolarını otomatikleştirir.

gereksinim.txt: Depoda boş bir yer tutucu olarak duruyor; ek gereksinimler için ayrılmış görünmektedir.

ai-service/, backend/, frontend/, mobile/: Sırasıyla FastAPI tabanlı AI mikroservisini, .NET minimal API backend’ini, Vite + React web arayüzünü ve React Native mobil istemcisini barındıran klasörlerdir (alt bölümlere bakın).

node_modules/: Kök düzeydeki paylaşılan JavaScript bağımlılıklarının kurulu olduğu klasördür.

sentiment-chat-ai/: Şu anda boş; muhtemelen Hugging Face Spaces’e yükleme için ayrılmış bir klasör.

ai-service/
app.py: FastAPI uygulamasını başlatır, CORS’u açar, Transformers pipeline’ını önbelleğe alır, metni emoji/boşluk temizleme ile işler ve skor aralığına göre positive/neutral/negative sonuçları standartlaştırır.

README.md: Servisin temel uç noktasını (POST /analyze) ve yerel çalıştırma komutlarını özetler.

requirements.txt: FastAPI, Uvicorn ve Transformers/Torch bağımlılık sürümlerini sabitler.

Dockerfile: Python 3.9 tabanlı imaj üzerinde sistem paketlerini kurup gereksinimleri yükler, ardından servisi Uvicorn ile 8000 portunda başlatır.

backend/
Program.cs: ASP.NET Core minimal API kurulumunu, SQLite veri tabanını, CORS politikasını ve /health, /register, /messages, /message uç noktalarını tanımlayan ana uygulama dosyasıdır; ayrıca User, Message, ChatDb ve veritabanı dizin yardımcı sınıfını içerir.

backend.csproj: Projenin .NET 8 hedefini ve Entity Framework Core ile Swagger bağımlılıklarını belirtir.

appsettings.json: SQLite bağlantı dizesi, AI servis URL’i, varsayılan CORS kaynağı ve günlük seviyelerini yapılandırır.

Dockerfile: Çok aşamalı derleme ile .NET backend’i yayınlayıp final imajda çalıştırılabilir hale getirir.

README.md: Backend’i yerelde çalıştırma adımlarını ve Render dağıtım notlarını sunar.

frontend/
README.md: React arayüzü için yerel geliştirme komutlarını ve Vercel dağıtım ayarlarını özetler.

package.json: Vite tabanlı frontend’in geliştirme, build ve önizleme betikleri ile React bağımlılıklarını listeler.

index.html: Vite’in #root kapsayıcısını ve src/main.jsx giriş noktasını yükleyen minimal HTML iskeletidir.

src/main.jsx: React uygulamasını App bileşeniyle DOM’a bağlayan giriş dosyasıdır.
## Elle yazılam kısım
src/ui/App.jsx: Kayıt, mesaj gönderme ve duygu analizini gösteren tam kullanıcı arayüzünü (yan menü, sohbet listesi, mesaj paneli, duygu kartları) yönetir; API çağrılarını ve UI durumunu burada tutar.
## 
Dockerfile: Node 18 üzerinde üretim build’i alıp Nginx’e kopyalar; Nginx yapılandırmasını dahil eder.

nginx.conf: Tek sayfa uygulaması yönlendirmesini, statik önbellekleme ve temel güvenlik başlıklarını tanımlar.

vite.config.js: React eklentisini etkinleştirir ve geliştirme sunucusunun 5173 portunda çalışmasını sağlar.

node_modules/: Web arayüzünün npm install ile indirilen bağımlılıklarının tutulduğu klasördür.

mobile/
README.md: React Native CLI ile örnek projenin nasıl oluşturulacağını ve basit App.tsx örneğini açıklar.

package.json: Mobil uygulamanın çalıştırma, test ve lint betiklerini ve React Native ekosistemi bağımlılıklarını listeler.
## Elle yazılan kısım
App.tsx: Mobil istemcide kayıt, mesaj gönderme, periyodik mesaj yenileme ve duygu etiketlerini/renklerini gösteren tüm UI ve iş mantığını içerir.
##
index.js: React Native uygulamasını AppRegistry üzerinden başlatır.

metro.config.js: Metro paketleyicisi için varsayılan yapılandırmayı birleştirir.

babel.config.js: Metro’nun Babel preset’ini etkinleştiren minimal ayardır.

node_modules/: Mobil uygulamanın npm install ile yüklenen bağımlılıklarını barındırır.

sentiment-chat-ai/
Klasör şu an boş; Hugging Face Spaces gibi hedeflere dosya kopyalamak için bir yer tutucu olarak tutuluyor.