from fastapi import FastAPI, HTTPException  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

# Validate API key exists
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
if not ANTHROPIC_API_KEY:
    print("⚠️  WARNING: ANTHROPIC_API_KEY not found in .env file!")
    print("   Create a .env file in the backend folder with:")
    print("   ANTHROPIC_API_KEY=sk-ant-your-key-here")

from database import SessionLocal, Agent as DBAgent, Message as DBMessage
from agent import AgentExecutor

# ── App Setup ────────────────────────────────────────────────
app = FastAPI(
    title="AI Agent Platform API",
    description="Backend for AI Agent Orchestration Platform",
    version="1.0.0"
)

# ── CORS ─────────────────────────────────────────────────────
# Allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Models ──────────────────────────────────────────
class AgentCreate(BaseModel):
    name: str
    role: str
    instructions: str
    model: str = "claude-sonnet-4-20250514"

class AgentResponse(BaseModel):
    id: int
    name: str
    role: str
    instructions: str
    model: str

    class Config:
        from_attributes = True

class ChatMessageModel(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    agent_id: int
    message: str
    history: List[ChatMessageModel] = []

# ── Routes ───────────────────────────────────────────────────

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "message": "AI Agent Platform API is running! ✅",
        "version": "1.0.0",
        "api_key_set": bool(ANTHROPIC_API_KEY),
        "docs": "http://localhost:8000/docs"
    }

@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "api_key_configured": bool(ANTHROPIC_API_KEY),
        "database": "connected"
    }

# ── Agent Endpoints ──────────────────────────────────────────

@app.post("/agents/", response_model=AgentResponse)
def create_agent(agent: AgentCreate):
    """Create a new AI agent"""
    db = SessionLocal()
    try:
        db_agent = DBAgent(
            name=agent.name,
            role=agent.role,
            instructions=agent.instructions,
            model=agent.model
        )
        db.add(db_agent)
        db.commit()
        db.refresh(db_agent)
        return db_agent
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating agent: {str(e)}")
    finally:
        db.close()

@app.get("/agents/", response_model=List[AgentResponse])
def list_agents():
    """List all agents"""
    db = SessionLocal()
    try:
        agents = db.query(DBAgent).all()
        return agents
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agents: {str(e)}")
    finally:
        db.close()

@app.get("/agents/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int):
    """Get a specific agent by ID"""
    db = SessionLocal()
    try:
        agent = db.query(DBAgent).filter(DBAgent.id == agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail=f"Agent with id {agent_id} not found")
        return agent
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching agent: {str(e)}")
    finally:
        db.close()

@app.put("/agents/{agent_id}", response_model=AgentResponse)
def update_agent(agent_id: int, agent: AgentCreate):
    """Update an existing agent"""
    db = SessionLocal()
    try:
        db_agent = db.query(DBAgent).filter(DBAgent.id == agent_id).first()
        if not db_agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        db_agent.name = agent.name
        db_agent.role = agent.role
        db_agent.instructions = agent.instructions
        db_agent.model = agent.model
        db.commit()
        db.refresh(db_agent)
        return db_agent
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating agent: {str(e)}")
    finally:
        db.close()

@app.delete("/agents/{agent_id}")
def delete_agent(agent_id: int):
    """Delete an agent"""
    db = SessionLocal()
    try:
        db_agent = db.query(DBAgent).filter(DBAgent.id == agent_id).first()
        if not db_agent:
            raise HTTPException(status_code=404, detail="Agent not found")
        db.delete(db_agent)
        db.commit()
        return {"message": f"Agent {agent_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting agent: {str(e)}")
    finally:
        db.close()

# ── Chat Endpoint ────────────────────────────────────────────

@app.post("/chat/")
async def chat(request: ChatRequest):
    """Send a message to an agent and get a response"""

    # Check API key
    if not ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY not configured. Please add it to your .env file."
        )

    db = SessionLocal()
    try:
        # Get agent from database
        agent = db.query(DBAgent).filter(DBAgent.id == request.agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        # Build agent config
        agent_config = {
            "name": agent.name,
            "role": agent.role,
            "instructions": agent.instructions,
            "model": agent.model
        }

        # Build message history for Claude API
        messages = []
        for msg in request.history:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Add the new user message
        messages.append({
            "role": "user",
            "content": request.message
        })

        # Execute agent
        executor = AgentExecutor(agent_config)
        result = await executor.run(messages)

        # Save messages to database
        user_msg = DBMessage(
            agent_id=request.agent_id,
            role="user",
            content=request.message
        )
        assistant_msg = DBMessage(
            agent_id=request.agent_id,
            role="assistant",
            content=result["content"]
        )
        db.add(user_msg)
        db.add(assistant_msg)
        db.commit()

        return {
            "content": result["content"],
            "tool_used": result.get("tool_used"),
            "tool_input": result.get("tool_input"),
            "tool_result": result.get("tool_result"),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")
    finally:
        db.close()

@app.get("/agents/{agent_id}/messages")
def get_agent_messages(agent_id: int, limit: int = 50):
    """Get chat history for an agent"""
    db = SessionLocal()
    try:
        messages = (
            db.query(DBMessage)
            .filter(DBMessage.agent_id == agent_id)
            .order_by(DBMessage.created_at.asc())
            .limit(limit)
            .all()
        )
        return [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching messages: {str(e)}")
    finally:
        db.close()

# ── Run Server ───────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    print("\n" + "="*50)
    print("🚀 AI Agent Platform Backend Starting...")
    print("="*50)
    print(f"📡 API URL:  http://localhost:8000")
    print(f"📚 API Docs: http://localhost:8000/docs")
    print(f"🔑 API Key:  {'✅ Configured' if ANTHROPIC_API_KEY else '❌ MISSING - Add to .env!'}")
    print("="*50 + "\n")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Auto-restart on code changes
    )