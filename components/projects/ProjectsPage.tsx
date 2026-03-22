import Link from 'next/link';
import { Github, ExternalLink, ChevronRight } from 'lucide-react';
import type { Project } from '@/lib/projects';

interface ProjectsPageProps {
  category: string;
  icon: string;
  title: string;
  description: string;
  subtitle: string;
  projects: Project[];
}

export function ProjectsPage({ category, icon, title, description, subtitle, projects }: ProjectsPageProps) {
  const featured = projects.filter(p => p.featured);
  const rest = projects.filter(p => !p.featured);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/projects/embedded" className="font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
            projects
          </Link>
          <ChevronRight size={12} className="text-[var(--color-muted)]" />
          <span className="font-mono text-xs text-[var(--color-accent)]">{category}</span>
        </div>
        <p className="font-mono text-xs text-[var(--color-accent)] mb-2">{icon} {subtitle}</p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-text)] mb-3">{title}</h1>
        <p className="text-[var(--color-muted)] max-w-xl">{description}</p>
        <p className="font-mono text-xs text-[var(--color-muted)] mt-3">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Category nav */}
      <div className="flex gap-3 mb-12">
        {[
          { href: '/projects/embedded', label: 'Embedded' },
          { href: '/projects/firmware', label: 'Firmware' },
          { href: '/projects/kernel', label: 'Kernel / OS' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className={`font-mono text-xs px-3 py-1.5 rounded-md border transition-colors ${
              l.href.includes(category.toLowerCase())
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)] text-[var(--color-accent)]'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]'
            }`}>
            {l.label}
          </Link>
        ))}
      </div>

      {/* Featured */}
      {featured.length > 0 && (
        <div className="mb-12">
          <h2 className="font-display text-lg font-semibold text-[var(--color-text)] mb-5">Featured</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            {featured.map(project => (
              <ProjectDetailCard key={project.id} project={project} featured />
            ))}
          </div>
        </div>
      )}

      {/* All */}
      {rest.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--color-text)] mb-5">
            {featured.length > 0 ? 'More Projects' : 'All Projects'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map(project => (
              <ProjectDetailCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="text-center py-20">
          <p className="font-mono text-[var(--color-muted)]">// no projects yet — coming soon</p>
        </div>
      )}
    </div>
  );
}

function ProjectDetailCard({ project, featured }: { project: Project; featured?: boolean }) {
  return (
    <div className={`flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:border-[var(--color-accent)]/40 transition-all duration-200 ${featured ? '' : 'p-5'}`}>
      {featured ? (
        <>
          {/* Featured card with extra detail */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                project.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' :
                project.status === 'completed' ? 'text-blue-400 bg-blue-400/10' :
                'text-yellow-400 bg-yellow-400/10'
              }`}>
                {project.status}
              </span>
              <div className="flex gap-2">
                {project.githubUrl && (
                  <Link href={project.githubUrl} target="_blank"
                    className="flex items-center gap-1 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
                    <Github size={13} /> GitHub
                  </Link>
                )}
                {project.demoUrl && (
                  <Link href={project.demoUrl} target="_blank"
                    className="flex items-center gap-1 font-mono text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
                    <ExternalLink size={13} /> Demo
                  </Link>
                )}
              </div>
            </div>

            <h3 className="font-display text-xl font-bold text-[var(--color-text)] mb-2">{project.title}</h3>
            <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-4">
              {project.longDescription || project.description}
            </p>

            {project.highlights && (
              <ul className="space-y-1.5 mb-5">
                {project.highlights.map(h => (
                  <li key={h} className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                    <span className="text-[var(--color-accent)] mt-0.5 shrink-0">›</span>
                    {h}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap gap-1.5">
              {project.techStack.map(t => (
                <span key={t} className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-muted)]">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
              project.status === 'active' ? 'text-emerald-400 bg-emerald-400/10' :
              project.status === 'completed' ? 'text-blue-400 bg-blue-400/10' :
              'text-yellow-400 bg-yellow-400/10'
            }`}>
              {project.status}
            </span>
            <div className="flex gap-2">
              {project.githubUrl && (
                <Link href={project.githubUrl} target="_blank"
                  className="text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
                  <Github size={14} />
                </Link>
              )}
            </div>
          </div>
          <h3 className="font-display font-semibold text-[var(--color-text)] mb-2">{project.title}</h3>
          <p className="text-sm text-[var(--color-muted)] leading-relaxed mb-4 flex-1">{project.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {project.techStack.slice(0, 4).map(t => (
              <span key={t} className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-muted)]">
                {t}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
