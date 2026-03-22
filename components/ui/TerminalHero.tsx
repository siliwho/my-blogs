'use client';
import { useEffect, useState } from 'react';
import { SITE_CONFIG, PINNED_REPOS } from '@/lib/config';

interface CommitLine {
  sha: string;
  message: string;
  repo: string;
}

const STATIC_LINES = [
  { prefix: '$ ', text: 'whoami', delay: 400 },
  { prefix: '> ', text: 'Anant Gyan Singhal — BTech Electronics', delay: 900, accent: true },
  { prefix: '$ ', text: 'cat skills.txt', delay: 1600 },
  { prefix: '> ', text: 'Embedded · Firmware · Linux Kernel · C/Rust/ASM', delay: 2100, accent: true },
  { prefix: '$ ', text: 'git log --all --oneline -5', delay: 2900 },
];

type Line = {
  prefix: string;
  text: string;
  delay: number;
  accent?: boolean;
  cursor?: boolean;
  dim?: boolean;
};

export function TerminalHero() {
  const [lines, setLines] = useState<Line[]>(STATIC_LINES);
  const [visibleCount, setVisibleCount] = useState(0);
  const [fetchDone, setFetchDone] = useState(false);

  // Fetch real commits from GitHub API
  useEffect(() => {
    async function fetchCommits() {
      const username = SITE_CONFIG.githubUsername;
      if (!username || username === 'yourusername') {
        // Fallback placeholder commits
        return [
          { sha: 'a4f91c3', message: 'feat: add DMA ring buffer driver', repo: 'rtos-scheduler' },
          { sha: 'b2e80d1', message: 'fix: priority inversion in semaphore', repo: 'rtos-scheduler' },
          { sha: '9c1d22f', message: 'feat: USB DFU class compliance', repo: 'usb-bootloader' },
          { sha: 'c3a8b74', message: 'docs: update kernel module README', repo: 'linux-modules' },
          { sha: 'd1e99f2', message: 'fix: PendSV context switch on M0', repo: 'mini-kernel' },
        ] as CommitLine[];
      }

      const results: CommitLine[] = [];
      // Fetch recent events for the user (public API, no token needed)
      try {
        const res = await fetch(
          `https://api.github.com/users/${username}/events/public?per_page=30`,
          { headers: { Accept: 'application/vnd.github.v3+json' }, next: { revalidate: 300 } }
        );
        if (!res.ok) return results;
        const events = await res.json();
        for (const event of events) {
          if (event.type !== 'PushEvent') continue;
          const repoName = event.repo?.name ?? '';
          // Only show commits from pinned repos (if configured)
          const isIncluded = PINNED_REPOS.length === 0 ||
            PINNED_REPOS.some(p => repoName === p || repoName.endsWith('/' + p.split('/')[1]));
          if (!isIncluded) continue;
          for (const commit of (event.payload?.commits ?? [])) {
            const shortSha = commit.sha?.slice(0, 7) ?? '0000000';
            const msg = commit.message?.split('\n')[0] ?? '';
            const shortRepo = repoName.split('/')[1] ?? repoName;
            results.push({ sha: shortSha, message: msg, repo: shortRepo });
            if (results.length >= 5) break;
          }
          if (results.length >= 5) break;
        }
      } catch {
        // Network error — fall through to empty array
      }
      return results;
    }

    fetchCommits().then((commits) => {
      const commitLines: Line[] = commits.map((c, i) => ({
        prefix: '> ',
        text: `${c.sha} [${c.repo}] ${c.message}`,
        delay: 3400 + i * 300,
        accent: false,
        dim: true,
      }));

      const cursorDelay = commitLines.length > 0
        ? (commitLines[commitLines.length - 1].delay + 400)
        : 3800;

      setLines([
        ...STATIC_LINES,
        ...commitLines,
        { prefix: '$ ', text: '', delay: cursorDelay, cursor: true },
      ]);
      setFetchDone(true);
    });
  }, []);

  // Animate lines appearing one by one
  useEffect(() => {
    if (!fetchDone) return;
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleCount(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [lines, fetchDone]);

  // Start static animation immediately (before fetch completes)
  useEffect(() => {
    const timers = STATIC_LINES.map((line, i) =>
      setTimeout(() => setVisibleCount(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 font-mono text-xs text-[var(--color-muted)]">
          anant@devbox ~ zsh
        </span>
      </div>

      {/* Terminal body */}
      <div className="p-5 font-mono text-xs sm:text-sm leading-relaxed min-h-[300px] overflow-hidden">
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className="flex items-start gap-1 animate-fade-in">
            <span className="text-[var(--color-muted)] shrink-0">{line.prefix}</span>
            <span
              className={
                line.accent
                  ? 'text-[var(--color-accent)]'
                  : line.dim
                  ? 'text-[var(--color-muted)] text-[10px] sm:text-xs truncate'
                  : 'text-[var(--color-text)]'
              }
            >
              {line.text}
              {line.cursor && i === visibleCount - 1 && (
                <span className="inline-block w-2 h-4 bg-[var(--color-accent)] ml-0.5 animate-blink align-middle" />
              )}
            </span>
          </div>
        ))}

        {/* Loading spinner while fetch is in flight and static lines are done */}
        {!fetchDone && visibleCount >= STATIC_LINES.length && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[var(--color-muted)]">&gt; </span>
            <span className="text-[var(--color-muted)] text-xs animate-pulse">
              fetching recent commits...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
