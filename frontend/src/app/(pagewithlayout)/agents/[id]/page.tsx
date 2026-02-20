'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface Agent { id: number; name: string; role: string; instructions: string; model: string; }
interface ChatMessage { role: 'user' | 'assistant'; content: string; tool_used?: string; tool_result?: string; ts: string; }

const API_URL = 'http://localhost:8000';
const modelLabel = (m: string) => m.includes('opus') ? 'Opus 4' : m.includes('haiku') ? 'Haiku 4' : 'Sonnet 4';

export default function AgentChatPage( ) {
  const params = useParams(); // returns { id: '11' }
  console.log('params', params, params?.id);
  
  // const id = params?.id;

// export default function AgentChatPage({ params }: { params:any }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const loadAgent = useCallback(async () => {
    try {
      // const id = params.id; // ✅ correct
      // const res = await fetch(`${API_URL}/agents/${id}`);
      const res = await fetch(`${API_URL}/agents/${params.id}`);
      if (!res.ok) throw new Error();
      setAgent(await res.json());
    } catch {
      setError('Could not load agent. Make sure the backend is running.');
    }
  }, [params.id]);
  

  useEffect(() => { loadAgent(); }, [loadAgent]);

  const sendMessage = async () => {
    if (!input.trim() || !agent || loading) return;
    const text = input.trim();
    const userMsg: ChatMessage = { role: 'user', content: text, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/chat/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agent.id, message: text, history: messages.map(m => ({ role: m.role, content: m.content })) }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || `Error ${res.status}`); }
      const data = await res.json();
      const reply = typeof data.content === 'string' && data.content.trim() ? data.content : '(No response)';
      setMessages([...next, { role: 'assistant', content: reply, tool_used: data.tool_used, tool_result: data.tool_result, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setMessages(messages);
      setInput(text);
    } finally { setLoading(false); }
  };

  const SUGGESTIONS = ['What can you help me with?', 'Calculate 1234 × 5678', 'What time is it right now?', 'Give me a summary of your capabilities'];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060608; }
        .chat-root { height: 100vh; display: flex; flex-direction: column; background: #060608; font-family: 'Outfit', sans-serif; color: #e2e2e8; overflow: hidden; }

        /* TOPBAR */
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; background: #09090f;
          border-bottom: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;
        }
        .topbar-left { display: flex; align-items: center; gap: 14px; }
        .back-link {
          display: flex; align-items: center; gap: 6px;
          color: #6b7280; font-size: 13px; font-weight: 500;
          text-decoration: none; transition: color 0.15s;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 6px 12px;
        }
        .back-link:hover { color: #d1d5db; }
        .agent-info { display: flex; align-items: center; gap: 10px; }
        .agent-avatar-sm {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(16,185,129,0.3));
          border: 1px solid rgba(99,102,241,0.25);
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .agent-name-sm { font-size: 15px; font-weight: 600; color: #fff; letter-spacing: -0.01em; }
        .agent-role-sm { font-size: 12px; color: #6b7280; }
        .status-pill {
          display: flex; align-items: center; gap: 6px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
          border-radius: 100px; padding: 5px 12px; font-size: 12px; font-weight: 500; color: #10b981;
        }
        .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; animation: blink 2s infinite; }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.4; } }

        .topbar-right { display: flex; align-items: center; gap: 8px; }
        .model-pill {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 6px 12px;
          font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #6b7280;
        }
        .icon-btn {
          width: 34px; height: 34px; border-radius: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; font-size: 15px; color: #6b7280;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.08); color: #d1d5db; }

        /* MESSAGES */
        .messages-area { flex: 1; overflow-y: auto; padding: 24px; scroll-behavior: smooth; }
        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        /* Empty state */
        .empty-chat { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; }
        .empty-avatar {
          width: 72px; height: 72px; border-radius: 20px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.2));
          border: 1px solid rgba(99,102,241,0.2);
          display: flex; align-items: center; justify-content: center; font-size: 32px;
          margin-bottom: 16px;
        }
        .empty-name { font-size: 20px; font-weight: 600; color: #fff; margin-bottom: 6px; }
        .empty-desc { font-size: 14px; color: #6b7280; max-width: 340px; line-height: 1.6; margin-bottom: 28px; }
        .suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
        .suggestion-chip {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px; padding: 8px 16px; font-size: 13px; color: #9ca3af;
          cursor: pointer; transition: all 0.15s;
        }
        .suggestion-chip:hover { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.3); color: #818cf8; }

        /* Message rows */
        .msg-row { display: flex; margin-bottom: 16px; }
        .msg-row.user { justify-content: flex-end; }
        .msg-row.assistant { justify-content: flex-start; }

        .msg-bubble-wrap { max-width: 70%; display: flex; flex-direction: column; }
        .msg-row.user .msg-bubble-wrap { align-items: flex-end; }
        .msg-row.assistant .msg-bubble-wrap { align-items: flex-start; }

        .msg-meta { font-size: 11px; color: #4b5563; margin-bottom: 5px; display: flex; align-items: center; gap: 6px; }
        .msg-sender { font-weight: 500; }

        .msg-bubble {
          padding: 12px 16px; border-radius: 16px;
          font-size: 14px; line-height: 1.65; white-space: pre-wrap; word-break: break-word;
        }
        .msg-row.user .msg-bubble { background: #4f46e5; color: #fff; border-bottom-right-radius: 4px; }
        .msg-row.assistant .msg-bubble {
          background: #0f0f18; color: #d1d5db;
          border: 1px solid rgba(255,255,255,0.07); border-bottom-left-radius: 4px;
        }

        .tool-badge {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 6px;
          background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2);
          border-radius: 6px; padding: 3px 10px;
          font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #a78bfa;
        }
        .result-badge {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 4px; margin-left: 8px;
          background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2);
          border-radius: 6px; padding: 3px 10px;
          font-size: 11px; font-family: 'JetBrains Mono', monospace; color: #6ee7b7;
        }

        /* Typing */
        .typing-dots { display: flex; align-items: center; gap: 4px; padding: 14px 16px; background: #0f0f18; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; border-bottom-left-radius: 4px; width: fit-content; }
        .dot { width: 7px; height: 7px; background: #4b5563; border-radius: 50%; }
        .dot:nth-child(1) { animation: bounce 1.2s ease-in-out 0s infinite; }
        .dot:nth-child(2) { animation: bounce 1.2s ease-in-out 0.2s infinite; }
        .dot:nth-child(3) { animation: bounce 1.2s ease-in-out 0.4s infinite; }
        @keyframes bounce { 0%,60%,100% { transform:translateY(0); background:#4b5563; } 30% { transform:translateY(-6px); background:#6366f1; } }

        /* ERROR */
        .error-bar { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 10px; padding: 10px 16px; font-size: 13px; color: #f87171; margin: 8px 24px; flex-shrink: 0; }

        /* INPUT */
        .input-area { padding: 16px 24px 20px; background: #09090f; border-top: 1px solid rgba(255,255,255,0.05); flex-shrink: 0; }
        .input-box {
          display: flex; align-items: flex-end; gap: 10px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 10px 12px;
          transition: border-color 0.2s;
        }
        .input-box:focus-within { border-color: rgba(99,102,241,0.4); box-shadow: 0 0 0 3px rgba(99,102,241,0.06); }
        .text-input {
          flex: 1; background: none; border: none; outline: none;
          color: #e2e2e8; font-size: 14px; font-family: 'Outfit', sans-serif;
          resize: none; max-height: 120px; line-height: 1.5; padding: 4px 0;
        }
        .text-input::placeholder { color: #374151; }
        .send-btn {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none; cursor: pointer; transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
        }
        .send-btn:hover { transform: scale(1.05); box-shadow: 0 4px 16px rgba(99,102,241,0.4); }
        .send-btn:disabled { opacity: 0.4; transform: none; cursor: not-allowed; box-shadow: none; }
        .input-hint { text-align: center; font-size: 11px; color: #1f2937; margin-top: 10px; }
      `}</style>

      <div className="chat-root">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <Link href="/dashboard" className="back-link">← Dashboard</Link>
            {agent && (
              <div className="agent-info">
                <div className="agent-avatar-sm">🤖</div>
                <div>
                  <div className="agent-name-sm">{agent.name}</div>
                  <div className="agent-role-sm">{agent.role}</div>
                </div>
              </div>
            )}
          </div>
          <div className="topbar-right">
            {agent && <div className="model-pill">{modelLabel(agent.model)}</div>}
            <div className="status-pill"><div className="status-dot" />Online</div>
            <div className="icon-btn" title="Clear chat" onClick={() => setMessages([])}>🗑</div>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="messages-area">
          {messages.length === 0 && !loading ? (
            <div className="empty-chat">
              <div className="empty-avatar">🤖</div>
              <div className="empty-name">{agent?.name || 'Loading...'}</div>
              <div className="empty-desc">{agent?.instructions || ''}</div>
              <div className="suggestions">
                {SUGGESTIONS.map(s => (
                  <div key={s} className="suggestion-chip" onClick={() => { setInput(s); }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={idx} className={`msg-row ${msg.role}`}>
                  <div className="msg-bubble-wrap">
                    <div className="msg-meta">
                      <span className="msg-sender">{msg.role === 'user' ? 'You' : agent?.name}</span>
                      <span>{msg.ts}</span>
                    </div>
                    <div className="msg-bubble">{msg.content}</div>
                    {msg.tool_used && (
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        <span className="tool-badge">🔧 {msg.tool_used}</span>
                        {msg.tool_result && <span className="result-badge">= {msg.tool_result}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="msg-row assistant">
                  <div className="msg-bubble-wrap">
                    <div className="msg-meta"><span className="msg-sender">{agent?.name}</span></div>
                    <div className="typing-dots">
                      <div className="dot" /><div className="dot" /><div className="dot" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ERROR */}
        {error && <div className="error-bar">⚠️ {error}</div>}

        {/* INPUT */}
        <div className="input-area">
          <div className="input-box">
            <textarea
              className="text-input"
              placeholder={`Message ${agent?.name || 'agent'}...`}
              value={input}
              rows={1}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={loading}
            />
            <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim()}>↑</button>
          </div>
          <div className="input-hint">Press Enter to send · Shift+Enter for new line</div>
        </div>
      </div>
    </>
  );
}

