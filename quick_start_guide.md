# QUICK START GUIDE: BUILD YOUR FIRST AGENT IN 1 DAY

This guide will help you build a working prototype in 24 hours to validate the concept.

---

## 🎯 TODAY'S GOAL

Build a simple web app where users can:
1. Create an AI agent with custom instructions
2. Give the agent access to a tool (e.g., search, calculator)
3. Chat with the agent and see it use the tool
4. Save conversation history

**Tech Stack:**
- Frontend: Next.js + React
- Backend: FastAPI (Python)
- AI: Anthropic Claude API
- Database: SQLite (for simplicity)

---

## STEP 1: SET UP PROJECT (30 minutes)

### Install Requirements

```bash
# Create project directory
mkdir ai-agent-platform
cd ai-agent-platform

# Backend
mkdir backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install fastapi uvicorn anthropic sqlalchemy python-dotenv

# Frontend
cd ..
npx create-next-app@latest frontend --typescript --tailwind --app
```

### Project Structure

```
ai-agent-platform/
├── backend/
│   ├── main.py
│   ├── agent.py
│   ├── database.py
│   └── .env
└── frontend/
    ├── app/
    ├── components/
    └── lib/
```

---

## STEP 2: BUILD BACKEND (3 hours)

### 2.1 Database Setup (`backend/database.py`)

```python
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

Base = declarative_base()

class Agent(Base):
    __tablename__ = "agents"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    role = Column(String(200))
    instructions = Column(Text)
    model = Column(String(50), default="claude-sonnet-4-20250514")
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True)
    agent_id = Column(Integer)
    role = Column(String(20))  # user or assistant
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

# Create database
engine = create_engine('sqlite:///agents.db')
Base.metadata.create_all(engine)

SessionLocal = sessionmaker(bind=engine)
```

---

### 2.2 Agent Executor (`backend/agent.py`)

```python
import anthropic
import os
from typing import List, Dict
import json

class AgentExecutor:
    def __init__(self, agent_config: Dict):
        self.agent_config = agent_config
        # self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.client = Anthropic()

        
        # Define available tools
        self.tools = [
            {
                "name": "calculator",
                "description": "Performs basic arithmetic operations. Use this when you need to calculate something.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["add", "subtract", "multiply", "divide"],
                            "description": "The operation to perform"
                        },
                        "a": {
                            "type": "number",
                            "description": "First number"
                        },
                        "b": {
                            "type": "number",
                            "description": "Second number"
                        }
                    },
                    "required": ["operation", "a", "b"]
                }
            },
            {
                "name": "get_time",
                "description": "Gets the current time and date",
                "input_schema": {
                    "type": "object",
                    "properties": {}
                }
            }
        ]
    
    def execute_tool(self, tool_name: str, tool_input: Dict):
        """Execute a tool and return the result"""
        if tool_name == "calculator":
            op = tool_input["operation"]
            a = tool_input["a"]
            b = tool_input["b"]
            
            operations = {
                "add": a + b,
                "subtract": a - b,
                "multiply": a * b,
                "divide": a / b if b != 0 else "Error: Division by zero"
            }
            return str(operations[op])
        
        elif tool_name == "get_time":
            from datetime import datetime
            return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        return "Tool not found"
    
    async def run(self, messages: List[Dict]) -> Dict:
        """Run the agent with conversation history"""
        
        # Build system prompt
        system_prompt = f"""You are {self.agent_config['name']}, {self.agent_config['role']}.

{self.agent_config['instructions']}

You have access to tools. When you need to use a tool, the system will execute it and provide results."""
        
        # Call Claude API
        response = self.client.messages.create(
            model=self.agent_config['model'],
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
            tools=self.tools
        )
        
        # Check if Claude wants to use a tool
        if response.stop_reason == "tool_use":
            # Extract tool use
            tool_use_block = next(
                (block for block in response.content if block.type == "tool_use"),
                None
            )
            
            if tool_use_block:
                # Execute tool
                tool_result = self.execute_tool(
                    tool_use_block.name,
                    tool_use_block.input
                )
                
                # Continue conversation with tool result
                messages.append({
                    "role": "assistant",
                    "content": response.content
                })
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": tool_use_block.id,
                            "content": tool_result
                        }
                    ]
                })
                
                # Get final response
                final_response = self.client.messages.create(
                    model=self.agent_config['model'],
                    max_tokens=1024,
                    system=system_prompt,
                    messages=messages,
                    tools=self.tools
                )
                
                return {
                    "content": final_response.content[0].text,
                    "tool_used": tool_use_block.name,
                    "tool_input": tool_use_block.input,
                    "tool_result": tool_result
                }
        
        # No tool used, return text response
        return {
            "content": response.content[0].text,
            "tool_used": None
        }
```

---

### 2.3 API Endpoints (`backend/main.py`)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from database import SessionLocal, Agent as DBAgent, Message as DBMessage
from agent import AgentExecutor
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
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

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    agent_id: int
    message: str
    history: List[ChatMessage] = []

# Endpoints

@app.post("/agents/", response_model=AgentResponse)
def create_agent(agent: AgentCreate):
    """Create a new agent"""
    db = SessionLocal()
    
    db_agent = DBAgent(
        name=agent.name,
        role=agent.role,
        instructions=agent.instructions,
        model=agent.model
    )
    
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    db.close()
    
    return db_agent

@app.get("/agents/", response_model=List[AgentResponse])
def list_agents():
    """List all agents"""
    db = SessionLocal()
    agents = db.query(DBAgent).all()
    db.close()
    return agents

@app.get("/agents/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: int):
    """Get specific agent"""
    db = SessionLocal()
    agent = db.query(DBAgent).filter(DBAgent.id == agent_id).first()
    db.close()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return agent

@app.post("/chat/")
async def chat(request: ChatRequest):
    """Chat with an agent"""
    db = SessionLocal()
    
    # Get agent
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
    
    # Build message history for Claude
    messages = []
    for msg in request.history:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Add new message
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
    db.close()
    
    return result

@app.get("/")
def root():
    return {"message": "AI Agent Platform API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### 2.4 Environment Variables (`backend/.env`)

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

---

## STEP 3: BUILD FRONTEND (4 hours)

### 3.1 API Client (`frontend/lib/api.ts`)

```typescript
const API_URL = 'http://localhost:8000';

export interface Agent {
  id: number;
  name: string;
  role: string;
  instructions: string;
  model: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const api = {
  async createAgent(data: Omit<Agent, 'id'>): Promise<Agent> {
    const response = await fetch(`${API_URL}/agents/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async listAgents(): Promise<Agent[]> {
    const response = await fetch(`${API_URL}/agents/`);
    return response.json();
  },

  async getAgent(id: number): Promise<Agent> {
    const response = await fetch(`${API_URL}/agents/${id}`);
    return response.json();
  },

  async chat(agentId: number, message: string, history: ChatMessage[]) {
    const response = await fetch(`${API_URL}/chat/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agentId, message, history }),
    });
    return response.json();
  },
};
```

---

### 3.2 Agent Creation Page (`frontend/app/agents/new/page.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewAgentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    instructions: '',
    model: 'claude-sonnet-4-20250514',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const agent = await api.createAgent(formData);
      router.push(`/agents/${agent.id}`);
    } catch (error) {
      alert('Error creating agent');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Create New Agent</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Agent Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g., Sales Assistant"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Role
          </label>
          <input
            type="text"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="e.g., a helpful sales assistant"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Instructions
          </label>
          <textarea
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg h-32"
            placeholder="Provide detailed instructions for this agent..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Model
          </label>
          <select
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
            <option value="claude-opus-4-20250514">Claude Opus 4</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
        >
          Create Agent
        </button>
      </form>
    </div>
  );
}
```

---

### 3.3 Chat Interface (`frontend/app/agents/[id]/page.tsx`)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { api, Agent, ChatMessage } from '@/lib/api';

export default function AgentChatPage({ params }: { params: { id: string } }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgent();
  }, [params.id]);

  const loadAgent = async () => {
    const data = await api.getAgent(parseInt(params.id));
    setAgent(data);
  };

  const sendMessage = async () => {
    if (!input.trim() || !agent) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chat(agent.id, input, messages);
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
      };
      
      setMessages([...messages, userMessage, assistantMessage]);
    } catch (error) {
      alert('Error sending message');
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold">{agent.name}</h1>
        <p className="text-gray-600">{agent.role}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t bg-white px-6 py-4">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## STEP 4: RUN THE APP (15 minutes)

### Start Backend

```bash
cd backend
source venv/bin/activate
python main.py
```

Backend should be running at `http://localhost:8000`

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend should be running at `http://localhost:3000`

---

## STEP 5: TEST IT OUT (30 minutes)

1. **Create an Agent:**
   - Go to `http://localhost:3000/agents/new`
   - Name: "Math Tutor"
   - Role: "a helpful math tutor"
   - Instructions: "Help students with math problems. When they ask you to calculate something, use the calculator tool."
   - Click "Create Agent"

2. **Chat with Agent:**
   - Ask: "What is 1234 * 5678?"
   - Agent should use the calculator tool
   - You should see the tool being used in the response

3. **Test Time Tool:**
   - Ask: "What time is it?"
   - Agent should use the get_time tool

---

## NEXT STEPS

### Immediate Improvements (Next 7 Days)

1. **Add More Tools:**
   - Web search (Google API)
   - Email sender (Gmail API)
   - Database query tool

2. **Improve UI:**
   - Show when tool is being used
   - Display tool inputs/outputs
   - Better loading states

3. **Add Features:**
   - Edit agents
   - Delete agents
   - Agent list page
   - Conversation history persistence

### Week 2-4 Improvements

1. **Multi-Agent Workflows:**
   - Visual workflow builder
   - Agent-to-agent communication
   - Parallel execution

2. **Integrations:**
   - OAuth for Gmail, Slack
   - Webhook receivers
   - API connector builder

3. **Production Ready:**
   - User authentication
   - PostgreSQL instead of SQLite
   - Deploy to cloud (Railway, Render)

---

## RESOURCES

### Documentation
- Anthropic Claude API: https://docs.anthropic.com/
- Next.js: https://nextjs.org/docs
- FastAPI: https://fastapi.tiangolo.com/

### Community
- Join Discord communities for AI builders
- Share your progress on Twitter/X
- Get feedback from early users

---

## CONGRATULATIONS! 🎉

You've built your first AI agent platform prototype in one day!

Now:
1. Show it to 5 potential users
2. Get feedback
3. Iterate quickly
4. Build what people actually want

**Remember: This is just the beginning. The real work is understanding your users and building what they need.**
