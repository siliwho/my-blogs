'use client';
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface Props { title: string; author: string; date: string; slug: string; }

// ── Colours ────────────────────────────────────────────────────────────────
const C = {
  black:    [15,  15,  15]  as [number,number,number],
  h1:       [0,   0,   0]   as [number,number,number],
  h2:       [30,  30,  30]  as [number,number,number],
  h3:       [50,  50,  50]  as [number,number,number],
  body:     [40,  40,  40]  as [number,number,number],
  muted:    [100, 100, 100] as [number,number,number],
  codeFg:   [36,  41,  47]  as [number,number,number],
  codeBg:   [248, 249, 250] as [number,number,number],
  codeBdr:  [208, 215, 222] as [number,number,number],
  inlineFg: [160, 40,  40]  as [number,number,number],
  inlineBg: [240, 242, 245] as [number,number,number],
  bqLeft:   [130, 130, 130] as [number,number,number],
  bqText:   [90,  90,  90]  as [number,number,number],
  bqBg:     [249, 249, 249] as [number,number,number],
  rule:     [220, 220, 220] as [number,number,number],
  link:     [9,   105, 218] as [number,number,number],
  tableBdr: [200, 200, 200] as [number,number,number],
  tableHdr: [240, 240, 240] as [number,number,number],
  accent:   [9,   105, 218] as [number,number,number],
};

export function DownloadPDFButton({ title, author, date, slug }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const jsPDF  = (await import('jspdf')).default;
      const marked = (await import('marked')).marked;

      // ── Fetch the raw markdown from the API route ─────────────────────
      const res  = await fetch(`/api/post-content?slug=${encodeURIComponent(slug)}`);
      const { content: rawMd } = await res.json() as { content: string };

      // ── Parse markdown to a token list ────────────────────────────────
      const tokens = marked.lexer(rawMd);

      // ── PDF setup ──────────────────────────────────────────────────────
      const pdf  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const PW   = pdf.internal.pageSize.getWidth();   // 210
      const PH   = pdf.internal.pageSize.getHeight();  // 297
      const ML   = 18, MR = 18, MT = 28, MB = 18;
      const CW   = PW - ML - MR;                        // 174mm

      let y = MT;  // current Y cursor (mm)
      let pageNum = 1;

      // ── Helpers ────────────────────────────────────────────────────────
      const newPage = () => {
        // Footer on current page
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.muted);
        pdf.text(String(pageNum), PW / 2, PH - 8, { align: 'center' });
        pdf.text(author, ML, PH - 8);

        pdf.addPage();
        pageNum++;
        y = MT;

        // Continuation header
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7.5);
        pdf.setTextColor(...C.muted);
        const shortTitle = title.length > 70 ? title.slice(0, 67) + '…' : title;
        pdf.text(shortTitle, ML, 10);
        pdf.setDrawColor(...C.rule);
        pdf.setLineWidth(0.2);
        pdf.line(ML, 12, PW - MR, 12);
        y = 18;
      };

      const ensureSpace = (needed: number) => {
        if (y + needed > PH - MB) newPage();
      };

      // Write a line of plain text, auto-wrapping and paginating
      const writeText = (
        text: string,
        opts: {
          size?: number;
          bold?: boolean;
          italic?: boolean;
          color?: [number,number,number];
          indent?: number;
          lineH?: number;
          maxW?: number;
        } = {}
      ) => {
        const {
          size = 10.5, bold = false, italic = false,
          color = C.body, indent = 0, lineH = 5.8,
          maxW,
        } = opts;
        pdf.setFont('helvetica', bold ? (italic ? 'bolditalic' : 'bold') : (italic ? 'italic' : 'normal'));
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        const w   = (maxW ?? CW) - indent;
        const lines = pdf.splitTextToSize(text, w);
        lines.forEach((line: string) => {
          ensureSpace(lineH + 1);
          pdf.text(line, ML + indent, y);
          y += lineH;
        });
      };

      // Strip markdown inline syntax to plain text
      const stripInline = (txt: string) =>
        txt
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/`(.+?)`/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/~~(.+?)~~/g, '$1')
          .replace(/^#+\s/, '')
          .trim();

      // ── Page 1 header block ────────────────────────────────────────────
      // Accent bar
      pdf.setFillColor(...C.accent);
      pdf.rect(ML, 10, CW, 1.2, 'F');

      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.setTextColor(...C.h1);
      const titleLines = pdf.splitTextToSize(title, CW);
      pdf.text(titleLines, ML, 18);
      y = 18 + titleLines.length * 8;

      // Meta
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...C.muted);
      pdf.text(`${author}  ·  ${date}`, ML, y);
      y += 5;

      // Rule
      pdf.setDrawColor(...C.rule);
      pdf.setLineWidth(0.3);
      pdf.line(ML, y, PW - MR, y);
      y += 7;

      // ── Render tokens ──────────────────────────────────────────────────
      for (const token of tokens) {
        switch (token.type) {

          case 'heading': {
            const lvl = (token as { depth: number }).depth;
            const txt = stripInline((token as { text: string }).text);
            const sizes: Record<number,[number,number,number,number]> = {
              1: [15, 8, 2, 5],   // [fontSize, topGap, bottomGap, lineH]
              2: [13, 7, 1.5, 6],
              3: [11.5, 5, 1, 5.5],
              4: [10.5, 4, 1, 5],
            };
            const [fs, tg, bg, lh] = sizes[lvl] ?? sizes[3];
            y += tg;
            ensureSpace(lh + bg + (lvl <= 2 ? 1 : 0));
            const col = lvl === 1 ? C.h1 : lvl === 2 ? C.h2 : C.h3;
            writeText(txt, { size: fs, bold: true, color: col, lineH: lh });
            if (lvl <= 2) {
              pdf.setDrawColor(...C.rule);
              pdf.setLineWidth(lvl === 1 ? 0.5 : 0.25);
              pdf.line(ML, y, PW - MR, y);
              y += bg + 1;
            } else {
              y += bg;
            }
            break;
          }

          case 'paragraph': {
            const raw = (token as { text: string }).text;
            y += 1;
            writeText(stripInline(raw), { color: C.body, lineH: 5.8 });
            y += 2.5;
            break;
          }

          case 'code': {
            const code = (token as { text: string }).text;
            const lang = (token as { lang?: string }).lang ?? '';
            const lines = code.split('\n');
            const lineH = 4.8;
            const pad   = 4;
            const blockH = lines.length * lineH + pad * 2 + (lang ? 6 : 0);

            y += 2;
            ensureSpace(Math.min(blockH, 50));

            const boxY  = y;
            let   boxH  = 0;

            // Render lines (paginating mid-block if needed)
            if (lang) {
              // Language badge row
              pdf.setFillColor(...C.codeBg);
              pdf.setDrawColor(...C.codeBdr);
              pdf.setLineWidth(0.3);
              const badgeH = 6;
              pdf.roundedRect(ML, y, CW, badgeH, 1.5, 1.5, 'FD');
              pdf.setFont('courier', 'bold');
              pdf.setFontSize(7);
              pdf.setTextColor(...C.muted);
              pdf.text(lang.toUpperCase(), ML + pad, y + 4);
              y += badgeH;
              boxH += badgeH;
            }

            // Code body
            const codeStartY = y;
            const codeLines: string[] = [];
            lines.forEach(line => {
              // Wrap long lines
              const wrapped = pdf.splitTextToSize(line || ' ', CW - pad * 2 - 4);
              codeLines.push(...wrapped);
            });
            const totalCodeH = codeLines.length * lineH + pad * 2;

            pdf.setFillColor(...C.codeBg);
            pdf.setDrawColor(...C.codeBdr);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(ML, codeStartY, CW, totalCodeH, lang ? 0 : 1.5, lang ? 0 : 1.5, 'FD');

            if (lang) {
              // Left accent bar
              pdf.setFillColor(...C.accent);
              pdf.rect(ML, codeStartY, 2, totalCodeH, 'F');
            }

            pdf.setFont('courier', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...C.codeFg);

            let cy = codeStartY + pad + lineH * 0.6;
            codeLines.forEach((line, i) => {
              if (cy > PH - MB - lineH) {
                newPage();
                // Re-draw background for continuation
                pdf.setFillColor(...C.codeBg);
                pdf.setDrawColor(...C.codeBdr);
                pdf.setLineWidth(0.3);
                const remLines = codeLines.length - i;
                const remH = remLines * lineH + pad;
                pdf.rect(ML, y, CW, remH, 'FD');
                cy = y + lineH * 0.6;
                y  = cy;
              }
              pdf.text(line, ML + pad + (lang ? 2 : 0), cy);
              cy += lineH;
            });

            y = codeStartY + totalCodeH + 4;
            break;
          }

          case 'list': {
            const items = (token as { items: { text: string; task?: boolean; checked?: boolean }[] }).items;
            const ordered = (token as { ordered: boolean }).ordered;
            y += 1;
            items.forEach((item, idx) => {
              const txt = stripInline(item.text);
              ensureSpace(7);
              // Bullet or number
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10.5);
              pdf.setTextColor(...C.body);
              const bullet = ordered ? `${idx + 1}.` : '•';
              pdf.text(bullet, ML + 2, y);
              // Text
              const wrapped = pdf.splitTextToSize(txt, CW - 12);
              wrapped.forEach((line: string, li: number) => {
                if (li > 0) ensureSpace(5.5);
                pdf.text(line, ML + 10, y);
                y += 5.5;
              });
            });
            y += 2;
            break;
          }

          case 'blockquote': {
            const txt = stripInline(
              (token as { text?: string; tokens?: { text?: string }[] }).text ??
              (token as { tokens?: { text?: string }[] }).tokens?.map(t => t.text ?? '').join(' ') ?? ''
            );
            const bqLines = pdf.splitTextToSize(txt, CW - 14);
            const bqH = bqLines.length * 5.5 + 8;
            y += 2;
            ensureSpace(bqH);
            pdf.setFillColor(...C.bqBg);
            pdf.setDrawColor(...C.bqBg);
            pdf.rect(ML, y, CW, bqH, 'FD');
            pdf.setFillColor(...C.bqLeft);
            pdf.rect(ML, y, 2.5, bqH, 'F');
            pdf.setFont('helvetica', 'italic');
            pdf.setFontSize(10);
            pdf.setTextColor(...C.bqText);
            let by = y + 5.5;
            bqLines.forEach((line: string) => {
              pdf.text(line, ML + 8, by);
              by += 5.5;
            });
            y += bqH + 3;
            break;
          }

          case 'hr': {
            y += 3;
            ensureSpace(4);
            pdf.setDrawColor(...C.rule);
            pdf.setLineWidth(0.3);
            pdf.line(ML, y, PW - MR, y);
            y += 5;
            break;
          }

          case 'table': {
            const t = token as {
              header: { text: string }[];
              rows: { text: string }[][];
            };
            const cols  = t.header.length;
            const colW  = CW / cols;
            const rowH  = 7;
            const headH = 7;

            y += 2;
            ensureSpace(headH + rowH + 2);

            // Header
            pdf.setFillColor(...C.tableHdr);
            pdf.setDrawColor(...C.tableBdr);
            pdf.setLineWidth(0.25);
            pdf.rect(ML, y, CW, headH, 'FD');
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(9);
            pdf.setTextColor(...C.codeFg);
            t.header.forEach((cell, ci) => {
              pdf.text(stripInline(cell.text), ML + ci * colW + 3, y + 4.8, { maxWidth: colW - 4 });
            });
            y += headH;

            // Rows
            t.rows.forEach((row, ri) => {
              ensureSpace(rowH + 1);
              const bg: [number,number,number] = ri % 2 === 0 ? [255,255,255] : [248,249,250];
              pdf.setFillColor(...bg);
              pdf.setDrawColor(...C.tableBdr);
              pdf.rect(ML, y, CW, rowH, 'FD');
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(9);
              pdf.setTextColor(...C.body);
              row.forEach((cell, ci) => {
                pdf.text(stripInline(cell.text), ML + ci * colW + 3, y + 4.8, { maxWidth: colW - 4 });
              });
              y += rowH;
            });
            y += 4;
            break;
          }

          case 'space': {
            y += 2;
            break;
          }

          default:
            break;
        }
      }

      // Final page footer
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...C.muted);
      pdf.text(String(pageNum), PW / 2, PH - 8, { align: 'center' });
      pdf.text(author, ML, PH - 8);

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
      title="Download as PDF"
      className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
        border-[var(--color-border)] text-[var(--color-muted)]
        hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/40
        font-mono text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading
        ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
        : <><Download size={12} /> PDF</>
      }
    </button>
  );
}