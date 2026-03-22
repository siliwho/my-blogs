'use client';
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface Props { title: string; author: string; date: string; }

export function DownloadPDFButton({ title, author, date }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const jsPDF   = (await import('jspdf')).default;
      const html2canvas = (await import('html2canvas')).default;

      // ── 1. Clone article into an off-screen white container ──────────────
      const article = document.querySelector('#blog-article') as HTMLElement;
      if (!article) { setLoading(false); return; }

      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        left: -9999px; top: 0;
        width: 780px;
        padding: 48px 56px;
        background: #ffffff;
        color: #111111;
        font-family: 'Geist', 'Inter', -apple-system, sans-serif;
        font-size: 14px;
        line-height: 1.75;
        z-index: -1;
      `;

      // ── 2. Deep-clone the article ──────────────────────────────────────
      const clone = article.cloneNode(true) as HTMLElement;

      // Remove no-print elements
      clone.querySelectorAll('.no-print').forEach(el => el.remove());

      // ── 3. Apply clean print CSS to all elements ───────────────────────
      const printStyle = document.createElement('style');
      printStyle.textContent = `
        * { box-sizing: border-box; }

        /* base text */
        #pdf-clone, #pdf-clone p, #pdf-clone li, #pdf-clone span, #pdf-clone div {
          color: #111111 !important;
          background: transparent !important;
        }

        /* headings */
        #pdf-clone h1, #pdf-clone h2, #pdf-clone h3, #pdf-clone h4 {
          color: #000000 !important;
          font-weight: 700 !important;
          margin-top: 1.6rem !important;
          margin-bottom: 0.5rem !important;
          background: none !important;
          border-bottom: none !important;
          letter-spacing: -0.01em;
        }
        #pdf-clone h1 { font-size: 1.9rem; }
        #pdf-clone h2 { font-size: 1.35rem; border-bottom: 1.5px solid #e0e0e0 !important; padding-bottom: 0.3rem; }
        #pdf-clone h3 { font-size: 1.1rem; }

        /* links */
        #pdf-clone a { color: #1a56db !important; text-decoration: underline; }

        /* paragraphs */
        #pdf-clone p { margin: 0.8rem 0 !important; }

        /* inline code — NO dark bg, just a light box */
        #pdf-clone code {
          background: #f0f2f5 !important;
          color: #c0392b !important;
          border: 1px solid #d0d7de !important;
          border-radius: 3px !important;
          padding: 0.1em 0.35em !important;
          font-size: 0.82em !important;
          font-family: 'Geist Mono', 'JetBrains Mono', monospace !important;
          vertical-align: baseline !important;
          display: inline !important;
          white-space: nowrap !important;
          line-height: 1.4 !important;
        }

        /* code blocks */
        #pdf-clone pre {
          background: #f5f7fa !important;
          border: 1.5px solid #d0d7de !important;
          border-radius: 6px !important;
          padding: 0.9rem 1rem !important;
          overflow: hidden !important;
          margin: 1rem 0 !important;
          page-break-inside: avoid;
        }
        #pdf-clone pre code {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          color: #24292f !important;
          font-size: 0.78rem !important;
          display: block !important;
          white-space: pre-wrap !important;
          word-break: break-all !important;
          line-height: 1.7 !important;
        }

        /* syntax highlight tokens — override dark colors */
        #pdf-clone pre .hljs-keyword, #pdf-clone pre .hljs-selector-tag { color: #cf222e !important; }
        #pdf-clone pre .hljs-string, #pdf-clone pre .hljs-attr { color: #0a3069 !important; }
        #pdf-clone pre .hljs-comment { color: #6e7781 !important; }
        #pdf-clone pre .hljs-number, #pdf-clone pre .hljs-literal { color: #0550ae !important; }
        #pdf-clone pre .hljs-function, #pdf-clone pre .hljs-title { color: #8250df !important; }
        #pdf-clone pre .hljs-variable, #pdf-clone pre .hljs-name { color: #953800 !important; }
        #pdf-clone pre .hljs-type { color: #0550ae !important; }
        #pdf-clone pre .hljs-built_in { color: #8250df !important; }

        /* blockquote */
        #pdf-clone blockquote {
          border-left: 3px solid #666 !important;
          background: #f9f9f9 !important;
          color: #555 !important;
          padding: 0.7rem 1rem !important;
          margin: 1rem 0 !important;
          border-radius: 0 4px 4px 0 !important;
        }
        #pdf-clone blockquote p { margin: 0 !important; }

        /* hr */
        #pdf-clone hr { border: none !important; border-top: 1px solid #e0e0e0 !important; margin: 1.5rem 0 !important; }

        /* tables */
        #pdf-clone table { border-collapse: collapse !important; width: 100% !important; margin: 1rem 0 !important; }
        #pdf-clone th { background: #f0f0f0 !important; color: #111 !important; border: 1px solid #ccc !important; padding: 0.4rem 0.7rem !important; font-weight: 600 !important; }
        #pdf-clone td { border: 1px solid #ddd !important; padding: 0.35rem 0.7rem !important; color: #111 !important; }
        #pdf-clone tr:nth-child(even) td { background: #f9f9f9 !important; }

        /* images */
        #pdf-clone img { max-width: 100% !important; border-radius: 6px !important; border: 1px solid #d0d7de !important; display: block !important; margin: 1rem auto !important; }

        /* callout boxes */
        #pdf-clone .border { border-color: #ccc !important; }

        /* lists */
        #pdf-clone ul, #pdf-clone ol { padding-left: 1.4rem !important; }
        #pdf-clone li { margin: 0.2rem 0 !important; color: #111 !important; }

        /* meta badges / spans */
        #pdf-clone [class*="bg-"] { background: #f0f0f0 !important; }
        #pdf-clone [class*="text-"] { color: #111 !important; }
      `;

      clone.id = 'pdf-clone';
      container.appendChild(printStyle);
      container.appendChild(clone);
      document.body.appendChild(container);

      // ── 4. Wait a tick for styles to apply ─────────────────────────────
      await new Promise(r => setTimeout(r, 120));

      // ── 5. Render to canvas ────────────────────────────────────────────
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 780,
        windowWidth: 780,
        logging: false,
        imageTimeout: 10000,
        onclone: (doc) => {
          // Ensure all colors in cloned doc are white-bg
          const allEls = doc.querySelectorAll('*');
          allEls.forEach((el) => {
            const s = (el as HTMLElement).style;
            if (s.backgroundColor && s.backgroundColor.includes('oklch')) {
              s.backgroundColor = '#f0f0f0';
            }
          });
        },
      });

      document.body.removeChild(container);

      // ── 6. Build PDF ───────────────────────────────────────────────────
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();   // 210mm
      const pageH = pdf.internal.pageSize.getHeight();  // 297mm
      const margin = { top: 18, bottom: 14, left: 14, right: 14 };
      const contentW = pageW - margin.left - margin.right; // 182mm

      // ── Header (page 1) ────────────────────────────────────────────────
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(20, 20, 20);
      const titleLines = pdf.splitTextToSize(title, contentW);
      pdf.text(titleLines, margin.left, margin.top - 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      const headerY = margin.top - 6 + titleLines.length * 5;
      pdf.text(`${author}  ·  ${date}`, margin.left, headerY);

      pdf.setDrawColor(210, 210, 210);
      pdf.setLineWidth(0.3);
      pdf.line(margin.left, headerY + 3, pageW - margin.right, headerY + 3);

      const firstContentY = headerY + 7;

      // ── Paginate canvas image ──────────────────────────────────────────
      const imgW = contentW;
      const totalImgH = (canvas.height * imgW) / (canvas.width / 2); // account for scale:2

      // mm per pixel (at scale 2, canvas px = 2x actual)
      // canvas width in mm = contentW → 1 canvas px = contentW / canvas.width mm
      const pxToMm = imgW / canvas.width;
      const totalImgMm = canvas.height * pxToMm;

      const firstPageContentH = pageH - firstContentY - margin.bottom;
      const otherPageContentH = pageH - margin.top - margin.bottom;

      let drawnMm = 0;
      let pageNum = 0;

      while (drawnMm < totalImgMm) {
        if (pageNum > 0) {
          pdf.addPage();
          // Continuation header
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7);
          pdf.setTextColor(160, 160, 160);
          pdf.text(title, margin.left, 9, { maxWidth: contentW - 20 });
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(0.2);
          pdf.line(margin.left, 11, pageW - margin.right, 11);
        }

        const availH = pageNum === 0 ? firstPageContentH : otherPageContentH;
        const sliceMm = Math.min(availH, totalImgMm - drawnMm);
        const slicePx = sliceMm / pxToMm;
        const srcYpx  = drawnMm / pxToMm;

        // Crop slice from canvas
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = Math.ceil(slicePx);
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, srcYpx, canvas.width, slicePx, 0, 0, canvas.width, slicePx);

        const sliceImg = sliceCanvas.toDataURL('image/png', 1.0);
        const topY = pageNum === 0 ? firstContentY : margin.top + 4;
        pdf.addImage(sliceImg, 'PNG', margin.left, topY, imgW, sliceMm);

        // Page number
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(160, 160, 160);
        pdf.text(String(pageNum + 1), pageW / 2, pageH - 5, { align: 'center' });

        drawnMm += sliceMm;
        pageNum++;
      }

      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      pdf.save(`${slug}.pdf`);

    } catch (err) {
      console.error('PDF error:', err);
      window.print();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Download as PDF with images"
      className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)]
        text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/40
        font-mono text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading
        ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
        : <><Download size={12} /> PDF</>
      }
    </button>
  );
}
