import type { Metadata } from 'next';
import { PDFS, PDF_CATEGORIES } from '@/lib/pdfs';
import { PDFListClient } from './PDFListClient';

export const metadata: Metadata = {
  title: 'PDFs',
  description: 'Research papers, datasheets, notes and technical documents.',
};

export default function PDFsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <p className="font-mono text-xs text-[var(--color-accent)] mb-2">// reference library</p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-text)] mb-3">PDFs</h1>
        <p className="text-[var(--color-muted)] max-w-xl">
          Datasheets, research papers, personal notes, and technical references. View directly in-browser.
        </p>
        <p className="font-mono text-xs text-[var(--color-muted)] mt-3">
          {PDFS.length} documents · {PDF_CATEGORIES.length} categories
        </p>
      </div>
      <PDFListClient pdfs={PDFS} categories={PDF_CATEGORIES} />
    </div>
  );
}
