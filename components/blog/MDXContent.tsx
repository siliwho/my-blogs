import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import { ImageWithLightbox } from './ImageWithLightbox';
import { CopyButton } from './CopyButton';

// ── Image — auto-resolves relative paths ────────────────────────────────────
function BlogImage({ src, alt, ...props }: { src?: string; alt?: string; [key: string]: unknown }) {
  let resolvedSrc = src ?? '';
  if (resolvedSrc && !resolvedSrc.startsWith('http') && !resolvedSrc.startsWith('/')) {
    resolvedSrc = `/blog-images/${resolvedSrc}`;
  }
  return <ImageWithLightbox src={resolvedSrc} alt={alt ?? ''} />;
}

// ── Extract plain text from React children (for clipboard) ──────────────────
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props?.children);
  }
  return '';
}

// ── Code block wrapper — rehype-pretty-code outputs <figure data-rehype-pretty-code-figure>
//    wrapping <pre><code>. We intercept <pre> to add the copy button + lang badge. ─────────
function Pre(props: React.HTMLAttributes<HTMLPreElement>) {
  const rawCode = extractText(props.children).trimEnd();

  // rehype-pretty-code sets data-language on the <code> child
  let lang = '';
  const children = props.children as React.ReactElement<{ 'data-language'?: string }>;
  if (children && typeof children === 'object' && 'props' in children) {
    lang = children.props?.['data-language'] ?? '';
  }

  return (
    <div className="relative group my-5 not-prose">
      {/* Language badge — top left */}
      {lang && lang !== 'plaintext' && (
        <div className="absolute top-0 left-0 z-10 flex items-center
          px-3 py-1 rounded-tl-xl rounded-br-lg
          bg-[var(--color-border)] border-r border-b border-[var(--color-border)]
          font-mono text-[10px] uppercase tracking-widest text-[var(--color-muted)]
          select-none pointer-events-none">
          {lang}
        </div>
      )}
      {/* Copy button — top right, visible on hover */}
      <CopyButton code={rawCode} />
      {/* The actual <pre> */}
      <pre
        {...props}
        className="overflow-x-auto rounded-xl border border-[var(--color-border)]
          bg-[var(--color-code-bg)] text-[0.8rem] leading-7 font-mono
          px-5 pb-4 pt-8"
        style={{}}
      />
    </div>
  );
}

// ── Inline code ─────────────────────────────────────────────────────────────
function InlineCode({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
  // Skip if it's inside a <pre> (block code) — rehype-pretty-code handles those
  if ((props as { 'data-language'?: string })['data-language'] !== undefined) {
    return <code {...props}>{children}</code>;
  }
  return (
    <code
      className="not-prose inline rounded px-[0.35em] py-[0.1em] font-mono text-[0.82em]
        bg-[var(--color-code-bg)] border border-[var(--color-border)]
        text-[var(--color-code-text)] align-baseline leading-normal whitespace-nowrap"
    >
      {children}
    </code>
  );
}

// ── All MDX components ───────────────────────────────────────────────────────
const components = {
  img:        BlogImage,
  pre:        Pre,
  code:       InlineCode,

  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...props}
      className="not-prose border-l-[3px] border-[var(--color-accent)]
        bg-[var(--color-surface)] rounded-r-lg pl-4 pr-4 py-3 my-4
        text-[var(--color-muted)] text-sm leading-relaxed"
    />
  ),

  hr: () => <hr className="my-8 border-[var(--color-border)]" />,

  // ── Callout ────────────────────────────────────────────────────────────────
  Callout: ({ type = 'info', title, children }: {
    type?: 'info' | 'warn' | 'tip' | 'error' | 'note';
    title?: string;
    children: React.ReactNode;
  }) => {
    const map = {
      info:  { bg: 'bg-blue-500/10',    border: 'border-blue-500/40',    text: 'text-blue-300',    icon: 'ℹ',  label: 'Info' },
      warn:  { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/40',  text: 'text-yellow-300',  icon: '⚠',  label: 'Warning' },
      tip:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-300', icon: '💡', label: 'Tip' },
      error: { bg: 'bg-red-500/10',     border: 'border-red-500/40',     text: 'text-red-300',     icon: '✖',  label: 'Error' },
      note:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/40',  text: 'text-purple-300',  icon: '📌', label: 'Note' },
    };
    const s = map[type] ?? map.info;
    return (
      <div className={`not-prose ${s.bg} ${s.border} border rounded-xl p-4 my-5`}>
        <div className={`flex items-center gap-2 font-mono text-xs font-semibold mb-2 ${s.text}`}>
          <span>{s.icon}</span><span>{title ?? s.label}</span>
        </div>
        <div className="text-sm leading-relaxed text-[var(--color-text)]">{children}</div>
      </div>
    );
  },

  // ── Figure with caption ────────────────────────────────────────────────────
  Figure: ({ src, caption, alt }: { src: string; caption?: string; alt?: string }) => {
    const resolved = src.startsWith('http') || src.startsWith('/') ? src : `/blog-images/${src}`;
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

  // ── Numbered steps ─────────────────────────────────────────────────────────
  Steps: ({ children }: { children: React.ReactNode }) => (
    <div className="not-prose my-5 space-y-4" style={{ counterReset: 'step' }}>
      {children}
    </div>
  ),
  Step: ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div className="flex gap-4" style={{ counterIncrement: 'step' }}>
      <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-accent-dim)]
        border border-[var(--color-accent)]/40 flex items-center justify-center
        font-mono text-xs font-bold text-[var(--color-accent)]"
        style={{ content: 'counter(step)' }}>
        <StepNumber />
      </div>
      <div className="flex-1 pt-0.5 pb-2 border-b border-[var(--color-border)] last:border-0">
        {title && <p className="font-semibold text-[var(--color-text)] mb-1 text-sm">{title}</p>}
        <div className="text-sm text-[var(--color-muted)] leading-relaxed">{children}</div>
      </div>
    </div>
  ),

  // ── Keyboard key ───────────────────────────────────────────────────────────
  Kbd: ({ children }: { children: React.ReactNode }) => (
    <kbd className="not-prose inline-flex items-center px-1.5 py-0.5 rounded border
      border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[11px]
      text-[var(--color-text)] shadow-[0_1px_0_var(--color-border)]">
      {children}
    </kbd>
  ),

  // ── File tree box ──────────────────────────────────────────────────────────
  FileTree: ({ children }: { children: React.ReactNode }) => (
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

  // ── Diff ───────────────────────────────────────────────────────────────────
  Diff: ({ remove, add }: { remove?: string; add?: string }) => (
    <div className="not-prose my-5 rounded-xl border border-[var(--color-border)] overflow-hidden font-mono text-sm">
      {remove && (
        <div className="bg-red-500/10 border-b border-[var(--color-border)] px-4 py-2 text-red-400 flex gap-3">
          <span className="select-none opacity-60 shrink-0">−</span>
          <span>{remove}</span>
        </div>
      )}
      {add && (
        <div className="bg-emerald-500/10 px-4 py-2 text-emerald-400 flex gap-3">
          <span className="select-none opacity-60 shrink-0">+</span>
          <span>{add}</span>
        </div>
      )}
    </div>
  ),

  // ── Chip / badge ───────────────────────────────────────────────────────────
  Chip: ({ children }: { children: React.ReactNode }) => (
    <span className="not-prose inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px]
      bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
      {children}
    </span>
  ),

  // ── Section divider ────────────────────────────────────────────────────────
  Divider: ({ label }: { label?: string }) => (
    <div className="not-prose flex items-center gap-3 my-8">
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      {label && <span className="font-mono text-xs text-[var(--color-muted)] whitespace-nowrap">{label}</span>}
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  ),

  // ── Video embed ────────────────────────────────────────────────────────────
  Video: ({ src, caption }: { src: string; caption?: string }) => (
    <figure className="not-prose my-6">
      <video
        src={src.startsWith('http') || src.startsWith('/') ? src : `/blog-images/${src}`}
        controls
        className="w-full rounded-xl border border-[var(--color-border)] bg-black"
      />
      {caption && (
        <figcaption className="text-center text-xs text-[var(--color-muted)] mt-2 font-mono italic">
          {caption}
        </figcaption>
      )}
    </figure>
  ),
};

// ── Dummy step number component (CSS counter handled via global CSS) ──────────
function StepNumber() {
  return <span className="step-num" />;
}

// ── rehype-pretty-code options ───────────────────────────────────────────────
// Use a single dark theme — Shiki bundled themes only.
// Valid names: https://shiki.style/themes
const prettyCodeOptions = {
  theme: 'one-dark-pro',          // single string — works on Vercel reliably
  keepBackground: false,           // we set background via CSS (var --color-code-bg)
  defaultLang: 'plaintext',
  onVisitLine(node: { children: { type: string; value?: string }[] }) {
    // Prevent empty lines from collapsing
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }];
    }
  },
  onVisitHighlightedLine(node: { properties: { className?: string[] } }) {
    node.properties.className = [
      ...(node.properties.className ?? []),
      'highlighted-line',
    ];
  },
  onVisitHighlightedChars(node: { properties: { className?: string[] } }) {
    node.properties.className = ['highlighted-word'];
  },
};

// ── Main export ──────────────────────────────────────────────────────────────
interface Props { source: string }

export function MDXContent({ source }: Props) {
  return (
    <MDXRemote
      source={source}
      components={components as never}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            rehypeSlug,
            // rehype-pretty-code MUST come before rehypeKatex
            [rehypePrettyCode as never, prettyCodeOptions],
            rehypeKatex,
          ],
        },
      }}
    />
  );
}