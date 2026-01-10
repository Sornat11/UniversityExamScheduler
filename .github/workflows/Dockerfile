# --- FRONTEND BUILD ---
FROM node:20-alpine AS fe
WORKDIR /src/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- BACKEND BUILD ---
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS be
WORKDIR /src
COPY . .

RUN rm -rf UniversityExamScheduler.Api/wwwroot || true \
 && mkdir -p UniversityExamScheduler.Api/wwwroot \
 && cp -r /src/frontend/dist/* UniversityExamScheduler.Api/wwwroot/

RUN dotnet publish UniversityExamScheduler.Api/UniversityExamScheduler.Api.csproj -c Release -o /app/publish

# --- RUNTIME ---
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=be /app/publish .
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "UniversityExamScheduler.Api.dll"]
