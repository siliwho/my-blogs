'use client';
import { useTheme } from './ThemeProvider';

const THEMES = [
  { id: 'dark',     label: 'GH',  title: 'GitHub Dark' },
  { id: 'terminal', label: 'TRM', title: 'Terminal' },
  { id: 'steel',    label: 'STL', title: 'Steel' },
  { id: 'obsidian', label: 'OBS', title: 'Obsidian' },
  { id: 'light',    label: 'LGT', title: 'Light' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {THEMES.map(({ id, label, title }) => (
        <button
          key={id}
          onClick={() => setTheme(id)}
          title={title}
          className={`px-2 py-1 rounded-md transition-all duration-150 font-mono text-[10px] font-medium tracking-wide ${
            theme === id
              ? 'bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
