import { BlogPost } from '@/types/blog';
import BlogPostCard from './BlogPostCard';

interface BlogPostListProps {
  posts: BlogPost[];
}

export default function BlogPostList({ posts }: BlogPostListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => (
        <BlogPostCard key={`${post.source}-${index}`} post={post} />
      ))}
    </div>
  );
} 