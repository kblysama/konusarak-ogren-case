# ---------- BUILD STAGE ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Proje dosyasını kopyala ve restore et
COPY backend/*.csproj backend/
RUN dotnet restore backend/backend.csproj

# Tüm backend kodunu kopyala ve publish et
COPY backend/ backend/
RUN dotnet publish backend/backend.csproj -c Release -o /app/publish

# ---------- RUNTIME STAGE ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Render PORT env veriyor; ASP.NET bunu dinlesin
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}

# Publish çıktısını kopyala
COPY --from=build /app/publish ./

# AI_URL'i Render'da Environment Variable olarak set etmeyi unutma
# örn: AI_URL=https://<senin-space>.hf.space

# Uygulamayı başlat
ENTRYPOINT ["dotnet", "backend.dll"]
