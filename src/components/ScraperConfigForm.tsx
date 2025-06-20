'use client';

import { useState, useEffect } from 'react';
import { ScrapeConfig } from '@/types/scraper';

interface ScraperConfigFormProps {
  onSubmit: (config: ScrapeConfig) => void;
  loading: boolean;
}

export default function ScraperConfigForm({ onSubmit, loading }: ScraperConfigFormProps) {
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState<'blog' | 'guide' | 'book'>('blog');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setCategories([]);
      setCategory('');
      setCatError(null);
      return;
    }
    setFetchingCategories(true);
    setCatError(null);
    fetch(`/api/categories?url=${encodeURIComponent(url)}`)
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          setCategories(data.categories);
        } else {
          setCategories([]);
          setCatError('No categories found');
        }
      })
      .catch(() => {
        setCategories([]);
        setCatError('Failed to fetch categories');
      })
      .finally(() => setFetchingCategories(false));
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      url,
      source_type: sourceType,
      knowledge_base_id: '', // This will be set by the parent component
      name: url.split('/').pop() || url,
      category: category || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          URL
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="sourceType" className="block text-sm font-medium text-gray-700">
          Source Type
        </label>
        <select
          id="sourceType"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as 'blog' | 'guide' | 'book')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="blog">Blog Post</option>
          <option value="guide">Guide</option>
          <option value="book">Book</option>
        </select>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category/Tag (optional)
        </label>
        {fetchingCategories && <div className="text-xs text-gray-500">Loading categories...</div>}
        {catError && <div className="text-xs text-red-500">{catError}</div>}
        {categories.length > 0 ? (
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">-- Select a category --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="e.g. Blog, Finance, Product, etc."
          />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Importing...' : 'Import Content'}
      </button>
    </form>
  );
} 