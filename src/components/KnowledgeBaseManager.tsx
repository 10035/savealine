'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type KnowledgeBase = Database['public']['Tables']['knowledge_bases']['Row'];

type KnowledgeBaseManagerProps = {
  selectedKnowledgeBase: KnowledgeBase | null;
  onSelect: (base: KnowledgeBase) => void;
};

export default function KnowledgeBaseManager({ selectedKnowledgeBase, onSelect }: KnowledgeBaseManagerProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBaseName, setNewBaseName] = useState('');
  const [newBaseDescription, setNewBaseDescription] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get the current user's ID
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchKnowledgeBases();
    }
  }, [userId]);

  const fetchKnowledgeBases = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_bases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKnowledgeBases(data || []);
    } catch (error) {
      console.error('Error fetching knowledge bases:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch knowledge bases');
    } finally {
      setLoading(false);
    }
  };

  const createKnowledgeBase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('You must be logged in to create a knowledge base');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('knowledge_bases')
        .insert({
          name: newBaseName,
          description: newBaseDescription,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      setKnowledgeBases([data, ...knowledgeBases]);
      setNewBaseName('');
      setNewBaseDescription('');
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      setError(error instanceof Error ? error.message : 'Failed to create knowledge base');
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-gray-600">Please sign in to manage your knowledge bases.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Create New Knowledge Base</h2>
        <form onSubmit={createKnowledgeBase} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={newBaseName}
              onChange={(e) => setNewBaseName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              value={newBaseDescription}
              onChange={(e) => setNewBaseDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Knowledge Base
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Your Knowledge Bases</h2>
        {knowledgeBases.length === 0 ? (
          <p className="text-gray-500">No knowledge bases created yet.</p>
        ) : (
          <>
            <div className="mb-4">
              <label htmlFor="knowledge-base-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select a Knowledge Base
              </label>
              <select
                id="knowledge-base-select"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedKnowledgeBase?.id || ''}
                onChange={e => {
                  const base = knowledgeBases.find(b => b.id === e.target.value);
                  if (base) onSelect(base);
                }}
              >
                <option value="" disabled>Select...</option>
                {knowledgeBases.map(base => (
                  <option key={base.id} value={base.id}>{base.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              {knowledgeBases.map((base) => (
                <div
                  key={base.id}
                  className={`border rounded-lg p-4 ${selectedKnowledgeBase?.id === base.id ? 'border-blue-500 bg-blue-50' : ''}`}
                >
                  <h3 className="text-xl font-semibold mb-2">{base.name}</h3>
                  {base.description && (
                    <p className="text-gray-600 mb-2">{base.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    Created: {new Date(base.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
} 