# Maryam's AI - Enterprise Document RAG Application

This document outlines the complete architecture, implementation details, and features of the Enterprise Document RAG (Retrieval-Augmented Generation) application built with FastAPI, React, and Tailwind CSS.

## 1. System Architecture

The system is designed as a fully decoupled application with a Python-based intelligent backend and a React-based dynamic frontend.

### Backend (`/backend`)
*   **Framework:** FastAPI (Asynchronous, High-performance)
*   **Vector Database:** FAISS (Facebook AI Similarity Search) for fast semantic retrieval.
*   **LLM Provider:** Groq API (`llama-3.1-8b-instant`) for blazing-fast token generation.
*   **Embeddings:** HuggingFace (`all-MiniLM-L6-v2`) via `langchain-huggingface`.
*   **Document Processing:** PyMuPDF (`fitz`) for text extraction and page preview image generation.
*   **History Storage:** JSON-based persistent storage (`services/history.py`) mimicking a NoSQL document database.

### Frontend (`/frontend`)
*   **Framework:** React 18 + Vite
*   **Styling:** Tailwind CSS with custom glassmorphism and modern gradient UI tokens.
*   **Animations:** Framer Motion for smooth transitions, spring animations, and layout shifts.
*   **Icons:** Lucide React for consistent, crisp SVG iconography.
*   **Streaming:** Native HTTP streaming using `TextDecoder` to handle Server-Sent Events (SSE) seamlessly.

---

## 2. Core Features Implemented

### A. Automated Document Processing pipeline
*   **Startup Event:** On backend initialization, the system automatically looks for a PDF inside `backend/data/`.
*   **Smart Chunking:** Splits text semantically with exact overlap constraints to retain context across page boundaries.
*   **Visual Indexing:** Simultaneously generates PNG thumbnail previews for every page to serve visually alongside citations.

### B. Intelligent RAG Engine
*   **Hybrid Retrieval:** Retrieves the top `k=6` most semantically relevant chunks.
*   **Confidence Scoring:** Calculates an artificial confidence score based on FAISS L2 distance calculations.
*   **Grounded Prompts:** Custom system prompts force the LLM to synthesize answers strictly from the retrieved context, effectively mitigating hallucinations.

### C. Complete Conversation Management (ChatGPT-style)
*   **Persistent Sessions:** Every chat is assigned a unique UUID and saved to disk.
*   **CRUD Operations:** Users can create, read, rename, and delete chat threads.
*   **Auto-Titling:** The first user query in a new chat automatically becomes the thread title.
*   **State Restoration:** Navigating between past chats instantly restores the full conversation history including AI streaming chunks, citations, and confidence metrics.

### D. Premium PDF Viewer Interface
*   **Resizable Split-Panel:** A custom-built draggable divider allows users to scale the PDF viewer between 25% and 75% of the screen width dynamically.
*   **Deep-Linking:** Clicking a citation thumbnail auto-opens the PDF viewer and jumps directly to the specific page referenced.
*   **Responsive Overlays:** On smaller devices or tablets, the viewer smartly converts into an elegant full-screen drawer overlay.
*   **Maximized View:** A dedicated fullscreen toggle button lets users seamlessly expand the document for deep reading.

---

## 3. Directory Structure

```text
D:\Coding\New RAG\
├── backend/
│   ├── main.py                 # FastAPI application and route definitions
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables (GROQ & HF API keys)
│   ├── data/                   # Raw PDFs, generated preview images, and JSON database
│   │   ├── conversations.json  # Persistent chat history storage
│   │   └── previews/           # Auto-generated PNGs of PDF pages
│   ├── rag/
│   │   ├── processor.py        # PDF extraction, embedding, and FAISS indexing
│   │   └── qa.py               # LangChain streaming, retrieval logic, and prompt engineering
│   └── services/
│       └── history.py          # CRUD service for conversation management
└── frontend/
    ├── package.json            # NPM dependencies and scripts
    ├── vite.config.js          # Vite bundler configuration
    ├── tailwind.config.js      # Custom theme, colors (e.g., dark-600), and plugins
    ├── index.html              # Entry HTML file
    └── src/
        ├── App.jsx             # Main React component containing UI, state, and streaming logic
        ├── main.jsx            # React DOM rendering
        └── index.css           # Global CSS and custom scrollbar definitions
```

## 4. How to Run Locally

1.  **Backend:**
    ```powershell
    cd backend
    pip install -r requirements.txt
    python main.py
    ```
    *Ensure your `.env` contains `GROQ_API_KEY`.*

2.  **Frontend:**
    ```powershell
    cd frontend
    npm install
    npm run dev
    ```
    *Visit `http://localhost:5173` to view the application.*
