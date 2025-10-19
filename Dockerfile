FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY backend/out/ .
ENTRYPOINT ["dotnet", "backend.dll"]