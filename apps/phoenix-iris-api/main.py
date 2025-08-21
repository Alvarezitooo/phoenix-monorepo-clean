"""
🎯 Phoenix Iris API - Clean Reset
Assistant IA conversationnel
"""

import os
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment
load_dotenv()

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# FastAPI app
app = FastAPI(
    title="Phoenix Iris API",
    description="Assistant IA conversationnel (Clean Reset)",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if ENVIRONMENT == "development" else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: datetime

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    success: bool
    response: str
    conversation_id: str
    message_count: int
    timestamp: datetime

# In-memory storage (TODO: remplacer par DB)
conversations: Dict[str, List[ChatMessage]] = {}

# Routes
@app.get("/")
async def root():
    return {
        "service": "Phoenix Iris API",
        "status": "operational",
        "version": "1.0.0 (clean reset)"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "phoenix-iris-api",
        "environment": ENVIRONMENT,
        "conversations_count": len(conversations)
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Endpoint de chat avec Iris"""
    
    # Générer conversation_id si nécessaire
    conv_id = request.conversation_id or f"conv_{int(datetime.now().timestamp())}"
    
    # Initialiser conversation si nouvelle
    if conv_id not in conversations:
        conversations[conv_id] = []
    
    # Ajouter message utilisateur
    user_message = ChatMessage(
        role="user",
        content=request.message,
        timestamp=datetime.now()
    )
    conversations[conv_id].append(user_message)
    
    # Générer réponse (placeholder)
    # TODO: Intégration avec IA (Gemini/OpenAI)
    ai_response = generate_ai_response(request.message, conversations[conv_id])
    
    ai_message = ChatMessage(
        role="assistant",
        content=ai_response,
        timestamp=datetime.now()
    )
    conversations[conv_id].append(ai_message)
    
    return ChatResponse(
        success=True,
        response=ai_response,
        conversation_id=conv_id,
        message_count=len(conversations[conv_id]),
        timestamp=datetime.now()
    )

@app.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Récupère l'historique d'une conversation"""
    if conversation_id not in conversations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return {
        "conversation_id": conversation_id,
        "messages": conversations[conversation_id],
        "message_count": len(conversations[conversation_id])
    }

def generate_ai_response(message: str, history: List[ChatMessage]) -> str:
    """Génère une réponse IA (placeholder)"""
    # TODO: Implémenter logique IA réelle
    
    responses = [
        f"Je comprends votre question sur '{message[:30]}...'. Comment puis-je vous aider davantage ?",
        f"C'est une excellente question ! En tant qu'assistant Phoenix, je peux vous guider sur ce sujet.",
        f"Merci pour votre message. Voici mon analyse de votre demande...",
        "Je suis Iris, votre assistant Phoenix. Que puis-je faire pour vous aujourd'hui ?",
        f"Intéressant ! Vous mentionnez '{message[:20]}...'. Laissez-moi vous expliquer..."
    ]
    
    import random
    return random.choice(responses)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
