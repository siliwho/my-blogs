'use client';
import { useState } from 'react';
import { FileText, X, Download, Tag, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import type { PDFItem } from '@/lib/pdfs';

interface Props {
  pdfs: PDFItem[];
  categories: string[];
}

export function PDFListClient({ pdfs, categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<PDFItem | null>(null);

  const filtered = activeCategory ? pdfs.filter(p => p.category === activeCategory) : pdfs;

  return (
    <div>
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !activeCategory
              ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
              : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === cat
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PDF list */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(pdf => (
          <div
            key={pdf.id}
            className="group flex items-start gap-4 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-all cursor-pointer"
            onClick={() => setViewingPdf(pdf)}
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-[var(--color-accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-display font-semibold text-sm text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                  {pdf.title}
                </h3>
                <ExternalLink size={12} className="text-[var(--color-muted)] shrink-0 mt-0.5" />
              </div>
              <p className="text-xs text-[var(--color-muted)] mb-2 line-clamp-2">{pdf.description}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-[var(--color-accent)] bg-[var(--color-accent-dim)] px-2 py-0.5 rounded">
                  {pdf.category}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-muted)]">
                  {format(new Date(pdf.date), 'MMM yyyy')}
                </span>
                {pdf.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-0.5 font-mono text-[10px] text-[var(--color-muted)]">
                    <Tag size={8} />{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="font-mono text-[var(--color-muted)] text-sm">// no documents in this category</p>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-[var(--color-accent)] shrink-0" />
                <span className="font-display font-semibold text-sm text-[var(--color-text)] truncate">
                  {viewingPdf.title}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-accent)] bg-[var(--color-accent-dim)] px-2 py-0.5 rounded shrink-0">
                  {viewingPdf.category}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={`/pdfs/${viewingPdf.filename}`}
                  download
                  className="flex items-center gap-1 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors px-2 py-1 rounded border border-[var(--color-border)]"
                >
                  <Download size={12} /> Download
                </a>
                <button
                  onClick={() => setViewingPdf(null)}
                  className="p-1.5 rounded-md text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* PDF embed */}
            <div className="flex-1 min-h-0">
              <embed
                src={`/pdfs/${viewingPdf.filename}`}
                type="application/pdf"
                className="w-full h-full"
                style={{ minHeight: '70vh' }}
              />
            </div>

            {/* Fallback message */}
            <div className="px-5 py-2 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
              <p className="font-mono text-[10px] text-[var(--color-muted)]">
                If the PDF doesn&apos;t display,{' '}
                <a href={`/pdfs/${viewingPdf.filename}`} download className="text-[var(--color-accent)] hover:underline">
                  download it here
                </a>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
