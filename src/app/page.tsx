'use client';

import { useState } from 'react';
import BlogPostList from '@/components/BlogPostList';
import { BlogPost } from '@/types/blog';

export default function Home() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to scrape posts');
      }
      
      const data = await response.json();
      setPosts(data.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          Blog Post Scraper
        </h1>
        <div className="mb-8">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            onClick={handleScrape}
            disabled={isLoading}
          >
            {isLoading ? 'Scraping...' : 'Scrape New Posts'}
          </button>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {posts.length > 0 ? (
          <BlogPostList posts={posts} />
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No posts scraped yet. Click the button above to start scraping.
          </p>
        )}
      </div>
    </main>
  );
}
