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
