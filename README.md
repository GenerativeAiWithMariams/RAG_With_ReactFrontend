# Maryam's AI - Enterprise Document RAG Application

![Maryam's AI](https://img.shields.io/badge/Maryam's_AI-Enterprise_RAG-3b82f6?style=for-the-badge)

Maryam's AI is a production-grade, full-stack Retrieval-Augmented Generation (RAG) web application. It acts as an intelligent enterprise document assistant, allowing users to upload large PDFs and instantly query them using blazing-fast LLM generation (via Groq) and semantic vector search (via FAISS).

## ✨ Key Features

- **Automated Document Processing:** Automatically parses PDFs on startup, extracts text using PyMuPDF, chunks the data semantically, and generates high-quality PNG thumbnails for every page.
- **Intelligent RAG Engine:** Uses LangChain and HuggingFace Embeddings (`all-MiniLM-L6-v2`) to perform high-accuracy similarity search.
- **Grounded AI Answers:** Powered by the `llama-3.1-8b-instant` model via the Groq API, ensuring answers are strictly derived from the document to prevent hallucinations.
- **ChatGPT-Style Conversation Memory:** Features full persistent chat history, auto-generated conversation titles, and the ability to rename/delete chat threads.
- **Interactive Citations:** AI responses include clickable source cards. Clicking a citation instantly opens the exact page in the integrated PDF viewer.
- **Premium User Interface:** Built with React, Tailwind CSS, and Framer Motion, featuring a resizable split-panel layout, responsive mobile overlay, dark mode aesthetics, and glassmorphism styling.
- **Confidence Scoring:** Visual progress bars indicate the mathematical confidence of the AI's retrieval accuracy.

---

## 🛠️ Technology Stack

### Backend
*   **FastAPI** - High-performance asynchronous API
*   **LangChain** - LLM orchestration and RAG chains
*   **FAISS** - Vector database for fast semantic retrieval
*   **PyMuPDF (fitz)** - Advanced PDF processing and image rendering
*   **Groq API** - Ultra-fast LLM inference

### Frontend
*   **React 18 + Vite** - Lightning-fast UI rendering
*   **Tailwind CSS** - Utility-first styling with custom dark themes
*   **Framer Motion** - Fluid spring animations and transitions
*   **Lucide React** - Crisp, modern iconography

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Python 3.10+** and **Node.js 18+** installed on your system.

### 1. Clone the repository
```bash
git clone https://github.com/GenerativeAiWithMariams/RAG_WithFrontend.git
cd RAG_WithFrontend
```

### 2. Backend Setup
Navigate to the root directory and install Python dependencies:
```bash
pip install -r backend/requirements.txt
```

Create a `.env` file in the `backend/` directory and add your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
```

Add your PDF document:
*   Place the PDF file you want the AI to read into the `backend/data/` folder.

Start the FastAPI server:
```bash
python backend/main.py
```
*The backend runs on `http://localhost:8000`*

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```
*The frontend runs on `http://localhost:5173`*

---

## 💡 How to Use

1. Open `http://localhost:5173` in your browser.
2. The backend will automatically process the PDF inside `backend/data/` during startup (generating embeddings and previews).
3. Type a question in the chat box to query the document.
4. The AI will stream the answer and provide citation cards at the bottom of the message.
5. Click on a citation card to dynamically open the PDF viewer to the exact referenced page.
6. Use the draggable divider to resize the PDF viewer, or click the fullscreen icon for deep reading.
7. Click the **"New Chat"** button in the sidebar to start a fresh conversation while preserving your history.

---

## 📝 License

This project is licensed under the MIT License.
