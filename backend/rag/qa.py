from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from typing import AsyncGenerator
import json
import os
from dotenv import load_dotenv

load_dotenv()

class QAService:
    def __init__(self, vectorstore):
        self.vectorstore = vectorstore
        # We will use streaming in the actual generation
        self.llm = ChatGroq(
            temperature=0,
            model_name="llama-3.1-8b-instant",
            groq_api_key=os.environ.get("GROQ_API_KEY")
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a highly accurate enterprise AI assistant.
Answer the user's question using the provided context below. 
You can synthesize and infer information from the context if a direct answer isn't explicitly stated, but do not hallucinate outside the given text.
If the context is completely unrelated to the question, say "I cannot answer this based on the provided document."

Context:
{context}"""),
            ("human", "{input}")
        ])
        
    async def get_streaming_response(self, question: str, chat_id: str = None, history_service = None) -> AsyncGenerator[str, None]:
        # Retrieve relevant documents with scores
        docs_and_scores = self.vectorstore.similarity_search_with_score(question, k=6)
        
        # Prepare citations
        citations = []
        context_texts = []
        scores = []
        for doc, score in docs_and_scores:
            context_texts.append(doc.page_content)
            citations.append({
                "page": doc.metadata.get("page"),
                "chunk_id": doc.metadata.get("chunk_id"),
                "source": doc.metadata.get("source"),
                "preview": doc.metadata.get("preview")
            })
            scores.append(score)
            
        context = "\n\n---\n\n".join(context_texts)
        
        # Calculate a simple confidence score (normalized)
        avg_score = sum(scores) / len(scores) if scores else 1.0
        confidence = max(0, min(100, int((1.0 - (avg_score / 2.0)) * 100)))
        
        # Send citations and confidence first
        yield json.dumps({"type": "citations", "data": citations}) + "\n"
        yield json.dumps({"type": "meta", "data": {"confidence": confidence}}) + "\n"
        
        # Stream answer
        chain = self.prompt | self.llm
        
        full_response = ""
        try:
            async for chunk in chain.astream({"context": context, "input": question}):
                full_response += chunk.content
                yield json.dumps({"type": "chunk", "data": chunk.content}) + "\n"
        except Exception as e:
            print(f"Streaming Error: {str(e)}")
            error_msg = f"Error generating response: {str(e)}"
            full_response += f"\n\n**Error:** {error_msg}"
            yield json.dumps({"type": "error", "data": error_msg}) + "\n"
            
        # Save to history if chat_id and history_service are provided
        if chat_id and history_service:
            import time
            from datetime import datetime
            ai_message = {
                "id": int(time.time() * 1000) + 1,
                "type": "ai",
                "content": full_response,
                "citations": citations,
                "confidence": confidence,
                "timestamp": datetime.now().strftime("%I:%M %p")
            }
            history_service.add_message(chat_id, ai_message)
