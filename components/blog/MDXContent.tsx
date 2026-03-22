import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import { ImageWithLightbox } from './ImageWithLightbox';

// Custom image component — resolves paths from /public/blog-images/
function BlogImage({ src, alt, ...props }: { src?: string; alt?: string; [key: string]: unknown }) {
  // If src is relative (no http/https, no leading /), resolve to /blog-images/
  let resolvedSrc = src ?? '';
  if (resolvedSrc && !resolvedSrc.startsWith('http') && !resolvedSrc.startsWith('/')) {
    resolvedSrc = `/blog-images/${resolvedSrc}`;
  }
  return <ImageWithLightbox src={resolvedSrc} alt={alt ?? ''} {...props} />;
}

const components = {
  img: BlogImage,

  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre {...props} className="not-prose" />
  ),

  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...props}
      className="border-l-2 border-[var(--color-accent)] bg-[var(--color-surface)] rounded-r-lg pl-4 py-2 my-4 text-[var(--color-muted)] not-italic"
    />
  ),

  // Callout component for use in MDX: <Callout type="tip">text</Callout>
  Callout: ({ type = 'info', children }: { type?: 'info' | 'warn' | 'tip' | 'error'; children: React.ReactNode }) => {
    const styles = {
      info:  'border-blue-500/40   bg-blue-500/10   text-blue-300',
      warn:  'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
      tip:   'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
      error: 'border-red-500/40    bg-red-500/10    text-red-300',
    };
    const icons = { info: 'ℹ', warn: '⚠', tip: '💡', error: '✖' };
    return (
      <div className={`border rounded-lg p-4 my-4 flex gap-3 ${styles[type]}`}>
        <span className="text-lg shrink-0">{icons[type]}</span>
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    );
  },

  // Figure with caption: <Figure src="img.png" caption="My caption" />
  Figure: ({ src, caption, alt }: { src: string; caption?: string; alt?: string }) => {
    const resolved = src.startsWith('http') || src.startsWith('/') ? src : `/blog-images/${src}`;
    return (
      <figure className="my-6">
        <ImageWithLightbox src={resolved} alt={alt ?? caption ?? ''} className="mx-auto" />
        {caption && (
          <figcaption className="text-center text-xs text-[var(--color-muted)] mt-2 font-mono">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  },
};

interface Props { source: string }

export function MDXContent({ source }: Props) {
  return (
    <MDXRemote
      source={source}
      components={components as never}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug, rehypeHighlight],
        },
      }}
    />
  );
}
