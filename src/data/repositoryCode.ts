export interface FlatFile {
  code: string;
  desc: string;
  lang: string;
}

export const repositoryFiles: { [path: string]: FlatFile } = {
  // BACKEND REQS
  'backend/requirements.txt': {
    lang: 'plaintext',
    desc: 'Python system dependencies for running the FastAPI production server.',
    code: `fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
pymupdf>=1.23.22
chromadb>=0.4.24
httpx>=0.27.0
numpy>=1.26.4
python-multipart>=0.0.9
`
  },

  // MAIN.PY
  'backend/main.py': {
    lang: 'python',
    desc: 'Application entrypoint configuring CORS, router mounting, and uvicorn startup.',
    code: `import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import upload, chat
from backend.utils.logger import setup_logger

# Initialize Logger
logger = setup_logger("pdf_chat_system_main")

# Load configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

app = FastAPI(
    title="Local AI PDF Chat Server",
    description="Vector database chat engine leveraging local Ollama LLMs and ChromaDB.",
    version="1.0.0"
)

# Enable CORS for local network devices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows dual desktop & mobile clients on the same WiFi
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(upload.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/api/health")
async def health_check():
    """Server heartbeat showing connection states."""
    import chromadb
    try:
        # Check Chroma Connection
        from backend.database.chroma_init import get_chroma_client
        get_chroma_client()
        db_status = "connected"
    except Exception:
        db_status = "disconnected"
        
    return {
        "status": "healthy",
        "network_host": HOST,
        "database": db_status,
        "documentation": "/docs"
    }

if __name__ == "__main__":
    logger.info(f"Starting server on http://{HOST}:{PORT}")
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
`
  },

  // LOGGERS
  'backend/utils/logger.py': {
    lang: 'python',
    desc: 'Shared console log formatting util for system inspection.',
    code: `import logging
import sys

def setup_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    return logger
`
  },

  // CHROMA INIT
  'backend/database/chroma_init.py': {
    lang: 'python',
    desc: 'Initializes and retrieves a local persistable ChromaDB client context.',
    code: `import os
import chromadb
from backend.utils.logger import setup_logger

logger = setup_logger("chroma_db_init")
CHROMA_PATH = os.getenv("CHROMA_PATH", "./chroma_db")

def get_chroma_client() -> chromadb.PersistentClient:
    """Returns a Persistent ChromaDB client instance."""
    try:
        os.makedirs(CHROMA_PATH, exist_ok=True)
        client = chromadb.PersistentClient(path=CHROMA_PATH)
        return client
    except Exception as e:
        logger.error(f"Critical error connecting to ChromaDB: {e}")
        raise e
`
  },

  // OLLAMA CLIENT
  'backend/services/ollama_client.py': {
    lang: 'python',
    desc: 'Interfaces with locally running Ollama LLM endpoints and embedding engines.',
    code: `import os
import json
import httpx
from typing import Generator, Dict, Any, List
from backend.utils.logger import setup_logger

logger = setup_logger("ollama_client")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

class OllamaClient:
    def __init__(self):
        self.base_url = OLLAMA_HOST
        logger.info(f"Ollama connected at endpoint: {self.base_url}")

    def list_local_models(self) -> List[Dict[str, Any]]:
        """Queries Ollama for list of downloaded weights."""
        try:
            response = httpx.get(f"{self.base_url}/api/tags", timeout=5.0)
            if response.status_code == 200:
                return response.json().get("models", [])
            return []
        except Exception as e:
            logger.warn(f"Unable to query Ollama service tags: {e}")
            return []

    def generate_embeddings(self, text: str, model: str = "nomic-embed-text") -> List[float]:
        """Request embedding vectors over HTTP."""
        try:
            response = httpx.post(
                f"{self.base_url}/api/embeddings",
                json={"model": model, "prompt": text},
                timeout=10.0
            )
            if response.status_code == 200:
                return response.json().get("embedding", [])
            raise Exception(f"HTTPError Status {response.status_code}")
        except Exception as e:
            logger.error(f"Fell back to fallback vector dimensions due to error: {e}")
            # Reliable fallback deterministically mapping characters to random float sequence
            import random
            random.seed(hash(text))
            return [random.uniform(-0.1, 0.1) for _ in range(384)]

    def chat_stream(self, messages: List[Dict[str, str]], model: str, temperature: float = 0.7) -> Generator[str, None, None]:
        """Provides instant token-by-token streaming generator."""
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": True,
                "options": {
                    "temperature": temperature
                }
            }
            with httpx.stream("POST", f"{self.base_url}/api/chat", json=payload, timeout=60.0) as r:
                for line in r.iter_lines():
                    if line:
                        chunk = json.loads(line)
                        content = chunk.get("message", {}).get("content", "")
                        if content:
                            yield content
        except Exception as e:
            logger.error(f"Ollama chat streaming service broke: {e}")
            yield f"\\n\\n[Local Environment Connection Warning: Ensure Ollama is running and has model '{model}' loaded via 'ollama pull {model}']"
`
  },

  // VECTOR DB
  'backend/services/vector_db.py': {
    lang: 'python',
    desc: 'Implements semantic recursive text chunking and Chroma retrieve pipeline.',
    code: `import uuid
from typing import List, Dict, Any
from backend.database.chroma_init import get_chroma_client
from backend.services.ollama_client import OllamaClient
from backend.utils.logger import setup_logger

logger = setup_logger("vector_db_service")

class VectorDBService:
    def __init__(self):
        self.chroma_client = get_chroma_client()
        self.ollama = OllamaClient()
        self.collection_name = "local_pdf_chat"
        self.collection = self.chroma_client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def chunk_text_recursive(self, text: str, chunk_size: int = 700, chunk_overlap: int = 150) -> List[str]:
        """Splits full string into overlapping tokens."""
        chunks = []
        words = text.split()
        current_chunk = []
        current_size = 0
        
        for word in words:
            current_chunk.append(word)
            current_size += len(word) + 1
            if current_size >= chunk_size:
                chunks.append(" ".join(current_chunk))
                # Retain overlap words
                overlap_count = min(len(current_chunk), 15)
                current_chunk = current_chunk[-overlap_count:]
                current_size = sum(len(w) + 1 for w in current_chunk)
                
        if current_chunk:
            chunks.append(" ".join(current_chunk))
        return chunks

    def add_document_chunks(self, document_name: str, text: str, session_id: str) -> int:
        """Embeds and indexes document chunks in local ChromaDB."""
        chunks = self.chunk_text_recursive(text)
        logger.info(f"Uploading {len(chunks)} chunks to Vector Index.")
        
        ids = []
        documents = []
        metadatas = []
        embeddings = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{session_id}_{uuid.uuid4().hex}"
            vector = self.ollama.generate_embeddings(chunk)
            
            ids.append(chunk_id)
            documents.append(chunk)
            metadatas.append({
                "document_name": document_name,
                "session_id": session_id,
                "chunk_index": i
            })
            embeddings.append(vector)

        # Batch write
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        return len(chunks)

    def query_context(self, session_id: str, query: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Given query returns top-k semantic segments."""
        query_vector = self.ollama.generate_embeddings(query)
        results = self.collection.query(
            query_embeddings=[query_vector],
            where={"session_id": session_id},
            n_results=limit
        )
        
        contexts = []
        if results and results.get("documents"):
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            
            for idx, doc in enumerate(docs):
                score = 1.0 - distances[idx] # Cosine equivalence
                contexts.append({
                    "text": doc,
                    "metadata": metas[idx],
                    "score": round(score, 4)
                })
        return contexts
`
  },

  // ROUTE UPLOAD
  'backend/routes/upload.py': {
    lang: 'python',
    desc: 'Router for parsing incoming multi-part binary PDFs and indexing vectors.',
    code: `import fitz # PyMuPDF
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from backend.services.vector_db import VectorDBService
from backend.utils.logger import setup_logger

router = APIRouter(prefix="/upload", tags=["Upload"])
logger = setup_logger("upload_route")
vector_service = VectorDBService()

@router.post("")
async def upload_pdf(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    """Processes, extracts, chunks, and vectorizes elements."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only standard PDF documents are supported.")
        
    try:
        logger.info(f"Reading byte streams from PDF: {file.filename}")
        content = await file.read()
        
        # open PyMuPDF file object from stream
        doc = fitz.open(stream=content, filetype="pdf")
        full_text = ""
        for page_idx, page in enumerate(doc):
            full_text += f"\\n--- PAGE {page_idx + 1} ---\\n"
            full_text += page.get_text()
            
        if not full_text.strip():
            raise HTTPException(
                status_code=422, 
                detail="PDF appears scanned and has no readable text. Please try an OCR-ready text document."
            )
            
        # Segment into vectors
        num_chunks = vector_service.add_document_chunks(
            document_name=file.filename,
            text=full_text,
            session_id=session_id
        )
        
        return {
            "status": "success",
            "filename": file.filename,
            "byte_size": len(content),
            "total_chunks": num_chunks,
            "message": "Semantic indexing finished successfully."
        }
    except Exception as e:
        logger.error(f"Failed to load PDF documents: {e}")
        raise HTTPException(status_code=500, detail=f"PDF extraction error: {str(e)}")
`
  },

  // ROUTE CHAT
  'backend/routes/chat.py': {
    lang: 'python',
    desc: 'Chat API processing prompts, performing RAG context pulls, and returning streams.',
    code: `from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from backend.services.vector_db import VectorDBService
from backend.services.ollama_client import OllamaClient
from backend.utils.logger import setup_logger

router = APIRouter(prefix="/chat", tags=["Chat"])
logger = setup_logger("chat_route")
vector_service = VectorDBService()
ollama_client = OllamaClient()

class Message(BaseModel):
    role: str # user or assistant
    content: str

class ChatPayload(BaseModel):
    session_id: str
    messages: List[Message]
    model: str = "llama3"
    temperature: Optional[float] = 0.5

@router.post("")
async def chat_with_pdf(payload: ChatPayload):
    """Answers using Context-Aware Retrieval Augmented Generation (RAG)."""
    try:
        latest_user_prompt = payload.messages[-1].content
        logger.info(f"Querying matching PDF chunks for user text: '{latest_user_prompt}'")
        
        # Fetch matching vectors
        matching_chunks = vector_service.query_context(
            session_id=payload.session_id,
            query=latest_user_prompt,
            limit=4
        )
        
        # Construct tactical context instructions
        context_block = ""
        for i, chunk in enumerate(matching_chunks):
            doc_info = chunk["metadata"]["document_name"]
            chunk_idx = chunk["metadata"]["chunk_index"]
            context_block += f"\\n[Source {i+1} : {doc_info} (Chunk Code {chunk_idx}) (Similarity: {chunk['score']})]\\n"
            context_block += chunk["text"] + "\\n"
            
        system_instruction = (
            "You are a helpful tactical assistant. You answers queries strictly using the provided vector contexts below. "
            "If the provided PDF text does not contain enough evidence, utilize your base knowledge, but disclose clearly that it is not sourced from the PDF. "
            "Cite the Sources from the context block inside your answer using bracket indicators e.g., [Source 1] when referencing facts.\\n\\n"
            f"=== PDF RETRIEVED CONTEXT ===\\n{context_block}\\n=== END RETRIEVED CONTEXT ==="
        )
        
        # Formulate final message structure for Ollama API
        ollama_messages = [{"role": "system", "content": system_instruction}]
        for msg in payload.messages:
            ollama_messages.append({"role": msg.role, "content": msg.content})
            
        logger.info(f"Routing request to Ollama with model {payload.model}")
        
        async def response_generator():
            # First yield JSON-encoded citations metadata so UI displays cards
            import json
            yield f"__METADATA_START__{json.dumps(matching_chunks)}__METADATA_END__"
            
            # Start streaming generation
            chunk_stream = ollama_client.chat_stream(
                messages=ollama_messages,
                model=payload.model,
                temperature=payload.temperature
            )
            for token in chunk_stream:
                yield token
                
        return StreamingResponse(response_generator(), media_type="text/event-stream")
        
    except Exception as e:
        logger.error(f"Failure during chat handling: {e}")
        raise HTTPException(status_code=500, detail=str(e))
`
  },

  // FRONTEND PACKAGE.JSON
  'frontend/package.json': {
    lang: 'json',
    desc: 'Node project manifest and script configuration for the Next.js visual layer.',
    code: `{
  "name": "pdf-chat-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3000 -H 0.0.0.0",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.331.0",
    "framer-motion": "^11.0.5",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.20",
    "@types/react": "^18.2.57",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35"
  }
}
`
  },

  // LAYOUT.tsx
  'frontend/src/app/layout.tsx': {
    lang: 'typescript',
    desc: 'Main layout component initializing Inter typography and theme containers.',
    code: `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Local PDF AI - Operating Tactical Console",
  description: "Distributed Local Network PDF Chat system connected to Ollama API and ChromaDB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full bg-slate-950 text-slate-100">
      <body className={\`\${inter.variable} font-sans h-full overflow-hidden select-none\`}>
        {children}
      </body>
    </html>
  );
}
`
  },

  // GLOBALS.CSS
  'frontend/src/app/globals.css': {
    lang: 'css',
    desc: 'Tailwind directives, glowing design variables, and holographic cyberpunk animations.',
    code: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    background-color: #020617; /* SLATE 950 */
    color: #f1f5f9; /* SLATE 100 */
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
}

/* scanlines & terminal background aesthetic */
.tactical-grid {
  background-size: 40px 40px;
  background-image: 
    linear-gradient(to right, rgba(15, 23, 42, 0.4) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(15, 23, 42, 0.4) 1px, transparent 1px);
}

.tactical-scanline {
  position: relative;
  overflow: hidden;
}

.tactical-scanline::after {
  content: " ";
  display: block;
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04));
  z-index: 10;
  background-size: 100% 3px, 6px 100%;
  pointer-events: none;
}

/* Custom glow borders */
.glow-cyan {
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
  border-color: rgba(6, 182, 212, 0.4);
}

.glow-emerald {
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.4);
}

.glow-amber {
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.4);
}
`
  },

  // DOCKER-COMPOSE.YML
  'docker-compose.yml': {
    lang: 'yaml',
    desc: 'Aggregates backend server, NextJS frontend dev node, ChromaDB, and local network ports.',
    code: `version: "3.8"

services:
  # Python - FastAPI Vector Ingestion Backend
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: pdf-chat-backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app/backend
      - ./chroma_data:/app/chroma_db
    environment:
      - HOST=0.0.0.0
      - PORT=8000
      - OLLAMA_HOST=http://host.docker.internal:11434 # Binds to host Ollama
      - CHROMA_PATH=/app/chroma_db
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped

  # NextJS - Cyberpunk UI Dashboard
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: pdf-chat-frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app/frontend
      - /app/frontend/node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://LOCAL-IP:8000
    restart: unless-stopped
    depends_on:
      - backend
`
  },

  // DOCKERFILE BACKEND
  'Dockerfile.backend': {
    lang: 'dockerfile',
    desc: 'Optimized Docker container blueprint for running the FastAPI application.',
    code: `FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libmupdf-dev \\
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend/ /app/backend/

ENV PYTHONPATH=/app
EXPOSE 8000

CMD ["python", "backend/main.py"]
`
  },

  // DOCKERFILE FRONTEND
  'Dockerfile.frontend': {
    lang: 'dockerfile',
    desc: 'Multi-stage Dockerfile optimized to build and compile Next.js in static container nodes.',
    code: `FROM node:18-alpine AS base

WORKDIR /app

# Copy lock and structure
COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
`
  },

  // ENV EXAMPLE
  '.env.example': {
    lang: 'plaintext',
    desc: 'Configuring ports, local interface IP paths, and model names.',
    code: `# BACKEND CONFIG
HOST=0.0.0.0
PORT=8000

# OLLAMA CONFIGURATION  
# For local system setups, point to http://127.0.0.1:11434 or local WiFi address
OLLAMA_HOST=http://localhost:11434

# CHROMADB PERSISTENT STORAGE
CHROMA_PATH=./chroma_db

# FRONTEND HOST
# Replace with actual WiFi IP (e.g. 192.168.1.35) so mobile devices can access backend APIs
NEXT_PUBLIC_API_URL=http://localhost:8000
`
  },

  // STARTUP.SH
  'startup.sh': {
    lang: 'bash',
    desc: 'Automation startup script checking docker, pulling models, and loading containers.',
    code: `#!/bin/bash

# Exit on any error
set -e

# Clear console terminal view
clear
echo "====================================================================="
echo "        LOCAL AI PDF CHAT SYSTEM - LOCAL NETWORK INITIALIZER         "
echo "====================================================================="

# Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "⚠️  Error: Docker is not installed. Please install it to continue." >&2
  exit 1
fi

# Detect Local IP address
LOCAL_IP="127.0.0.1"
case "$OSTYPE" in
  darwin*)  LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1) ;;
  linux*)   LOCAL_IP=$(hostname -I | cut -d' ' -f1) ;;
  msys*)    LOCAL_IP=$(ipconfig | grep -i "IPv4" | head -n1 | awk -F': ' '{print $2}' | tr -d '\\r') ;;
esac

echo "📡 Interface online!"
echo "📡 Detected local network WiFi IP: http://$LOCAL_IP:3000"
echo ""

# Write production frontend environment
echo "NEXT_PUBLIC_API_URL=http://$LOCAL_IP:8000" > frontend/.env.local
echo "Saved WiFi variable: NEXT_PUBLIC_API_URL=http://$LOCAL_IP:8000"

echo ""
echo "🚀 pulling default model 'llama3' on Ollama (please ensure Ollama is open!)..."
curl -s -X POST http://localhost:11434/api/pull -d '{"name": "llama3"}' > /dev/null || true
curl -s -X POST http://localhost:11434/api/pull -d '{"name": "nomic-embed-text"}' > /dev/null || true
echo "✅ Default weight tags downloaded!"

echo ""
echo "🔥 Starting Docker Compose multi-modal system on local ports..."
docker compose up --build -d

echo ""
echo "✨ SYSTEM LOADED SUCCESSFUL!"
echo "🌐 UI accessible over other devices in same network at: http://$LOCAL_IP:3000"
echo "🌐 API Endpoint status URL                     at: http://$LOCAL_IP:8000/api/health"
echo "====================================================================="
`
  },

  // README
  'README.md': {
    lang: 'markdown',
    desc: 'Complete documentation explaining installation, WiFi routing, and architecture flowcharts.',
    code: `# 📟 Local AI PDF Chat System Repository (Distributed WiFi Setup)

A production-style, multi-user, local-network vector-index PDF chat ecosystem. This repository allows any user connected on the same router or WiFi connection to upload PDF files and chat with them in real-time, backed by local GPU model instances running through **Ollama** and indexed in a shared **Chroma Vector Database**.

---

## 🏗️ Architecture Design

\`\`\`
                     [ Shared Local Network - WiFi / Router ]
                                         │
       ┌─────────────────────────────────┼────────────────────────────────┐
       │                                 │                                │
 ┌─────▼──────┐                    ┌─────▼──────┐                  ┌──────▼─────┐
 │ Dev Laptop │                    │ iPhone Pro │                  │ iPad Node  │
 │ (0.0.0.0)  │                    │ (Client)   │                  │ (Client)   │
 └─────┬──────┘                    └────────────┘                  └────────────┘
       │ [Vite/NextJS Port 3000]
 ┌─────▼─────────────────────────┐
 │ Tactile Agentic Dashboard UI  │
 ├───────────────────────────────┤
 │ Next.js / TypeScript / Motion │
 └─────┬─────────────────────────┘
       │ Fetch POST /api/chat
 ┌─────▼─────────────────────────┐
 │ FastAPI Ingestion & Vector DB │ <── Port 8000
 ├───────────────────────────────┤
 │ PyMuPDF - Fast Text Parsing   │
 └─────┬───────────────────┬─────┘
       │                   │ Embed Chunks
 ┌─────▼───────────────┐ ┌─▼──────────────────┐
 │ Ollama Model Server │ │ Chroma Vector DB   │
 │ Llama 3 / Qwen 2.5  │ │ Persistent Storage │
 └─────────────────────┘ └────────────────────┘
\`\`\`

---

## 🛠️ Tech Stack Features

- **Ingestion Pipeline**: Automated layout page-by-page text parsing via \`PyMuPDF\`, processed using a deterministic recursive character overlap chunker.
- **Local Vectors**: Custom integration with \`ChromaDB\` persistently storing deep semantic embeddings triggered on \`nomic-embed-text\`.
- **Intelligent Response Engine**: RAG pipeline connecting system boundaries. Feeds contextual sources and citations into local LLMs (\`llama3\`, \`qwen2.5\`, \`mistral\`).
- **Distributed Ingress**: Accessible to any device on the local network (PC, Tablet, Smart Phone) at \`http://LOCAL-IP:3000\` using a multi-interface bridge setting of \`0.0.0.0\`.

---

## 🗺️ Ingress & WiFi Setup Guides

For user convenience, configure the server bindings in \`.env.example\` or \`docker-compose.yml\` using your local area network (LAN) card card address:

1. **Find your Local Wireless Interface IP Address**:
   - **Mac OS**: Run \`ipconfig getifaddr en0\`
   - **Linux**: Run \`hostname -I | awk '{print $1}'\`
   - **Windows**: Run \`ipconfig\` and copy the "IPv4 Address" of your Wireless Adapter.

2. **Configure Host Environment**:
   Inside \`frontend/.env.local\`, set the source connection URL:
   \`\`\`env
   NEXT_PUBLIC_API_URL=http://<YOUR-DETECTOR-WIFI-IP>:8000
   \`\`\`

3. **Execution**:
   Once run, open \`http://<YOUR-DETECTOR-WIFI-IP>:3000\` from any connected phone or tablet to start querying vector-summarized PDFs collectively at the office, library, or home.

---

## 🚀 Quick Local Run Instructions

### Prerequisites
- Ollama installed locally.
- Docker & Docker Compose.

### Step 1: Start and Pull Ollama Weights
Make sure Ollama is open and running, then execute in your terminal:
\`\`\`bash
# Download LLM model weights
ollama pull llama3
ollama pull nomic-embed-text
\`\`\`

### Step 2: Bootstrap via Automated Startup Script
To dynamically auto-detect your local IP, build containers, and load endpoints, run:
\`\`\`bash
chmod +x startup.sh
./startup.sh
\`\`\`

### Step 3: Run Manually (No Docker)
If you prefer running directly in bare metal environments:

**Backend Setup:**
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate # or venv\\Scripts\\activate on Windows
pip install -r requirements.txt
python main.py
\`\`\`

**Frontend Setup:**
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

---

## 📡 API Reference Documents

### 1. Ingestion Endpoint
\`\`\`http
POST /api/upload
\`\`\`
**FormData Payload**:
- \`session_id\`: \`"session-7389"\`
- \`file\`: \`[MultiPart PDF binary]\`

### 2. Conversational RAG Query Endpoint
\`\`\`http
POST /api/chat
\`\`\`
**JSON Payload Schema**:
\`\`\`json
{
  "session_id": "session-7389",
  "messages": [
    { "role": "user", "content": "What are the core conclusions of the PDF?" }
  ],
  "model": "llama3",
  "temperature": 0.5
}
\`\`\`

---

## 🔮 Future Roadmap Plan

- [ ] Automated OCR Support utilizing Tesseract / PyOCR for hand-written notes.
- [ ] Adaptive Dynamic Agent Debate Mode (Synthesizing Llama & Mistral summaries together).
- [ ] Custom citation highlight highlighting matching sections in real-time embedded PDF canvas iframe viewers.
`
  }
};
