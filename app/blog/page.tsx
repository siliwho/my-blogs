import type { Metadata } from 'next';
import { getAllPosts, getAllTags, getAllCategories } from '@/lib/blog';
import { BlogListClient } from './BlogListClient';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Writings on embedded systems, firmware, kernel development, and low-level programming.',
};

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();
  const categories = getAllCategories();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="font-mono text-xs text-[var(--color-accent)] mb-2">// writings</p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-text)] mb-3">Blog</h1>
        <p className="text-[var(--color-muted)] max-w-xl">
          Deep dives into embedded systems, firmware internals, kernel hacking, and systems programming.
          Written for engineers who want to understand what&apos;s happening at the metal.
        </p>
        <p className="font-mono text-xs text-[var(--color-muted)] mt-3">
          {posts.length} posts · {tags.length} tags
        </p>
      </div>

      <BlogListClient posts={posts} tags={tags} categories={categories} />
    </div>
  );
}
