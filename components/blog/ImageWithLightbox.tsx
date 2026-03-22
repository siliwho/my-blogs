'use client';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, Download } from 'lucide-react';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export function ImageWithLightbox({ src, alt, className = '' }: Props) {
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal target only exists client-side
  useEffect(() => { setMounted(true); }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, close]);

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = src;
    a.download = alt || src.split('/').pop() || 'image';
    a.click();
  }

  const lightbox = mounted && open
    ? createPortal(
        <div
          className="lightbox-overlay"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged: ${alt}`}
        >
          {/* Toolbar */}
          <div
            className="absolute top-4 right-4 flex gap-2 z-10 no-print"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white
                         text-xs font-mono px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors"
            >
              <Download size={13} /> Save
            </button>
            <button
              onClick={close}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white
                         text-xs font-mono px-3 py-1.5 rounded-lg backdrop-blur-sm transition-colors"
            >
              <X size={13} /> Close
            </button>
          </div>

          {/* Full-size image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={e => e.stopPropagation()}
            className="max-w-[90vw] max-h-[88vh] object-contain rounded-xl shadow-2xl"
          />

          {/* Caption */}
          {alt && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs
                          text-white/60 bg-black/40 px-3 py-1 rounded-full whitespace-nowrap no-print">
              {alt}
            </p>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Thumbnail — plain <img>, no block wrappers so it stays valid inside <p> */}
      <span
        className="relative inline-block group cursor-zoom-in"
        onClick={() => setOpen(true)}
        style={{ maxWidth: '100%' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`rounded-lg border border-[var(--color-border)]
            transition-all duration-200 hover:opacity-90 hover:border-[var(--color-accent)]/40
            max-w-full h-auto ${className}`}
        />
        {/* Zoom hint */}
        <span className="absolute inset-0 flex items-center justify-center
                         opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="flex items-center gap-1.5 bg-black/60 text-white text-xs
                           font-mono px-2.5 py-1 rounded-full backdrop-blur-sm">
            <ZoomIn size={11} /> zoom
          </span>
        </span>
      </span>

      {/* Lightbox rendered in a portal — outside <p> entirely */}
      {lightbox}
    </>
  );
}
