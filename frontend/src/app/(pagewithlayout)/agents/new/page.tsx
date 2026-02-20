'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = 'http://localhost:8000';

const TEMPLATES = [
  { icon: '💼', name: 'Sales Assistant', role: 'a proactive sales assistant', instructions: 'Help qualify leads, draft outreach emails, and answer product questions. Always be professional and persuasive.' },
  { icon: '🎧', name: 'Support Agent', role: 'a helpful customer support agent', instructions: 'Resolve customer issues with empathy. Escalate complex issues to humans. Always confirm the issue is resolved.' },
  { icon: '📝', name: 'Content Writer', role: 'a creative content writer', instructions: 'Write engaging blogs, social posts, and copy. Match the brand voice. Always ask for the target audience first.' },
  { icon: '📊', name: 'Data Analyst', role: 'a data analysis specialist', instructions: 'Analyze data, identify trends, and provide actionable insights. Use the calculator tool for precise calculations.' },
  { icon: '🔬', name: 'Research Agent', role: 'a thorough research specialist', instructions: 'Conduct deep research on any topic. Summarize findings clearly with sources. Always verify information.' },
  { icon: '⚙️', name: 'Custom Agent', role: '', instructions: '' },
];

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', role: '', instructions: '', model: 'claude-sonnet-4-20250514' });

  const pickTemplate = (idx: number) => {
    const t = TEMPLATES[idx];
    setSelected(idx);
    setForm(f => ({ ...f, name: t.name === 'Custom Agent' ? '' : t.name, role: t.role, instructions: t.instructions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/agents/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to create agent');
      const agent = await res.json();
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      console.error(err);
      alert('Error creating agent. Make sure backend is running.');
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060608; }
        .new-root { min-height: 100vh; background: #060608; font-family: 'Outfit', sans-serif; color: #e2e2e8; }

        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 40px; border-bottom: 1px solid rgba(255,255,255,0.05);
          background: #09090f;
        }
        .header-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .header-icon {
          width: 32px; height: 32px; background: linear-gradient(135deg, #6366f1, #10b981);
          border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 15px;
        }
        .header-name { font-size: 16px; font-weight: 700; color: #fff; letter-spacing: -0.02em; }

        .steps { display: flex; align-items: center; gap: 8px; }
        .step { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; }
        .step-num {
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 12px;
        }
        .step.done .step-num { background: rgba(16,185,129,0.2); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .step.active .step-num { background: rgba(99,102,241,0.2); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
        .step.idle .step-num { background: rgba(255,255,255,0.04); color: #4b5563; border: 1px solid rgba(255,255,255,0.07); }
        .step-label { color: #6b7280; }
        .step.active .step-label { color: #d1d5db; }
        .step-divider { width: 24px; height: 1px; background: rgba(255,255,255,0.08); }

        .back-btn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px; padding: 7px 14px; color: #9ca3af;
          font-size: 13px; font-weight: 500; font-family: 'Outfit', sans-serif;
          cursor: pointer; transition: all 0.15s; text-decoration: none;
        }
        .back-btn:hover { background: rgba(255,255,255,0.07); color: #d1d5db; }

        .content { max-width: 900px; margin: 0 auto; padding: 48px 40px; }
        .section-title { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.02em; margin-bottom: 8px; }
        .section-sub { font-size: 15px; color: #6b7280; margin-bottom: 36px; }

        .templates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 36px; }
        .template-card {
          background: #09090f; border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 20px; cursor: pointer; transition: all 0.2s;
          position: relative; overflow: hidden;
        }
        .template-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(99,102,241,0.05), transparent);
          opacity: 0; transition: opacity 0.2s;
        }
        .template-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-1px); }
        .template-card:hover::before { opacity: 1; }
        .template-card.selected { border-color: #6366f1; background: rgba(99,102,241,0.06); }
        .template-card.selected::before { opacity: 1; }
        .check { position: absolute; top: 12px; right: 12px; width: 20px; height: 20px; border-radius: 50%; background: #6366f1; display: flex; align-items: center; justify-content: center; font-size: 11px; }

        .t-icon { font-size: 28px; margin-bottom: 10px; }
        .t-name { font-size: 14px; font-weight: 600; color: #d1d5db; margin-bottom: 4px; }
        .t-role { font-size: 12px; color: #6b7280; }

        .next-btn {
          width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white; border: none; border-radius: 10px; padding: 14px;
          font-size: 15px; font-weight: 600; font-family: 'Outfit', sans-serif;
          cursor: pointer; transition: all 0.2s; margin-top: 8px;
        }
        .next-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
        .next-btn:disabled { opacity: 0.4; transform: none; cursor: not-allowed; box-shadow: none; }

        /* STEP 2 */
        .form-card { background: #09090f; border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 32px; }
        .form-row { margin-bottom: 22px; }
        .form-label { display: block; font-size: 13px; font-weight: 500; color: #9ca3af; margin-bottom: 8px; letter-spacing: 0.01em; }
        .form-input {
          width: 100%; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 13px 16px; color: #e2e2e8; font-size: 14px;
          font-family: 'Outfit', sans-serif; outline: none; transition: all 0.2s;
        }
        .form-input:focus { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.04); box-shadow: 0 0 0 3px rgba(99,102,241,0.08); }
        .form-input::placeholder { color: #374151; }
        textarea.form-input { resize: vertical; min-height: 120px; line-height: 1.6; }

        .model-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .model-option {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: all 0.2s;
        }
        .model-option.selected { border-color: rgba(99,102,241,0.5); background: rgba(99,102,241,0.06); }
        .model-option:hover { border-color: rgba(99,102,241,0.3); }
        .model-name { font-size: 13px; font-weight: 600; color: #d1d5db; margin-bottom: 2px; }
        .model-desc { font-size: 11px; color: #4b5563; }
        .model-badge2 { font-size: 10px; font-family: 'JetBrains Mono', monospace; }

        .char-count { font-size: 11px; color: #4b5563; text-align: right; margin-top: 4px; }
      `}</style>

      <div className="new-root">
        <header className="header">
          <Link href="/dashboard" className="header-brand">
            <div className="header-icon">🏭</div>
            <span className="header-name">AgentFlow</span>
          </Link>

          <div className="steps">
            <div className={`step ${step === 1 ? 'active' : 'done'}`}>
              <div className="step-num">{step === 1 ? '1' : '✓'}</div>
              <span className="step-label">Choose Template</span>
            </div>
            <div className="step-divider" />
            <div className={`step ${step === 2 ? 'active' : 'idle'}`}>
              <div className="step-num">2</div>
              <span className="step-label">Configure Agent</span>
            </div>
          </div>

          <Link href="/dashboard" className="back-btn">← Back to Dashboard</Link>
        </header>

        <div className="content">
          {step === 1 ? (
            <>
              <h1 className="section-title">Choose a template</h1>
              <p className="section-sub">Start from a pre-built template or create a custom agent from scratch</p>

              <div className="templates-grid">
                {TEMPLATES.map((t, i) => (
                  <div
                    key={i}
                    className={`template-card ${selected === i ? 'selected' : ''}`}
                    onClick={() => pickTemplate(i)}
                  >
                    {selected === i && <div className="check">✓</div>}
                    <div className="t-icon">{t.icon}</div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role || 'Define your own role'}</div>
                  </div>
                ))}
              </div>

              <button className="next-btn" disabled={selected === null} onClick={() => setStep(2)}>
                Continue to Configuration →
              </button>
            </>
          ) : (
            <>
              <h1 className="section-title">Configure your agent</h1>
              <p className="section-sub">Customize the agent&apos;s identity, role, and behavior</p>

              <form onSubmit={handleSubmit}>
                <div className="form-card">
                  <div className="form-row">
                    <label className="form-label">Agent Name *</label>
                    <input
                      className="form-input" type="text"
                      placeholder="e.g., Sales Bot, Support Agent..."
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label className="form-label">Role Description *</label>
                    <input
                      className="form-input" type="text"
                      placeholder="e.g., a helpful sales assistant..."
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label className="form-label">Agent Instructions *</label>
                    <textarea
                      className="form-input"
                      placeholder="Describe how this agent should behave, what it should focus on, any rules it must follow..."
                      value={form.instructions}
                      onChange={e => setForm({ ...form, instructions: e.target.value })}
                      required
                    />
                    <div className="char-count">{form.instructions.length} characters</div>
                  </div>

                  <div className="form-row">
                    <label className="form-label">AI Model</label>
                    <div className="model-grid">
                      {[
                        { id: 'claude-sonnet-4-20250514', name: 'Sonnet 4', desc: 'Balanced speed & intelligence', badge: '⚡ Recommended', color: '#6366f1' },
                        { id: 'claude-opus-4-20250514', name: 'Opus 4', desc: 'Highest intelligence', badge: '🧠 Most Powerful', color: '#f59e0b' },
                        { id: 'claude-haiku-4-20251001', name: 'Haiku 4', desc: 'Fastest responses', badge: '🚀 Fastest', color: '#10b981' },
                      ].map(m => (
                        <div
                          key={m.id}
                          className={`model-option ${form.model === m.id ? 'selected' : ''}`}
                          onClick={() => setForm({ ...form, model: m.id })}
                        >
                          <div className="model-name">{m.name}</div>
                          <div className="model-desc">{m.desc}</div>
                          <div className="model-badge2" style={{ color: m.color, marginTop: '6px' }}>{m.badge}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button type="button" className="back-btn" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }} onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button className="next-btn" type="submit" disabled={loading} style={{ flex: 2, marginTop: 0 }}>
                    {loading ? 'Creating Agent...' : '🚀 Create Agent'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
