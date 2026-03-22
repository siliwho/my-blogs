'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Github, Star, GitFork, GitCommitHorizontal,
  GitBranch, AlertCircle, RefreshCw, ExternalLink, Clock
} from 'lucide-react';
import Link from 'next/link';
import { PINNED_REPOS, SITE_CONFIG } from '@/lib/config';

// ── Types ────────────────────────────────────────────────────────────────────
interface RepoData {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  defaultBranch: string;
  updatedAt: string;
  commits: CommitData[];
  loading: boolean;
  error: boolean;
}

interface CommitData {
  sha: string;
  message: string;
  date: string;
  url: string;
}

interface ContribDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

// ── Constants ────────────────────────────────────────────────────────────────
const LANG_COLORS: Record<string, string> = {
  C: '#555599', 'C++': '#f34b7d', Rust: '#dea584',
  Python: '#3572A5', Assembly: '#6E4C13', TypeScript: '#2b7489',
  Go: '#00ADD8', Zig: '#ec915c', Makefile: '#427819',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// Inline background colors per level.
// Tailwind opacity modifiers like bg-[var(--color-accent)]/20 don't work with CSS vars,
// so we read the accent hex at runtime and build rgba values ourselves.
function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0]+clean[0], 16);
    const g = parseInt(clean[1]+clean[1], 16);
    const b = parseInt(clean[2]+clean[2], 16);
    return [r, g, b];
  }
  if (clean.length === 6) {
    return [parseInt(clean.slice(0,2),16), parseInt(clean.slice(2,4),16), parseInt(clean.slice(4,6),16)];
  }
  return null;
}

function useAccentRgb(): string {
  const [rgb, setRgb] = useState<string>('0,255,157'); // default dark accent
  useEffect(() => {
    const val = getComputedStyle(document.documentElement)
      .getPropertyValue('--color-accent').trim();
    const parsed = hexToRgb(val);
    if (parsed) setRgb(parsed.join(','));
  }, []);
  return rgb;
}

const LEVEL_OPACITIES = [0, 0.18, 0.42, 0.72, 1];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 30)  return `${days}d ago`;
  return `${Math.floor(days/30)}mo ago`;
}

function buildHeatmap(commits: CommitData[]): ContribDay[] {
  const counts: Record<string, number> = {};
  commits.forEach(c => {
    const day = c.date.split('T')[0];
    counts[day] = (counts[day] ?? 0) + 1;
  });

  const days: ContribDay[] = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const count = counts[key] ?? 0;
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : count <= 9 ? 3 : 4;
    days.push({ date: key, count, level: level as ContribDay['level'] });
  }
  return days;
}

function HeatmapGrid({ days }: { days: ContribDay[] }) {
  const [hovered, setHovered] = useState<ContribDay | null>(null);
  const accentRgb = useAccentRgb();

  function cellStyle(level: number): React.CSSProperties {
    return { backgroundColor: `rgba(${accentRgb},${LEVEL_OPACITIES[level]})` };
  }

  const weeks: ContribDay[][] = [];
  let week: ContribDay[] = [];
  const firstDow = new Date(days[0].date).getDay();
  for (let i = 0; i < firstDow; i++) week.push({ date: '', count: 0, level: 0 });
  days.forEach(d => {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  });
  if (week.length) weeks.push(week);

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, wi) => {
    const first = w.find(d => d.date);
    if (!first) return;
    const m = new Date(first.date).getMonth();
    if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], col: wi }); lastMonth = m; }
  });

  const total = days.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-mono text-xs text-[var(--color-muted)]">
          {hovered?.date
            ? <><span className="text-[var(--color-accent)]">{hovered.count}</span> commit{hovered.count !== 1 ? 's' : ''} on {hovered.date}</>
            : <><span className="text-[var(--color-accent)]">{total}</span> commits across selected repos (past year)</>
          }
        </p>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-[var(--color-muted)]">Less</span>
          {[0,1,2,3,4].map(l => (
            <div key={l} className="w-2.5 h-2.5 rounded-sm border border-white/5"
              style={cellStyle(l)} />
          ))}
          <span className="font-mono text-[10px] text-[var(--color-muted)]">More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-block min-w-max">
          <div className="flex mb-1 ml-8">
            {weeks.map((_, wi) => {
              const lbl = monthLabels.find(m => m.col === wi);
              return (
                <div key={wi} className="w-[14px] shrink-0">
                  {lbl && <span className="font-mono text-[9px] text-[var(--color-muted)]">{lbl.label}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex gap-[2px]">
            <div className="flex flex-col gap-[2px] mr-1 w-7">
              {DAYS.map((d, i) => (
                <div key={d} className="h-[12px] flex items-center">
                  {i % 2 === 1 && <span className="font-mono text-[9px] text-[var(--color-muted)]">{d}</span>}
                </div>
              ))}
            </div>
            {weeks.map((wk, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {wk.map((day, di) => (
                  <div
                    key={`${wi}-${di}`}
                    onMouseEnter={() => day.date ? setHovered(day) : null}
                    onMouseLeave={() => setHovered(null)}
                    title={day.date ? `${day.count} commits on ${day.date}` : ''}
                    className={`w-[12px] h-[12px] rounded-[2px] transition-transform ${day.date ? 'cursor-pointer hover:scale-125' : 'opacity-0'}`}
                    style={day.date ? cellStyle(day.level) : undefined}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GitHubActivity({ username }: { username: string }) {
  const [repos, setRepos]     = useState<RepoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [allCommits, setAllCommits] = useState<CommitData[]>([]);
  const [activeRepo, setActiveRepo] = useState<string | null>(null);

  const isMock = !username || username === 'yourusername';

  const fetchRepoData = useCallback(async (fullName: string): Promise<RepoData> => {
    const base: Omit<RepoData,'commits'|'loading'|'error'> = {
      name: fullName.split('/')[1] ?? fullName,
      fullName,
      description: '',
      url: `https://github.com/${fullName}`,
      stars: 0, forks: 0,
      language: 'C',
      defaultBranch: 'main',
      updatedAt: new Date().toISOString(),
    };

    if (isMock) {
      // Deterministic fake data when username not configured
      const fakeCommits: CommitData[] = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i * 7 - Math.floor(Math.random()*5));
        return {
          sha: Math.random().toString(16).slice(2, 9),
          message: ['feat: add DMA support','fix: stack overflow','docs: update README',
            'refactor: clean up ISR','chore: add Makefile','test: unit tests for scheduler'][i % 6],
          date: d.toISOString(),
          url: '#',
        };
      });
      const fakeStars = [47,31,89,22,18,14];
      const idx = PINNED_REPOS.indexOf(fullName);
      return {
        ...base,
        description: 'Example project — add your GitHub username in lib/config.ts for live data.',
        stars: fakeStars[idx] ?? 10,
        forks: Math.floor((fakeStars[idx] ?? 10) / 6),
        commits: fakeCommits,
        loading: false, error: false,
      };
    }

    try {
      const [repoRes, commitsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${fullName}`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        }),
        fetch(`https://api.github.com/repos/${fullName}/commits?per_page=50`, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        }),
      ]);

      const repoJson = repoRes.ok ? await repoRes.json() : null;
      const commitsJson: unknown[] = commitsRes.ok ? await commitsRes.json() : [];

      const commits: CommitData[] = Array.isArray(commitsJson)
        ? commitsJson.map((c: unknown) => {
            const commit = c as { sha: string; commit: { message: string; author: { date: string } }; html_url: string };
            return {
              sha: commit.sha?.slice(0, 7),
              message: commit.commit?.message?.split('\n')[0] ?? '',
              date: commit.commit?.author?.date ?? new Date().toISOString(),
              url: commit.html_url ?? '#',
            };
          })
        : [];

      return {
        ...base,
        description: repoJson?.description ?? '',
        stars: repoJson?.stargazers_count ?? 0,
        forks: repoJson?.forks_count ?? 0,
        language: repoJson?.language ?? 'C',
        defaultBranch: repoJson?.default_branch ?? 'main',
        updatedAt: repoJson?.updated_at ?? new Date().toISOString(),
        commits,
        loading: false,
        error: false,
      };
    } catch {
      return { ...base, commits: [], loading: false, error: true };
    }
  }, [isMock]);

  useEffect(() => {
    setLoading(true);
    Promise.all(PINNED_REPOS.map(fetchRepoData))
      .then(results => {
        setRepos(results);
        setAllCommits(results.flatMap(r => r.commits).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ));
        setLoading(false);
      })
      .catch(() => { setError('Failed to load repository data.'); setLoading(false); });
  }, [fetchRepoData]);

  const heatmapDays = buildHeatmap(allCommits);
  const displayedRepo = activeRepo ? repos.find(r => r.fullName === activeRepo) : null;

  const totalStars   = repos.reduce((s, r) => s + r.stars, 0);
  const totalCommits = allCommits.length;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <AlertCircle size={32} className="text-red-400" />
        <p className="font-mono text-sm text-[var(--color-muted)]">{error}</p>
        <button onClick={() => window.location.reload()}
          className="flex items-center gap-2 font-mono text-xs text-[var(--color-accent)] hover:underline">
          <RefreshCw size={12} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Tracked repos',  value: String(repos.length) },
          { label: 'Commits (fetched)', value: totalCommits.toLocaleString() },
          { label: 'Total stars',    value: totalStars.toLocaleString() },
          { label: 'Languages', value: Array.from(new Set(repos.map(r => r.language).filter(Boolean))).slice(0,3).join(' · ') || 'C · Rust' },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
            <p className="font-mono text-[10px] text-[var(--color-muted)] mb-1">{label}</p>
            <p className="font-display text-xl font-bold text-[var(--color-accent)] truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Heatmap ── */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-center gap-2 mb-5">
          <GitBranch size={16} className="text-[var(--color-accent)]" />
          <h2 className="font-display font-semibold text-[var(--color-text)]">Commit Activity</h2>
          {isMock && (
            <span className="ml-auto font-mono text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded">
              demo data — set githubUsername in config.ts
            </span>
          )}
        </div>
        <HeatmapGrid days={heatmapDays} />
      </div>

      {/* ── Repo cards ── */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Github size={16} className="text-[var(--color-accent)]" />
          <h2 className="font-display text-xl font-semibold text-[var(--color-text)]">Repositories</h2>
          <span className="font-mono text-xs text-[var(--color-muted)] ml-1">
            — click to see recent commits
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map(repo => (
            <button
              key={repo.fullName}
              onClick={() => setActiveRepo(activeRepo === repo.fullName ? null : repo.fullName)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 ${
                activeRepo === repo.fullName
                  ? 'border-[var(--color-accent)]/60 bg-[var(--color-accent-dim)]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/30'
              }`}
            >
              {/* Repo header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Github size={13} className="text-[var(--color-muted)] shrink-0" />
                  <span className="font-mono text-sm font-semibold text-[var(--color-accent)] truncate">
                    {repo.name}
                  </span>
                </div>
                <Link
                  href={repo.url} target="_blank"
                  onClick={e => e.stopPropagation()}
                  className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors shrink-0 ml-2"
                >
                  <ExternalLink size={12} />
                </Link>
              </div>

              {repo.error ? (
                <p className="text-xs text-red-400/70 mb-3">Failed to load — repo may be private or not exist.</p>
              ) : (
                <p className="text-xs text-[var(--color-muted)] mb-3 line-clamp-2 leading-relaxed">
                  {repo.description || 'No description.'}
                </p>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-3 flex-wrap">
                {repo.language && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: LANG_COLORS[repo.language] ?? '#888' }} />
                    <span className="font-mono text-[10px] text-[var(--color-muted)]">{repo.language}</span>
                  </div>
                )}
                <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-muted)]">
                  <Star size={10} /> {repo.stars}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-muted)]">
                  <GitFork size={10} /> {repo.forks}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px] text-[var(--color-muted)] ml-auto">
                  <Clock size={10} /> {relativeTime(repo.updatedAt)}
                </span>
              </div>

              {/* Commit count badge */}
              {repo.commits.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                  <span className="font-mono text-[10px] text-[var(--color-muted)]">
                    <span className="text-[var(--color-accent)]">{repo.commits.length}</span> recent commits
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Commit log for selected repo ── */}
      {displayedRepo && (
        <div className="rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-surface)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <GitCommitHorizontal size={15} className="text-[var(--color-accent)]" />
            <span className="font-mono text-sm font-semibold text-[var(--color-accent)]">
              {displayedRepo.name}
            </span>
            <span className="font-mono text-xs text-[var(--color-muted)]">
              — {displayedRepo.commits.length} commits
            </span>
            <Link href={displayedRepo.url + '/commits/' + displayedRepo.defaultBranch}
              target="_blank"
              className="ml-auto flex items-center gap-1 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
              View on GitHub <ExternalLink size={11} />
            </Link>
          </div>

          {/* Commit list */}
          <div className="divide-y divide-[var(--color-border)] max-h-80 overflow-y-auto">
            {displayedRepo.commits.length === 0 ? (
              <p className="px-5 py-6 font-mono text-xs text-[var(--color-muted)] text-center">
                No commits fetched.
              </p>
            ) : (
              displayedRepo.commits.map(commit => (
                <Link
                  key={commit.sha}
                  href={commit.url === '#' ? displayedRepo.url : commit.url}
                  target="_blank"
                  className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--color-border)] transition-colors group"
                >
                  <GitCommitHorizontal size={13} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                      {commit.message}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--color-muted)] mt-0.5">
                      {commit.sha} · {relativeTime(commit.date)}
                    </p>
                  </div>
                  <ExternalLink size={11} className="text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Recent commits across all repos ── */}
      {!displayedRepo && allCommits.length > 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <GitCommitHorizontal size={15} className="text-[var(--color-accent)]" />
            <span className="font-mono text-sm font-semibold text-[var(--color-text)]">
              Recent commits — all repos
            </span>
          </div>
          <div className="divide-y divide-[var(--color-border)] max-h-72 overflow-y-auto">
            {allCommits.slice(0, 20).map((commit, i) => {
              const repo = repos.find(r => r.commits.some(c => c.sha === commit.sha));
              return (
                <Link key={`${commit.sha}-${i}`}
                  href={commit.url === '#' ? (repo?.url ?? '#') : commit.url}
                  target="_blank"
                  className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--color-border)] transition-colors group"
                >
                  <GitCommitHorizontal size={13} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors truncate">
                      {commit.message}
                    </p>
                    <p className="font-mono text-[10px] text-[var(--color-muted)] mt-0.5">
                      {commit.sha}
                      {repo && <> · <span className="text-[var(--color-accent)]/70">{repo.name}</span></>}
                      {' · '}{relativeTime(commit.date)}
                    </p>
                  </div>
                  <ExternalLink size={11} className="text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
