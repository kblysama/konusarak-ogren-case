#!/bin/bash
set -e

# Backend klasörüne git
cd backend

# .NET restore ve publish
dotnet restore
dotnet publish -c Release -o out

echo "Build completed successfully!"