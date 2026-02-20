/* eslint-disable react-hooks/set-state-in-effect */
"use client"
// import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

// export const metadata: Metadata = {
//   title: "Nexus Agentic OS",
//   description: "A high-fidelity, professional AI Agent interface featuring a glassmorphic dark UI.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('af_user');
    if (!stored) { router.push('/login'); return; }
    setUser(JSON.parse(stored));
  }, [router]);
  return (
    <>

    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}
        suppressHydrationWarning
      >
          <aside className="sidebar">
            <div className="sidebar-brand">
              <div className="sidebar-icon">🏭</div>
              <span className="sidebar-name">AgentFlow</span>
            </div>

            <div className="nav-section-label">Overview</div>
            <a className="nav-item active" href="/dashboard"><span className="nav-icon">🤖</span> Dashboard</a>
            <a className="nav-item" href="#"><span className="nav-icon">⚡</span> Activity Feed</a>
            <a className="nav-item" href="#"><span className="nav-icon">🔧</span> Alerts & Failures</a>

            <div className="nav-section-label">Settings</div>
            {/* <a className="nav-item active" href="/dashboard"><span className="nav-icon">🤖</span> Profile</a> */}
            <a className="nav-item" href="/profile"><span className="nav-icon">👤</span> Profile</a>
            <a className="nav-item" href="/api_keys"><span className="nav-icon">🔑</span> API Keys</a>
            <a className="nav-item" href="/security"><span className="nav-icon">🛡️</span> Security</a>
            <a className="nav-item" href="/notifications"><span className="nav-icon">🔔</span> Notifications</a>

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

        {/* <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}> */}
        {children}
      </body>
    </html>
    </>
  );
}