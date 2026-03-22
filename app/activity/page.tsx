import type { Metadata } from 'next';
import { GitHubActivity } from './GitHubActivity';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'GitHub Activity',
  description: 'GitHub contribution heatmap and repository activity.',
};

export default function ActivityPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="mb-10">
        <p className="font-mono text-xs text-[var(--color-accent)] mb-2">// open source activity</p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-text)] mb-3">GitHub Activity</h1>
        <p className="text-[var(--color-muted)] max-w-xl">
          Contribution heatmap and recent repository activity. Every green square is a commit, issue, or PR.
        </p>
      </div>
      <GitHubActivity username={SITE_CONFIG.githubUsername} />
    </div>
  );
}
