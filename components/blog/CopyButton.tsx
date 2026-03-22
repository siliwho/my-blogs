'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      title={copied ? 'Copied!' : 'Copy code'}
      className="absolute top-2.5 right-3 z-10 flex items-center gap-1.5
        px-2 py-1 rounded-md font-mono text-[10px] transition-all duration-150
        opacity-0 group-hover:opacity-100
        bg-[var(--color-border)] hover:bg-[var(--color-accent-dim)]
        text-[var(--color-muted)] hover:text-[var(--color-accent)]
        border border-transparent hover:border-[var(--color-accent)]/30"
    >
      {copied
        ? <><Check size={11} /> Copied</>
        : <><Copy size={11} /> Copy</>
      }
    </button>
  );
}