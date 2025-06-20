'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import KnowledgeBaseManager from '@/components/KnowledgeBaseManager';
import ScraperConfigForm from '@/components/ScraperConfigForm';
import SignIn from '@/components/SignIn';
import { ScrapeConfig } from '@/types/scraper';
import { Database } from '@/types/database';
import KnowledgeEntriesTable from '@/components/KnowledgeEntriesTable';

type KnowledgeBase = Database['public']['Tables']['knowledge_bases']['Row'];

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKnowledgeBases() {
      if (!user) return;
      const { data, error } = await supabase
        .from('knowledge_bases')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setKnowledgeBases(data || []);
    }
    fetchKnowledgeBases();
  }, [user]);

  const handleScrape = async (config: ScrapeConfig) => {
    if (!selectedKnowledgeBase) {
      setError('Please select a knowledge base first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: {
            ...config,
            knowledge_base_id: selectedKnowledgeBase.id
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape content');
      }

      const data = await response.json();
      console.log('Scraped content:', data);
    } catch (error) {
      console.error('Error scraping content:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('Request timed out. Please try again.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <SignIn />;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center mb-3">Save Aline 🦸🏻‍♀️</h1>
        <p className="text-2xl font-normal text-center sm-10">Pull and save your published content to private knowledge bases</p>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold"></h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <KnowledgeBaseManager
              selectedKnowledgeBase={selectedKnowledgeBase}
              onSelect={setSelectedKnowledgeBase}
            />
          </div>
          
          <div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4">Import Content</h2>
              <div className="mb-4">
                <label htmlFor="knowledge-base-select" className="block text-sm font-medium text-gray-700 mb-3">
                  Select the knowledge base you want to save your content to
                </label>
                <select
                  id="knowledge-base-select"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={selectedKnowledgeBase?.id || ''}
                  onChange={e => {
                    const base = knowledgeBases.find(b => b.id === e.target.value);
                    if (base) setSelectedKnowledgeBase(base);
                  }}
                >
                  <option value="" disabled>Select a knowledge base...</option>
                  {knowledgeBases.map(base => (
                    <option key={base.id} value={base.id}>{base.name}</option>
                  ))}
                </select>
              </div>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              <ScraperConfigForm onSubmit={handleScrape} loading={loading} />
            </div>
          </div>
        </div>
        <div className="mt-8">
          <KnowledgeEntriesTable />
        </div>
      </div>
    </main>
  );
}
