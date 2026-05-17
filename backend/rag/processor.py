import os
import fitz  # PyMuPDF
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from PIL import Image
import io

class DocumentProcessor:
    def __init__(self, data_dir="backend/data", persist_dir="backend/data/faiss_index"):
        self.data_dir = data_dir
        self.persist_dir = persist_dir
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vectorstore = None
        self.doc_path = None

    def initialize(self):
        # Find the PDF in the data directory
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)
            
        pdf_files = [f for f in os.listdir(self.data_dir) if f.endswith('.pdf')]
        if not pdf_files:
            print("No PDF found in data directory. Please add a PDF.")
            return False
            
        self.doc_path = os.path.join(self.data_dir, pdf_files[0])
        print(f"Found document: {self.doc_path}")
        
        # Load or create index
        if os.path.exists(self.persist_dir):
            print("Loading existing FAISS index...")
            self.vectorstore = FAISS.load_local(self.persist_dir, self.embeddings, allow_dangerous_deserialization=True)
            self._ensure_preview_images()
        else:
            print("Processing document and creating new FAISS index...")
            self.process_document()
            
        return True
        
    def process_document(self):
        doc = fitz.open(self.doc_path)
        documents = []
        
        # Ensure previews directory exists
        previews_dir = os.path.join(self.data_dir, "previews")
        if not os.path.exists(previews_dir):
            os.makedirs(previews_dir)
            
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            # Generate preview image
            pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
            img_path = os.path.join(previews_dir, f"page_{page_num + 1}.png")
            pix.save(img_path)
            
            # Add to documents
            if text.strip():
                metadata = {
                    "source": os.path.basename(self.doc_path),
                    "page": page_num + 1,
                    "preview": f"/api/data/previews/page_{page_num + 1}.png"
                }
                documents.append(Document(page_content=text, metadata=metadata))
                
        # Split texts
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", " ", ""]
        )
        
        chunks = text_splitter.split_documents(documents)
        
        # Add chunk IDs
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_id"] = i
            
        print(f"Created {len(chunks)} chunks from {len(doc)} pages.")
        
        # Create FAISS index
        self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
        self.vectorstore.save_local(self.persist_dir)
        print("FAISS index saved successfully.")
        
    def _ensure_preview_images(self):
        doc = fitz.open(self.doc_path)
        previews_dir = os.path.join(self.data_dir, "previews")
        if not os.path.exists(previews_dir):
            os.makedirs(previews_dir)
            
        # Check if all images exist
        for page_num in range(len(doc)):
            img_path = os.path.join(previews_dir, f"page_{page_num + 1}.png")
            if not os.path.exists(img_path):
                page = doc[page_num]
                pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
                pix.save(img_path)

processor = DocumentProcessor()
