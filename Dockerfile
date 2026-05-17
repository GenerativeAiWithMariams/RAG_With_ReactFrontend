FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app/backend \
    PORT=8000

WORKDIR /app

# Install system dependencies (libgomp1 for FAISS, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r backend/requirements.txt

# Copy the backend folder contents into /app/backend
COPY backend/ ./backend/

# Expose port
EXPOSE 8000

# Start FastAPI binding dynamically to the PORT environment variable provided by Render.
# Running from /app ensures that all relative paths inside the codebase to "backend/data" resolve perfectly.
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
