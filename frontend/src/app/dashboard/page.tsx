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
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060608; }
        .dash-root { min-height: 100vh; background: #060608; font-family: 'Outfit', sans-serif; color: #e2e2e8; }

        /* SIDEBAR */
        .layout { display: flex; min-height: 100vh; }
        .sidebar {
          width: 240px; min-height: 100vh;
          background: #09090f;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex; flex-direction: column;
          padding: 24px 16px;
          position: fixed; top: 0; left: 0; bottom: 0;
        }
        .sidebar-brand {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 12px; margin-bottom: 32px;
        }
        .sidebar-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg, #6366f1, #10b981);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .sidebar-name { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }

        .nav-section-label {
          font-size: 10px; font-weight: 600; letter-spacing: 0.1em;
          color: #374151; text-transform: uppercase;
          padding: 0 12px; margin-bottom: 8px; margin-top: 8px;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          font-size: 14px; font-weight: 500; color: #6b7280;
          cursor: pointer; transition: all 0.15s;
          text-decoration: none; margin-bottom: 2px;
        }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: #d1d5db; }
        .nav-item.active { background: #12174c; color: #ffffff; }
        .nav-icon { font-size: 16px; width: 20px; text-align: center; }

        .sidebar-footer { margin-top: auto; }
        .user-card {
          display: flex; align-items: center; gap: 10px;
          padding: 12px; background: #0e112c;
          border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
          cursor: pointer;
        }
        .user-avatar {
          width: 32px; height: 32px; border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #10b981);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
        }
        .user-name { font-size: 13px; font-weight: 500; color: #d1d5db; }
        .user-email { font-size: 11px; color: #4b5563; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px; }

        /* MAIN */
        .main { margin-left: 240px; flex: 1; padding: 40px; }

        .topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 36px; }
        .page-title { font-size: 26px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }
        .page-sub { font-size: 14px; color: #6b7280; margin-top: 4px; }

        .create-btn {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #12174c, #0e112c);
          color: white; border: none; border-radius: 10px;
          padding: 11px 20px; font-size: 14px; font-weight: 600;
          font-family: 'Outfit', sans-serif; cursor: pointer;
          transition: all 0.2s; text-decoration: none;
          box-shadow: 0 4px 16px rgba(99,102,241,0.25);
        }
        .create-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,102,241,0.4); }

        /* STATS */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .stat-card {
          background: #12174c; border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; padding: 20px 22px;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: rgba(99,102,241,0.25); }
        .stat-label { font-size: 12px; color: #ffffff; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
        .stat-value { font-size: 32px; font-weight: 700; color: #fff; letter-spacing: -0.03em; }
        .stat-sub { font-size: 12px; color: #10b981; margin-top: 4px; }

        /* SEARCH */
        .toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .search-wrap { position: relative; flex: 1; max-width: 360px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #4b5563; font-size: 15px; }
        .search-input {
          width: 100%; background: #0e112c;
          border: 1px solid rgba(255,255,255,0.07); border-radius: 10px;
          padding: 11px 16px 11px 40px; color: #e2e2e8; font-size: 14px;
          font-family: 'Outfit', sans-serif; outline: none; transition: all 0.2s;
        }
        .search-input:focus { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.04); }
        .search-input::placeholder { color: #ffffff,; }
        .count-badge {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.25);
          border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #ffffff,0.1;
        }

        /* AGENT CARDS */
        .agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

        .agent-card {
          background: #0e112c; border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 22px;
          transition: all 0.2s; position: relative; overflow: hidden;
          cursor: pointer;
        }
        .agent-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .agent-card:hover { border-color: rgba(99,102,241,0.25); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .agent-card:hover::before { opacity: 1; }

        .card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
        .agent-avatar {
          width: 44px; height: 44px; border-radius: 12px;
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.2));
          border: 1px solid rgba(99,102,241,0.2);
          display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .card-actions { display: flex; gap: 6px; opacity: 0; transition: opacity 0.2s; }
        .agent-card:hover .card-actions { opacity: 1; }
        .action-btn {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.15s; font-size: 13px; color: #6b7280;
        }
        .action-btn:hover { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: #ef4444; }

        .agent-name { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 4px; letter-spacing: -0.01em; }
        .agent-role { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
        .agent-desc {
          font-size: 12px; color: #4b5563; line-height: 1.6;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          margin-bottom: 16px;
        }

        .card-footer { display: flex; align-items: center; justify-content: space-between; }
        .model-badge {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px; padding: 4px 10px; font-size: 11px;
          font-family: 'JetBrains Mono', monospace; color: #9ca3af;
        }
        .model-dot { width: 6px; height: 6px; border-radius: 50%; }
        .chat-link {
          display: flex; align-items: center; gap: 5px;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
          border-radius: 7px; padding: 5px 12px;
          font-size: 12px; font-weight: 600; color: #818cf8;
          text-decoration: none; transition: all 0.15s;
        }
        .chat-link:hover { background: rgba(99,102,241,0.18); }

        /* EMPTY STATE */
        .empty-state {
          text-align: center; padding: 80px 40px;
          background: #09090f; border: 1px dashed rgba(255,255,255,0.08);
          border-radius: 16px;
        }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-size: 20px; font-weight: 600; color: #d1d5db; margin-bottom: 8px; }
        .empty-sub { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
      `}</style>

      <div className="dash-root">
        <div className="layout">

          {/* SIDEBAR */}
          <aside className="sidebar">
            <div className="sidebar-brand">
              <div className="sidebar-icon">🏭</div>
              <span className="sidebar-name">AgentFlow</span>
            </div>

            <div className="nav-section-label">Workspace</div>
            <a className="nav-item active" href="/dashboard"><span className="nav-icon">🤖</span> Agents</a>
            <a className="nav-item" href="#"><span className="nav-icon">⚡</span> Workflows</a>
            <a className="nav-item" href="#"><span className="nav-icon">🔧</span> Integrations</a>
            <a className="nav-item" href="#"><span className="nav-icon">📊</span> Analytics</a>

            <div className="nav-section-label" style={{ marginTop: '16px' }}>Account</div>
            <a className="nav-item" href="#"><span className="nav-icon">⚙️</span> Settings</a>
            <a className="nav-item" href="#"><span className="nav-icon">📚</span> Documentation</a>

            <div className="sidebar-footer">
              <div className="user-card" onClick={() => { localStorage.removeItem('af_user'); router.push('/login'); }}>
                <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
                <div>
                  <div className="user-name">{user?.name || 'User'}</div>
                  <div className="user-email">{user?.email || ''}</div>
                </div>
              </div>
            </div>
          </aside>

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
