import Link from 'next/link';
import { Calendar, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import type { BlogPost } from '@/lib/blog';

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`}
      className="group block p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-all duration-200 hover:-translate-y-0.5">
      {/* Category */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] text-[var(--color-accent)] bg-[var(--color-accent-dim)] px-2 py-0.5 rounded">
          {post.category}
        </span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-muted)]">
          <Clock size={10} /> {post.readingTime}
        </span>
      </div>

      <h3 className="font-display font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors mb-2 line-clamp-2">
        {post.title}
      </h3>

      <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-4 line-clamp-2">
        {post.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-muted)]">
          <Calendar size={10} />
          {format(new Date(post.date), 'MMM d, yyyy')}
        </span>
        {post.tags.slice(0, 2).map(tag => (
          <span key={tag}
            className="flex items-center gap-0.5 font-mono text-[10px] text-[var(--color-muted)] bg-[var(--color-border)] px-2 py-0.5 rounded">
            <Tag size={8} />{tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
