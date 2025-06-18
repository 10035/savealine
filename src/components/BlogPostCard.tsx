import { BlogPost } from '@/types/blog';

interface BlogPostCardProps {
  post: BlogPost;
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-bold mb-2">
        <a 
          href={post.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {post.title}
        </a>
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
        {post.excerpt}
      </p>
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <span>{post.author}</span>
        <span>{post.date}</span>
      </div>
    </article>
  );
} 