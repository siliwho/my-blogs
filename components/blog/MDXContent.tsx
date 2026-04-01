import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import { ImageWithLightbox } from './ImageWithLightbox';
import { CopyButton } from './CopyButton';

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node)
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props?.children);
  return '';
}

// ── Code block <pre> — wraps rehype-pretty-code output ──────────────────────
function Pre(props: React.HTMLAttributes<HTMLPreElement>) {
  const rawCode = extractText(props.children).trimEnd();

  let lang = '';
  const ch = Array.isArray(props.children) ? props.children[0] : props.children;
  if (ch && typeof ch === 'object' && 'props' in (ch as object)) {
    const cp = (ch as React.ReactElement<{ 'data-language'?: string; className?: string }>).props;
    lang = (cp?.['data-language'] ?? cp?.className ?? '').replace(/^language-/, '');
  }

  return (
    <div className="relative group my-5 not-prose">
      {lang && lang !== 'plaintext' && (
        <div className="absolute top-0 left-0 z-10
          px-3 py-1 rounded-tl-xl rounded-br-lg
          bg-[var(--color-border)]
          font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)]
          select-none pointer-events-none">
          {lang}
        </div>
      )}
      <CopyButton code={rawCode} />
      <pre
        {...props}
        className="overflow-x-auto rounded-xl border border-[var(--color-border)]
          bg-[var(--color-code-bg)] text-[0.8rem] leading-7 font-mono
          px-5 pb-4 pt-8"
      />
    </div>
  );
}

// ── Inline code Fix ──────────────────────────────────────────────────────────
function InlineCode({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
  // rehype-pretty-code identifies block code by language classes
  const isBlock = className?.startsWith('language-') || 
                  !!(props as Record<string, unknown>)['data-language'];

  if (isBlock) {
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <code
      {...props}
      className="not-prose"
      style={{
        display: 'inline', // Changed from inline-block to inline to prevent line breaks
        background: 'var(--color-code-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        padding: '0.15rem 0.3rem',
        color: 'var(--color-code-text)',
        fontFamily: '"Geist Mono", "JetBrains Mono", monospace',
        fontSize: '0.85em',
        wordBreak: 'break-word',
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
      }}
    >
      {children}
    </code>
  );
}

// ── Step number (CSS counter-based) ─────────────────────────────────────────
function StepNumber() { return <span className="step-num" />; }

// ── rehype-pretty-code config ────────────────────────────────────────────────
const prettyCodeOptions = {
  theme: 'one-dark-pro',
  keepBackground: false,
  defaultLang: 'plaintext',
  onVisitLine(node: any) {
    if (node.children.length === 0)
      node.children = [{ type: 'text', value: ' ' }];
  },
  onVisitHighlightedLine(node: any) {
    node.properties.className = [...(node.properties.className ?? []), 'highlighted-line'];
  },
  onVisitHighlightedChars(node: any) {
    node.properties.className = ['highlighted-word'];
  },
};

// ── Main component ────────────────────────────────────────────────────────────
interface Props { source: string; slug: string }

export function MDXContent({ source, slug }: Props) {
  function BlogImage({ src, alt }: { src?: string; alt?: string }) {
    let resolved = src ?? '';
    if (resolved && !resolved.startsWith('http') && !resolved.startsWith('/'))
      resolved = `/blog/${slug}/${resolved}`;
    return <ImageWithLightbox src={resolved} alt={alt ?? ''} />;
  }

  const components = {
    img: BlogImage,
    pre: Pre,
    code: InlineCode,

    blockquote: (p: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        {...p}
        className="not-prose border-l-[3px] border-[var(--color-accent)]
          bg-[var(--color-surface)] rounded-r-lg pl-4 pr-4 py-3 my-4
          text-[var(--color-muted)] text-sm leading-relaxed"
      />
    ),

    hr: () => <hr className="my-8 border-[var(--color-border)]" />,

    Callout: ({ type = 'info', title, children }: any) => {
      const map = {
        info:  { bg: 'bg-blue-500/10',    border: 'border-blue-500/40',    text: 'text-blue-300',    icon: 'ℹ',  label: 'Info' },
        warn:  { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/40',  text: 'text-yellow-300',  icon: '⚠',  label: 'Warning' },
        tip:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-300', icon: '💡', label: 'Tip' },
        error: { bg: 'bg-red-500/10',     border: 'border-red-500/40',     text: 'text-red-300',     icon: '✖',  label: 'Error' },
        note:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/40',  text: 'text-purple-300',  icon: '📌', label: 'Note' },
      } as const;
      const s = map[type as keyof typeof map] ?? map.info;
      return (
        <div className={`not-prose ${s.bg} ${s.border} border rounded-xl p-4 my-5`}>
          <div className={`flex items-center gap-2 font-mono text-xs font-semibold mb-2 ${s.text}`}>
            <span>{s.icon}</span><span>{title ?? s.label}</span>
          </div>
          <div className="text-sm leading-relaxed text-[var(--color-text)]">{children}</div>
        </div>
      );
    },

    Figure: ({ src, caption, alt }: any) => {
      const resolved = src.startsWith('http') || src.startsWith('/')
        ? src : `/blog/${slug}/${src}`;
      return (
        <figure className="my-6 not-prose">
          <ImageWithLightbox src={resolved} alt={alt ?? caption ?? ''} />
          {caption && (
            <figcaption className="text-center text-xs text-[var(--color-muted)] mt-2 font-mono italic">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    },

    Steps: ({ children }: any) => (
      <div className="not-prose my-5 space-y-4" style={{ counterReset: 'step' }}>
        {children}
      </div>
    ),
    Step: ({ title, children }: any) => (
      <div className="flex gap-4" style={{ counterIncrement: 'step' }}>
        <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-accent-dim)]
          border border-[var(--color-accent)]/40 flex items-center justify-center
          font-mono text-xs font-bold text-[var(--color-accent)]">
          <StepNumber />
        </div>
        <div className="flex-1 pt-0.5 pb-2 border-b border-[var(--color-border)] last:border-0">
          {title && <p className="font-semibold text-[var(--color-text)] mb-1 text-sm">{title}</p>}
          <div className="text-sm text-[var(--color-muted)] leading-relaxed">{children}</div>
        </div>
      </div>
    ),

    Kbd: ({ children }: any) => (
      <kbd className="not-prose inline-flex items-center px-1.5 py-0.5 rounded border
        border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[11px]
        text-[var(--color-text)] shadow-[0_1px_0_var(--color-border)]">
        {children}
      </kbd>
    ),

    FileTree: ({ children }: any) => (
      <div className="not-prose my-5 rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-2 font-mono text-[10px] text-[var(--color-muted)]">file tree</span>
        </div>
        <div className="p-4 font-mono text-sm text-[var(--color-text)] leading-7 whitespace-pre bg-[var(--color-code-bg)]">
          {children}
        </div>
      </div>
    ),

    Diff: ({ remove, add }: any) => (
      <div className="not-prose my-5 rounded-xl border border-[var(--color-border)] overflow-hidden font-mono text-sm">
        {remove && (
          <div className="bg-red-500/10 border-b border-[var(--color-border)] px-4 py-2 text-red-400 flex gap-3">
            <span className="select-none opacity-60 shrink-0">−</span><span>{remove}</span>
          </div>
        )}
        {add && (
          <div className="bg-emerald-500/10 px-4 py-2 text-emerald-400 flex gap-3">
            <span className="select-none opacity-60 shrink-0">+</span><span>{add}</span>
          </div>
        )}
      </div>
    ),

    Chip: ({ children }: any) => (
      <span className="not-prose inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px]
        bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
        {children}
      </span>
    ),

    Divider: ({ label }: { label?: string }) => (
      <div className="not-prose flex items-center gap-3 my-8">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        {label && <span className="font-mono text-xs text-[var(--color-muted)] whitespace-nowrap">{label}</span>}
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>
    ),

    Video: ({ src, caption }: any) => {
      const resolved = src.startsWith('http') || src.startsWith('/')
        ? src : `/blog/${slug}/${src}`;
      return (
        <figure className="not-prose my-6">
          <video src={resolved} controls
            className="w-full rounded-xl border border-[var(--color-border)] bg-black" />
          {caption && (
            <figcaption className="text-center text-xs text-[var(--color-muted)] mt-2 font-mono italic">
              {caption}
            </figcaption>
          )}
        </figure>
      );
    },
  };

  return (
    <MDXRemote
      source={source}
      components={components as any}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            rehypeSlug,
            [rehypePrettyCode as any, prettyCodeOptions],
            rehypeKatex,
          ],
        },
      }}
    />
  );
}