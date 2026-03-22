import Link from 'next/link';
import { Github, Linkedin, Mail, Cpu } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Cpu size={16} className="text-[var(--color-accent)]" />
            <span className="font-mono text-sm text-[var(--color-muted)]">
              {SITE_CONFIG.author} — built with Next.js + Tailwind
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href={SITE_CONFIG.github} target="_blank" rel="noreferrer"
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
              <Github size={18} />
            </Link>
            <Link href={SITE_CONFIG.linkedin} target="_blank" rel="noreferrer"
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
              <Linkedin size={18} />
            </Link>
            <Link href={`mailto:${SITE_CONFIG.email}`}
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
              <Mail size={18} />
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="font-mono text-xs text-[var(--color-muted)]">
            © {new Date().getFullYear()} {SITE_CONFIG.author}. Open source on{' '}
            <Link href={SITE_CONFIG.github} className="text-[var(--color-accent)] hover:underline">GitHub</Link>.
          </p>
          <div className="flex items-center gap-4">
            {[
              { href: '/blog', label: 'Blog' },
              { href: '/activity', label: 'Activity' },
              { href: '/pdfs', label: 'PDFs' },
              { href: '/about', label: 'About' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
