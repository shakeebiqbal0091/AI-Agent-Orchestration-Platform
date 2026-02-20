'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


interface Agent {
  id: number;
  name: string;
  role: string;
  instructions: string;
  model: string;
}

const API_URL = 'http://localhost:8000';

export default function DashboardPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('af_user');
    if (!stored) { router.push('/login'); return; }
    setUser(JSON.parse(stored));
  }, [router]);

  const loadAgents = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/agents/`);
      if (res.ok) setAgents(await res.json());
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const deleteAgent = async (id: number) => {
    if (!confirm('Delete this agent?')) return;
    setDeleting(id);
    try {
      await fetch(`${API_URL}/agents/${id}`, { method: 'DELETE' });
      setAgents(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.role.toLowerCase().includes(search.toLowerCase())
  );

  const modelLabel = (m: string) => m.includes('opus') ? 'Opus 4' : m.includes('haiku') ? 'Haiku 4' : 'Sonnet 4';
  const modelColor = (m: string) => m.includes('opus') ? '#f59e0b' : m.includes('haiku') ? '#10b981' : '#6366f1';

  filtered.map((i)=>{

    console.log({i})

  })
  return (
    <>


      <div className="dash-root">
        <div className="layout">
          {/* MAIN CONTENT */}
          <main className="main">
            <div className="topbar">
              <div>
                <h1 className="page-title">My Agents</h1>
                <p className="page-sub">Manage and deploy your AI workforce</p>
              </div>
              <Link href="/agents/new" className="create-btn">
                <span>+</span> New Agent
              </Link>
            </div>

            {/* STATS */}
            <div className="stats-row">
              {[
                { label: 'Total Agents', value: agents.length, sub: 'All time' },
                { label: 'Active Today', value: Math.min(agents.length, 3), sub: '↑ Running now' },
                { label: 'Tasks Run', value: agents.length * 12, sub: '↑ This week' },
                { label: 'Success Rate', value: '98%', sub: '↑ Last 7 days' },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* TOOLBAR */}
            <div className="toolbar">
              <div className="search-wrap">
                <span className="search-icon">🔍</span>
                <input
                  className="search-input"
                  placeholder="Search agents..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="count-badge">{filtered.length} agent{filtered.length !== 1 ? 's' : ''}</div>
            </div>

            {/* AGENT GRID */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>Loading agents...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🤖</div>
                <h3 className="empty-title">{search ? 'No agents found' : 'No agents yet'}</h3>
                <p className="empty-sub">{search ? 'Try a different search term' : 'Create your first AI agent to get started'}</p>
                {!search && (
                  <Link href="/agents/new" className="create-btn" style={{ display: 'inline-flex', margin: '0 auto' }}>
                    + Create First Agent
                  </Link>
                )}
              </div>
            ) : (
              <div className="agents-grid">
                {filtered.map(agent => (
                  <div key={agent.id} className="agent-card">
                    <div className="card-top">
                      <div className="agent-avatar">🤖</div>
                      <div className="card-actions">
                        <button
                          className="action-btn"
                          onClick={() => deleteAgent(agent.id)}
                          disabled={deleting === agent.id}
                          title="Delete agent"
                        >
                          {deleting === agent.id ? '...' : '🗑'}
                        </button>
                      </div>
                    </div>

                    <div className="agent-name">{agent.name}</div>
                    <div className="agent-role">{agent.role}</div>
                    <div className="agent-desc">{agent.instructions}</div>

                    <div className="card-footer">
                      <div className="model-badge">
                        <div className="model-dot" style={{ background: modelColor(agent.model) }} />
                        {modelLabel(agent.model)}
                      </div>
                      <Link href={`/agents/${agent.id}`} className="chat-link">
                        Chat →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
