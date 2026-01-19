# Deployment Guide

This guide covers deploying Coding Coach using Docker on Windows, Linux, and macOS.

## Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Docker Compose installed (included with Docker Desktop)
- A local LLM running (Ollama or LM Studio) or API credentials

## Quick Start with Docker Compose

### 1. Clone or navigate to the project

```bash
cd /path/to/CodingCoach
```

### 2. Create environment configuration

Create a `.env.local` file in the project root:

```bash
# Ollama Configuration (default)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1:8b-instruct

# OR LM Studio Configuration
# AI_PROVIDER=lmstudio
# LMSTUDIO_BASE_URL=http://host.docker.internal:1234
# LMSTUDIO_MODEL=your-model-id
```

**Note:** `host.docker.internal` allows the Docker container to access services running on your host machine (Windows/Mac). On Linux, use `http://172.17.0.1:11434` or your host IP instead.

### 3. Build and run

```bash
docker-compose up --build
```

The app will be available at **http://localhost:3000**

### 4. Run in background (detached mode)

```bash
docker-compose up -d
```

### 5. Stop the application

```bash
docker-compose down
```

## Manual Docker Build (without Docker Compose)

### Build the image

```bash
docker build -t coding-coach:latest .
```

### Run the container

```bash
docker run -d \
  --name coding-coach \
  -p 3000:3000 \
  -e AI_PROVIDER=ollama \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -e OLLAMA_MODEL=llama3.1:8b-instruct \
  coding-coach:latest
```

### View logs

```bash
docker logs -f coding-coach
```

### Stop and remove

```bash
docker stop coding-coach
docker rm coding-coach
```

## Platform-Specific Notes

### Windows

- Use `host.docker.internal` to access host services
- Ensure Ollama/LM Studio is running and accessible
- Docker Desktop must be running

### macOS

- Use `host.docker.internal` to access host services
- Ensure Ollama/LM Studio is running and accessible
- Docker Desktop must be running

### Linux

**Important:** `host.docker.internal` doesn't work on Linux by default.

Use one of these alternatives:

#### Option 1: Use host network mode

```bash
docker run --network host \
  -e AI_PROVIDER=ollama \
  -e OLLAMA_BASE_URL=http://localhost:11434 \
  -e OLLAMA_MODEL=llama3.1:8b-instruct \
  coding-coach:latest
```

#### Option 2: Use host IP address

Find your host IP:
```bash
ip addr show docker0 | grep -Po 'inet \K[\d.]+'
```

Then use that IP (usually `172.17.0.1`):
```bash
docker run -d \
  -p 3000:3000 \
  -e AI_PROVIDER=ollama \
  -e OLLAMA_BASE_URL=http://172.17.0.1:11434 \
  -e OLLAMA_MODEL=llama3.1:8b-instruct \
  coding-coach:latest
```

#### Option 3: Run Ollama in Docker too

```bash
# Run Ollama container
docker run -d --name ollama \
  -v ollama:/root/.ollama \
  -p 11434:11434 \
  ollama/ollama

# Pull a model
docker exec -it ollama ollama pull llama3.1:8b-instruct

# Link containers
docker run -d \
  --name coding-coach \
  --link ollama:ollama \
  -p 3000:3000 \
  -e AI_PROVIDER=ollama \
  -e OLLAMA_BASE_URL=http://ollama:11434 \
  -e OLLAMA_MODEL=llama3.1:8b-instruct \
  coding-coach:latest
```

## Production Deployment

### Using a Reverse Proxy (Nginx)

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Using Docker Compose with Nginx

```yaml
version: '3.8'

services:
  coding-coach:
    build: .
    environment:
      - AI_PROVIDER=ollama
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - OLLAMA_MODEL=llama3.1:8b-instruct
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - coding-coach
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_PROVIDER` | AI provider to use (`ollama` or `lmstudio`) | `ollama` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | Ollama model name | `llama3.1:8b-instruct` |
| `LMSTUDIO_BASE_URL` | LM Studio server URL | `http://localhost:1234` |
| `LMSTUDIO_MODEL` | LM Studio model ID | - |
| `AI_MODEL` | Override model for any provider | - |
| `PORT` | Application port | `3000` |
| `NODE_ENV` | Node environment | `production` |

## Troubleshooting

### Container can't connect to host services

**Windows/Mac:**
- Verify Ollama/LM Studio is running
- Check firewall isn't blocking port 11434 or 1234
- Try `host.docker.internal` instead of `localhost`

**Linux:**
- Use `172.17.0.1` or your actual host IP
- Or use `--network host` mode
- Ensure Ollama is listening on `0.0.0.0`, not just `127.0.0.1`

### Build fails

```bash
# Clear Docker cache and rebuild
docker-compose build --no-cache
```

### App starts but shows errors

```bash
# Check logs
docker-compose logs -f

# Or for specific container
docker logs -f coding-coach
```

### Port already in use

```bash
# Change the port mapping in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 on host instead
```

## Health Check

Test if your container is running:

```bash
curl http://localhost:3000/api/health/provider \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama"}'
```

Should return:
```json
{
  "ok": true,
  "provider": "ollama",
  "baseUrl": "http://host.docker.internal:11434",
  "model": "llama3.1:8b-instruct",
  "availableModels": [...]
}
```

## Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

## Cleanup

Remove all containers, images, and volumes:

```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi coding-coach:latest

# Remove unused volumes (optional)
docker volume prune
```

## Next Steps

- Set up SSL/TLS for production (use Let's Encrypt)
- Configure automatic backups
- Set up monitoring (Prometheus, Grafana)
- Implement log aggregation (ELK stack)
- Add health checks and auto-restart policies
