'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    const token = localStorage.getItem('af_user');

    if (token) {
      router.replace('/dashboard'); // redirect if not logged in
      return;
    }

  }, [router]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    localStorage.setItem('af_user', JSON.stringify({ name: form.name || 'User', email: form.email }));
    router.push('/dashboard');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060608; }

        .login-root {
          min-height: 100vh;
          display: flex;
          background: #060608;
          font-family: 'Outfit', sans-serif;
          color: #e2e2e8;
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 80px;
          position: relative;
          border-right: 1px solid rgba(255,255,255,0.05);
        }
        .left-panel::before {
          content: '';
          position: absolute;
          top: -200px; left: -200px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .left-panel::after {
          content: '';
          position: absolute;
          bottom: -150px; right: -100px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 60px;
        }
        .brand-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #6366f1, #10b981);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .brand-name {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 500;
          color: #818cf8;
          margin-bottom: 24px;
          width: fit-content;
        }
        .hero-dot {
          width: 6px; height: 6px;
          background: #6366f1;
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero-title {
          font-size: 48px;
          font-weight: 700;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #fff;
          margin-bottom: 20px;
        }
        .hero-title span {
          background: linear-gradient(135deg, #6366f1 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-desc {
          font-size: 16px;
          color: #6b7280;
          line-height: 1.7;
          max-width: 420px;
          margin-bottom: 48px;
        }

        .features-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .feature-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          transition: border-color 0.2s;
        }
        // .feature-row:hover { border-color: rgba(99,102,241,0.3); }
        .feature-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .feature-text { font-size: 14px; color: #9ca3af; }
        .feature-text strong { color: #d1d5db; font-weight: 500; }

        /* ── RIGHT PANEL ── */
        .right-panel {
          width: 480px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 50px;
          background: #09090f;
        }

        .form-header { margin-bottom: 36px; }
        .form-title { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.02em; margin-bottom: 8px; }
        .form-sub { font-size: 14px; color: #6b7280; }

        .tab-switcher {
          display: flex;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 28px;
          gap: 4px;
        }
        .tab-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 9px 16px;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 7px;
          transition: all 0.2s;
          color: #6b7280;
        }
        .tab-btn.active {
          background: rgba(99,102,241,0.15);
          color: #818cf8;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        .form-group { margin-bottom: 16px; }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #9ca3af;
          margin-bottom: 8px;
          letter-spacing: 0.01em;
        }
        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px 16px;
          color: #e2e2e8;
          font-size: 14px;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: all 0.2s;
        }
        .form-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.04);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.08);
        }
        .form-input::placeholder { color: #374151; }

        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          margin-top: 24px;
          transition: all 0.2s;
          letter-spacing: 0.01em;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
        }
        .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(99,102,241,0.35); }
        .submit-btn:disabled { opacity: 0.6; transform: none; cursor: not-allowed; box-shadow: none; }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0;
          color: #374151;
          font-size: 13px;
        }
        .divider::before, .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .demo-btn {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 13px;
          color: #9ca3af;
          font-size: 14px;
          font-weight: 500;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: all 0.2s;
        }
        .demo-btn:hover { background: rgba(255,255,255,0.05); color: #d1d5db; border-color: rgba(255,255,255,0.15); }

        .footer-note {
          text-align: center;
          margin-top: 28px;
          font-size: 12px;
          color: #374151;
        }
        .footer-note a { color: #6366f1; cursor: pointer; text-decoration: none; }
        .footer-note a:hover { color: #818cf8; }

        @media (max-width: 900px) {
          .left-panel { display: none; }
          .right-panel { width: 100%; padding: 40px 28px; }
        }
      `}</style>

      <div className="login-root">
        {/* LEFT */}
        <div className="left-panel">
          <div className="brand">
            <div className="brand-icon">🏭</div>
            <span className="brand-name">AgentOS</span>
          </div>

          <div className="hero-tag">
            <div className="hero-dot" />
            AI Agent Orchestration Platform
          </div>

          <h1 className="hero-title">
            Build your<br />
            <span>AI workforce</span><br />
            in minutes
          </h1>

          <p className="hero-desc">
            Create, deploy, and orchestrate intelligent AI agents that automate your most complex workflows — without writing a single line of code.
          </p>

          <div className="features-grid">
            {[
              { icon: '🤖', bg: 'rgba(99,102,241,0.12)', label: 'Agent Builder', desc: 'Effortlessly create and customize intelligent AI agents with a clean, no-code visual builder' },
              { icon: '⚡', bg: 'rgba(16,185,129,0.12)', label: 'Workflow Engine', desc: 'Orchestrate complex multi-agent workflows with intelligent task coordination and execution' },
              { icon: '🔧', bg: 'rgba(245,158,11,0.12)', label: 'Tool Integration', desc: 'Seamlessly connect and automate workflows across 100+ apps and services in just a few clicks' },
              { icon: '📊', bg: 'rgba(239,68,68,0.12)', label: 'Live Monitoring', desc: 'Track agent performance, behavior, and outcomes in real time with actionable analytics' },
            ].map((f) => (
              <div key={f.label} className="feature-row">
                <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div className="feature-text">
                  <strong>{f.label}</strong> — {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="right-panel">
          <div className="form-header">
            <h2 className="form-title">{isLogin ? 'Welcome back' : 'Get started free'}</h2>
            <p className="form-sub">{isLogin ? 'Sign in to your workspace' : 'Create your AgentFlow account'}</p>
          </div>

          <div className="tab-switcher">
            <button className={`tab-btn ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Sign In</button>
            <button className={`tab-btn ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Sign Up</button>
          </div>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="John Smith"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                placeholder="example@gmail.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : isLogin ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <div className="divider">or</div>

          <button className="demo-btn" onClick={() => {
            setForm({ name: 'Demo User', email: 'demo@agentflow.ai', password: 'demo123' });
            localStorage.setItem('af_user', JSON.stringify({ name: 'Demo User', email: 'demo@agentflow.ai' }));
            router.push('/dashboard');
          }}>
            ⚡ Continue with Demo Account
          </button>

          <p className="footer-note">
            By continuing, you agree to our <a>Terms of Service</a> and <a>Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  );
}
