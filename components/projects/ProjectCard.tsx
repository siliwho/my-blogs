import Link from 'next/link';
import { Github, ExternalLink, ArrowUpRight } from 'lucide-react';
import type { Project } from '@/lib/projects';

const statusColors = {
  active: 'text-emerald-400 bg-emerald-400/10',
  completed: 'text-blue-400 bg-blue-400/10',
  wip: 'text-yellow-400 bg-yellow-400/10',
};

const statusLabels = { active: 'Active', completed: 'Completed', wip: 'WIP' };

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group flex flex-col p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-all duration-200 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
        <div className="flex items-center gap-2">
          {project.githubUrl && (
            <Link href={project.githubUrl} target="_blank"
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
              <Github size={15} />
            </Link>
          )}
          {project.demoUrl && (
            <Link href={project.demoUrl} target="_blank"
              className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
              <ExternalLink size={15} />
            </Link>
          )}
        </div>
      </div>

      <h3 className="font-display font-semibold text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors mb-2">
        {project.title}
      </h3>

      <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-4 flex-1 line-clamp-3">
        {project.description}
      </p>

      {/* Tech stack */}
      <div className="flex flex-wrap gap-1.5 mt-auto">
        {project.techStack.slice(0, 4).map(tech => (
          <span key={tech}
            className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-muted)]">
            {tech}
          </span>
        ))}
        {project.techStack.length > 4 && (
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-muted)]">
            +{project.techStack.length - 4}
          </span>
        )}
      </div>
    </div>
  );
}
