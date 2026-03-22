import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import { ImageWithLightbox } from './ImageWithLightbox';
import { CopyButton } from './CopyButton';

// ── Image — auto-resolves relative paths from /public/blog-images/ ──────────
function BlogImage({ src, alt, ...props }: { src?: string; alt?: string; [key: string]: unknown }) {
  let resolvedSrc = src ?? '';
  if (resolvedSrc && !resolvedSrc.startsWith('http') && !resolvedSrc.startsWith('/')) {
    resolvedSrc = `/blog-images/${resolvedSrc}`;
  }
  return <ImageWithLightbox src={resolvedSrc} alt={alt ?? ''} />;
}

// ── Code block — wraps rehype-pretty-code output, adds copy button ───────────
function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement> & { 'data-language'?: string }) {
  // Extract raw text for clipboard
  function extractText(node: React.ReactNode): string {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node && typeof node === 'object' && 'props' in (node as { props?: unknown })) {
      return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props?.children);
    }
    return '';
  }
  const rawCode = extractText(children).trimEnd();
  const lang = props['data-language'] ?? '';

  return (
    <div className="relative group my-5 not-prose">
      {/* Language badge */}
      {lang && (
        <span className="absolute top-3 left-4 font-mono text-[10px] text-[var(--color-muted)] select-none z-10 uppercase tracking-widest">
          {lang}
        </span>
      )}
      {/* Copy button */}
      <CopyButton code={rawCode} />
      {/* Code block */}
      <pre
        {...props}
        className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-code-bg)]
          px-4 pt-10 pb-4 text-sm leading-7 font-mono"
      >
        {children}
      </pre>
    </div>
  );
}

// ── All MDX components ────────────────────────────────────────────────────────
const components = {
  img: BlogImage,
  pre: Pre,

  // Inline code
  code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => {
    // rehype-pretty-code wraps block code in <pre><code> — skip inline styling for those
    if (props.className?.includes('language-')) return <code {...props}>{children}</code>;
    return (
      <code
        {...props}
        className="not-prose inline rounded px-[0.35em] py-[0.1em] font-mono text-[0.82em]
          bg-[var(--color-code-bg)] border border-[var(--color-border)] text-[var(--color-code-text)]
          align-baseline leading-normal"
      >
        {children}
      </code>
    );
  },

  // Headings with anchor link
  h2: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id={id} className="group flex items-center gap-2 scroll-mt-20" {...props}>
      {children}
      {id && (
        <a href={`#${id}`} aria-label="Link to section"
          className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-[var(--color-accent)] no-underline text-lg">
          #
        </a>
      )}
    </h2>
  ),
  h3: ({ children, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 id={id} className="group flex items-center gap-2 scroll-mt-20" {...props}>
      {children}
      {id && (
        <a href={`#${id}`} aria-label="Link to section"
          className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity text-[var(--color-accent)] no-underline">
          #
        </a>
      )}
    </h3>
  ),

  // Blockquote
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      {...props}
      className="not-prose border-l-[3px] border-[var(--color-accent)] bg-[var(--color-surface)]
        rounded-r-lg pl-4 pr-4 py-3 my-4 text-[var(--color-muted)] text-sm leading-relaxed"
    />
  ),

  // Horizontal rule
  hr: () => <hr className="my-8 border-[var(--color-border)]" />,

  // ── Custom MDX components ──────────────────────────────────────────────────

  // <Callout type="tip|info|warn|error">text</Callout>
  Callout: ({ type = 'info', title, children }: {
    type?: 'info' | 'warn' | 'tip' | 'error' | 'note';
    title?: string;
    children: React.ReactNode;
  }) => {
    const map = {
      info:  { bg: 'bg-blue-500/10',    border: 'border-blue-500/40',   text: 'text-blue-300',   icon: 'ℹ',  label: 'Info' },
      warn:  { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/40', text: 'text-yellow-300', icon: '⚠',  label: 'Warning' },
      tip:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40',text: 'text-emerald-300',icon: '💡', label: 'Tip' },
      error: { bg: 'bg-red-500/10',     border: 'border-red-500/40',    text: 'text-red-300',    icon: '✖',  label: 'Error' },
      note:  { bg: 'bg-purple-500/10',  border: 'border-purple-500/40', text: 'text-purple-300', icon: '📌', label: 'Note' },
    };
    const s = map[type] ?? map.info;
    return (
      <div className={`not-prose ${s.bg} ${s.border} border rounded-xl p-4 my-5`}>
        <div className={`flex items-center gap-2 font-mono text-xs font-semibold mb-2 ${s.text}`}>
          <span>{s.icon}</span>
          <span>{title ?? s.label}</span>
        </div>
        <div className="text-sm leading-relaxed text-[var(--color-text)]">{children}</div>
      </div>
    );
  },

  // <Figure src="img.png" caption="My caption" />
  Figure: ({ src, caption, alt }: { src: string; caption?: string; alt?: string }) => {
    const resolved = src.startsWith('http') || src.startsWith('/') ? src : `/blog-images/${src}`;
    return (
      <figure className="my-6 not-prose">
        <ImageWithLightbox src={resolved} alt={alt ?? caption ?? ''} className="mx-auto" />
        {caption && (
          <figcaption className="text-center text-xs text-[var(--color-muted)] mt-2 font-mono italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  },

  // <Steps> numbered steps list
  Steps: ({ children }: { children: React.ReactNode }) => (
    <div className="not-prose my-5 space-y-4 [counter-reset:step]">
      {children}
    </div>
  ),
  Step: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="flex gap-4 [counter-increment:step]">
      <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/40
        flex items-center justify-center font-mono text-sm font-bold text-[var(--color-accent)] [content:counter(step)]">
        <span className="before:[content:counter(step)]" />
      </div>
      <div className="flex-1 pt-0.5">
        {title && <p className="font-semibold text-[var(--color-text)] mb-1">{title}</p>}
        <div className="text-sm text-[var(--color-muted)] leading-relaxed">{children}</div>
      </div>
    </div>
  ),

  // <Tabs> — simple tab switcher
  // <Kbd> keyboard shortcut badge
  Kbd: ({ children }: { children: React.ReactNode }) => (
    <kbd className="not-prose inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border
      border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[11px]
      text-[var(--color-text)] shadow-[0_1px_0_var(--color-border)]">
      {children}
    </kbd>
  ),

  // <FileTree> minimal file tree display
  FileTree: ({ children }: { children: React.ReactNode }) => (
    <div className="not-prose my-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-code-bg)]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        <span className="ml-2 font-mono text-xs text-[var(--color-muted)]">file tree</span>
      </div>
      <div className="p-4 font-mono text-sm text-[var(--color-text)] leading-7 whitespace-pre">
        {children}
      </div>
    </div>
  ),

  // <Diff> — show a before/after diff block
  Diff: ({ children, add, remove }: { children?: React.ReactNode; add?: string; remove?: string }) => (
    <div className="not-prose my-5 rounded-xl border border-[var(--color-border)] overflow-hidden font-mono text-sm">
      {remove && (
        <div className="bg-red-500/10 border-b border-[var(--color-border)] px-4 py-2 text-red-400">
          <span className="select-none mr-2 opacity-50">−</span>{remove}
        </div>
      )}
      {add && (
        <div className="bg-emerald-500/10 px-4 py-2 text-emerald-400">
          <span className="select-none mr-2 opacity-50">+</span>{add}
        </div>
      )}
      {children}
    </div>
  ),

  // <Chip> — small inline tag/badge
  Chip: ({ children, color = 'accent' }: { children: React.ReactNode; color?: string }) => (
    <span className="not-prose inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px]
      bg-[var(--color-accent-dim)] text-[var(--color-accent)] border border-[var(--color-accent)]/20">
      {children}
    </span>
  ),

  // <Divider label="Section" />
  Divider: ({ label }: { label?: string }) => (
    <div className="not-prose flex items-center gap-3 my-8">
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      {label && <span className="font-mono text-xs text-[var(--color-muted)] whitespace-nowrap">{label}</span>}
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  ),

  // <Video src="demo.mp4" /> — self-hosted video
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

  // <Tweet id="1234567890" /> — embed a tweet by ID
  Tweet: ({ id }: { id: string }) => (
    <div className="not-prose my-5 flex justify-center">
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={`https://twitter.com/i/web/status/${id}`}>Loading tweet…</a>
      </blockquote>
    </div>
  ),
};

// ── rehype-pretty-code options (Shiki) ────────────────────────────────────────
const prettyCodeOptions = {
  // Theme — one dark pro feel on dark, github light on light
  theme: {
    dark:     'one-dark-pro',
    light:    'github-light',
    terminal: 'vitesse-dark',
    steel:    'nord',
    obsidian: 'vesper',
  },
  // Show line numbers
  defaultLang: 'plaintext',
  // Word wrap for long lines
  keepBackground: false,
  // Highlight specific lines with {1,3-5} syntax in fences
  onVisitLine(node: { children: { type: string }[] }) {
    if (node.children.length === 0) {
      node.children = [{ type: 'text' }];
    }
  },
  onVisitHighlightedLine(node: { properties: { className: string[] } }) {
    node.properties.className.push('highlighted-line');
  },
  onVisitHighlightedChars(node: { properties: { className: string[] } }) {
    node.properties.className = ['highlighted-word'];
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
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            rehypeSlug,
            [rehypePrettyCode as never, prettyCodeOptions],
            rehypeKatex,
          ],
        },
      }}
    />
  );
}