'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef } from 'react';
import { ChevronDown, Menu, X, Cpu } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NAV_LINKS } from '@/lib/config';
import clsx from 'clsx';

type NavChild    = { href: string; label: string };
type NavLeaf     = { href: string; label: string };
type NavDropdown = { label: string; href?: string; children: NavChild[] };
type NavLink     = NavLeaf | NavDropdown;

function isDropdown(link: NavLink): link is NavDropdown {
  return 'children' in link;
}

export function Navbar() {
  const pathname   = usePathname();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  function openDropdown(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setDropdownOpen(label);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setDropdownOpen(null), 120);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-[var(--color-accent-dim)] border border-[var(--color-accent)]/30 flex items-center justify-center">
            <Cpu size={14} className="text-[var(--color-accent)]" />
          </div>
          <span className="font-mono text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">
            siliwho
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-1">
          {(NAV_LINKS as NavLink[]).map((link) => {
            if (isDropdown(link)) {
              const anyActive  = link.children.some(c => isActive(c.href));
              const firstHref  = link.href ?? link.children[0]?.href ?? '/';
              const isOpen     = dropdownOpen === link.label;

              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => openDropdown(link.label)}
                  onMouseLeave={scheduleClose}
                >
                  {/* Label → navigates to first child page */}
                  <div className="flex items-center">
                    <Link
                      href={firstHref}
                      className={clsx(
                        'px-3 py-1.5 rounded-l-md text-sm font-medium transition-colors',
                        anyActive
                          ? 'text-[var(--color-accent)]'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      )}
                    >
                      {link.label}
                    </Link>

                    {/* Chevron — only this toggles the dropdown */}
                    <button
                      onClick={() => setDropdownOpen(isOpen ? null : link.label)}
                      className={clsx(
                        'px-1 py-1.5 rounded-r-md transition-colors',
                        anyActive
                          ? 'text-[var(--color-accent)]'
                          : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                      )}
                      aria-label="Toggle projects menu"
                    >
                      <ChevronDown
                        size={12}
                        className={clsx('transition-transform duration-150', isOpen && 'rotate-180')}
                      />
                    </button>
                  </div>

                  {/* Dropdown panel */}
                  {isOpen && (
                    <div
                      className="absolute top-full left-0 mt-1 w-52 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl py-1 animate-fade-in"
                      onMouseEnter={() => openDropdown(link.label)}
                      onMouseLeave={scheduleClose}
                    >
                      {link.children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setDropdownOpen(null)}
                          className={clsx(
                            'block px-4 py-2 text-sm transition-colors',
                            isActive(child.href)
                              ? 'text-[var(--color-accent)] bg-[var(--color-accent-dim)]'
                              : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive(link.href) && link.href !== '/'
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* ── Right: theme + mobile toggle ── */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            className="md:hidden text-[var(--color-muted)] hover:text-[var(--color-text)]"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] animate-slide-up">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-1">
            {(NAV_LINKS as NavLink[]).map((link) => {
              if (isDropdown(link)) {
                return (
                  <div key={link.label}>
                    <p className="px-3 py-1.5 text-xs font-mono text-[var(--color-muted)] uppercase tracking-wider">
                      {link.label}
                    </p>
                    {link.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className={clsx(
                          'block px-6 py-2 text-sm transition-colors',
                          isActive(child.href)
                            ? 'text-[var(--color-accent)]'
                            : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    'px-3 py-2 rounded-md text-sm',
                    isActive(link.href) && link.href !== '/'
                      ? 'text-[var(--color-accent)]'
                      : 'text-[var(--color-muted)]'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}