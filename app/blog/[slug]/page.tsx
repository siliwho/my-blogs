import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { MDXContent } from '@/components/blog/MDXContent';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { DownloadPDFButton } from '@/components/blog/DownloadPDFButton';
import { SITE_CONFIG } from '@/lib/config';

interface Params { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [SITE_CONFIG.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex gap-12">
        {/* ── Main article ── */}
        <article className="flex-1 min-w-0" id="blog-article">
          {/* Back link */}
          <Link href="/blog"
            className="no-print inline-flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors mb-8">
            <ArrowLeft size={12} /> back to blog
          </Link>

          {/* Meta */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="font-mono text-xs text-[var(--color-accent)] bg-[var(--color-accent-dim)] px-2 py-0.5 rounded">
                {post.category}
              </span>
              <span className="flex items-center gap-1 font-mono text-xs text-[var(--color-muted)]">
                <Calendar size={11} /> {format(new Date(post.date), 'MMMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1 font-mono text-xs text-[var(--color-muted)]">
                <Clock size={11} /> {post.readingTime}
              </span>
              {/* PDF download */}
              <div className="ml-auto">
                <DownloadPDFButton title={post.title} author={SITE_CONFIG.author} date={format(new Date(post.date), 'MMMM d, yyyy')} />
              </div>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-text)] leading-tight mb-4">
              {post.title}
            </h1>

            {post.description && (
              <p className="text-lg text-[var(--color-muted)] leading-relaxed">
                {post.description}
              </p>
            )}

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5 no-print">
                {post.tags.map(tag => (
                  <Link key={tag} href={`/blog?tag=${tag}`}
                    className="flex items-center gap-1 font-mono text-xs text-[var(--color-muted)] bg-[var(--color-border)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-accent)] px-2 py-0.5 rounded transition-colors">
                    <Tag size={10} /> {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <hr className="border-[var(--color-border)] mb-10" />

          {/* MDX content */}
          <div className="prose prose-invert max-w-none">
            <MDXContent source={post.content} />
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-[var(--color-border)] no-print">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Link href="/blog"
                className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
                <ArrowLeft size={12} /> All posts
              </Link>
              <DownloadPDFButton title={post.title} author={SITE_CONFIG.author} date={format(new Date(post.date), 'MMMM d, yyyy')} />
            </div>
          </div>
        </article>

        {/* ── Sidebar TOC ── */}
        <aside className="no-print hidden xl:block w-64 shrink-0">
          <div className="sticky top-24">
            <TableOfContents content={post.content} />
          </div>
        </aside>
      </div>
    </div>
  );
}
