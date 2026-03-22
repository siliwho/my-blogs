'use client';
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { BlogCard } from '@/components/blog/BlogCard';
import type { BlogPost } from '@/lib/blog';

interface Props {
  posts: BlogPost[];
  tags: string[];
  categories: string[];
}

export function BlogListClient({ posts, tags, categories }: Props) {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return posts.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q));
      const matchTag = !activeTag || p.tags.includes(activeTag);
      const matchCat = !activeCategory || p.category === activeCategory;
      return matchSearch && matchTag && matchCat;
    });
  }, [posts, search, activeTag, activeCategory]);

  function clearFilters() {
    setSearch('');
    setActiveTag(null);
    setActiveCategory(null);
  }

  const hasFilters = search || activeTag || activeCategory;

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          type="text"
          placeholder="Search posts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 font-mono"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-text)]">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`font-mono text-xs px-3 py-1 rounded-full border transition-colors ${
                activeCategory === cat
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-8">
          {tags.map(tag => (
            <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`font-mono text-[10px] px-2 py-0.5 rounded transition-colors ${
                activeTag === tag
                  ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}>
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Results count + clear */}
      <div className="flex items-center justify-between mb-6">
        <p className="font-mono text-xs text-[var(--color-muted)]">
          {filtered.length} post{filtered.length !== 1 ? 's' : ''}
          {hasFilters ? ' found' : ''}
        </p>
        {hasFilters && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
            <X size={10} /> Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(post => <BlogCard key={post.slug} post={post} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-mono text-[var(--color-muted)] text-sm">// no posts found</p>
          <button onClick={clearFilters} className="mt-3 font-mono text-xs text-[var(--color-accent)] hover:underline">
            clear filters
          </button>
        </div>
      )}
    </div>
  );
}
