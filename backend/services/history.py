import json
import os
from datetime import datetime
import uuid

class ChatHistoryService:
    def __init__(self, data_file="backend/data/conversations.json"):
        self.data_file = data_file
        self.conversations = self._load()

    def _load(self):
        if os.path.exists(self.data_file):
            try:
                with open(self.data_file, "r") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save(self):
        os.makedirs(os.path.dirname(self.data_file), exist_ok=True)
        with open(self.data_file, "w") as f:
            json.dump(self.conversations, f, indent=2)

    def get_all_chats(self):
        # Return sorted by updated_at descending
        chats = []
        for chat_id, data in self.conversations.items():
            chats.append({
                "id": chat_id,
                "title": data.get("title", "New Chat"),
                "updated_at": data.get("updated_at", ""),
                "created_at": data.get("created_at", "")
            })
        chats.sort(key=lambda x: x["updated_at"], reverse=True)
        return chats

    def get_chat(self, chat_id: str):
        return self.conversations.get(chat_id)

    def create_chat(self, title: str = "New Chat"):
        chat_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        self.conversations[chat_id] = {
            "id": chat_id,
            "title": title,
            "messages": [],
            "created_at": now,
            "updated_at": now
        }
        self._save()
        return self.conversations[chat_id]

    def rename_chat(self, chat_id: str, new_title: str):
        if chat_id in self.conversations:
            self.conversations[chat_id]["title"] = new_title
            self.conversations[chat_id]["updated_at"] = datetime.now().isoformat()
            self._save()
            return True
        return False

    def delete_chat(self, chat_id: str):
        if chat_id in self.conversations:
            del self.conversations[chat_id]
            self._save()
            return True
        return False

    def add_message(self, chat_id: str, message: dict):
        if chat_id in self.conversations:
            # message should be a dict like {"id": ..., "type": ..., "content": ..., "timestamp": ..., "citations": ..., "confidence": ...}
            self.conversations[chat_id]["messages"].append(message)
            
            # Auto-generate title from first user message if it's "New Chat"
            if len(self.conversations[chat_id]["messages"]) <= 2 and self.conversations[chat_id]["title"] == "New Chat":
                if message["type"] == "user":
                    # Truncate to 30 chars
                    self.conversations[chat_id]["title"] = message["content"][:30] + ("..." if len(message["content"]) > 30 else "")
            
            self.conversations[chat_id]["updated_at"] = datetime.now().isoformat()
            self._save()
            return True
        return False

history_service = ChatHistoryService()
