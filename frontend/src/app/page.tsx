'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, Agent } from '@/lib/api';
import { useRouter } from 'next/navigation';
// src/app/layout.tsx
import './globals.css';

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('af_user');
    if (!token) {
      router.replace('/login'); // redirect if not logged in
      return;
    }else{
      router.replace('/dashboard'); // redirect if not logged in
      return;


    }

    loadAgents();
  }, [router]);

  const loadAgents = async () => {
    try {
      const data = await api.listAgents();
      setAgents(data);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show a full-page loader before anything renders
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">AI Agent Platform</h1>
          <Link
            href="/agents/new"
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-semibold mb-4"
          >
            + Create Agent
          </Link>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <h2 className="text-2xl font-semibold mb-4">No agents yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first AI agent to get started
            </p>
            <Link
              href="/agents/new"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
            >
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <Link
                key={agent.id}
                href={`/agents/${agent.id}`}
                className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{agent.name}</h3>
                <p className="text-gray-600 mb-4">{agent.role}</p>
                <div className="text-sm text-gray-500">
                  Model:{' '}
                  {agent.model.includes('sonnet')
                    ? 'Claude Sonnet 4'
                    : 'Claude Opus 4'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
