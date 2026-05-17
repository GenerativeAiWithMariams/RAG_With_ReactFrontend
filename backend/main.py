from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import uvicorn
from fastapi.staticfiles import StaticFiles
import os

from rag.processor import DocumentProcessor
from rag.qa import QAService

app = FastAPI(title="Enterprise AI RAG")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

processor = DocumentProcessor()
qa_service = None

@app.on_event("startup")
async def startup_event():
    global qa_service
    success = processor.initialize()
    if success and processor.vectorstore:
        qa_service = QAService(processor.vectorstore)
    else:
        print("Warning: Failed to initialize document processor. App will run but QA will fail.")

# Mount the static directory for data and previews
# Make sure backend/data exists
os.makedirs("backend/data", exist_ok=True)
app.mount("/api/data", StaticFiles(directory="backend/data"), name="data")

from services.history import history_service
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None

class CreateChatRequest(BaseModel):
    title: Optional[str] = "New Chat"

class RenameChatRequest(BaseModel):
    title: str

@app.get("/api/chats")
async def get_chats():
    return {"chats": history_service.get_all_chats()}

@app.post("/api/chats")
async def create_chat(request: CreateChatRequest):
    return history_service.create_chat(request.title)

@app.get("/api/chats/{chat_id}")
async def get_chat(chat_id: str):
    chat = history_service.get_chat(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@app.put("/api/chats/{chat_id}")
async def rename_chat(chat_id: str, request: RenameChatRequest):
    if not history_service.rename_chat(chat_id, request.title):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"status": "success"}

@app.delete("/api/chats/{chat_id}")
async def delete_chat(chat_id: str):
    if not history_service.delete_chat(chat_id):
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"status": "success"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    if not qa_service:
        raise HTTPException(status_code=500, detail="Document processor not initialized")
        
    chat_id = request.chat_id
    if chat_id:
        import time
        from datetime import datetime
        # Save user message
        user_message = {
            "id": int(time.time() * 1000),
            "type": "user",
            "content": request.message,
            "timestamp": datetime.now().strftime("%I:%M %p")
        }
        history_service.add_message(chat_id, user_message)

    return StreamingResponse(
        qa_service.get_streaming_response(request.message, chat_id, history_service),
        media_type="text/event-stream"
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
