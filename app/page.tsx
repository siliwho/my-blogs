import Link from 'next/link';
import { Github, Linkedin, ArrowRight, Cpu, Radio, Terminal, GitBranch } from 'lucide-react';
import { getAllPosts } from '@/lib/blog';
import { getFeaturedProjects } from '@/lib/projects';
import { SITE_CONFIG } from '@/lib/config';
import { BlogCard } from '@/components/blog/BlogCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { TerminalHero } from '@/components/ui/TerminalHero';

export default function HomePage() {
  const recentPosts = getAllPosts().slice(0, 3);
  const featuredProjects = getFeaturedProjects();

  const skills = [
    { icon: Cpu, label: 'Embedded Systems', desc: 'ARM Cortex-M, STM32, AVR' },
    { icon: Radio, label: 'Firmware Dev', desc: 'Bare-metal, RTOS, Drivers' },
    { icon: Terminal, label: 'Kernel / OS', desc: 'Linux LKM, x86, RISC-V' },
    { icon: GitBranch, label: 'Systems Programming', desc: 'C, Rust, Assembly' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* ── Hero ── */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-dim)] mb-6 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              <span className="font-mono text-xs text-[var(--color-accent)]">Available for internships</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[var(--color-text)] mb-4 animate-slide-up stagger-1">
              Hey, I&apos;m{' '}
              <span className="text-[var(--color-accent)] [data-theme='terminal']:animate-glow">
                Anant
              </span>
            </h1>

            <p className="font-mono text-sm text-[var(--color-accent)] mb-4 animate-slide-up stagger-2">
              Electronics Student · Embedded Systems · Firmware · Kernel Dev
            </p>

            <p className="text-[var(--color-muted)] text-base leading-relaxed mb-8 max-w-md animate-slide-up stagger-3">
              I write firmware for microcontrollers, build toy operating systems, and document
              everything I learn along the way. This is my lab and journal.
            </p>

            <div className="flex flex-wrap items-center gap-3 animate-slide-up stagger-4">
              <Link href="/projects/embedded"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-semibold hover:opacity-90 transition-opacity">
                View Projects <ArrowRight size={14} />
              </Link>
              <Link href="/blog"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[var(--color-border)] text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-muted)] transition-colors">
                Read Blog
              </Link>
              <Link href={SITE_CONFIG.github} target="_blank"
                className="p-2 rounded-md border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
                <Github size={18} />
              </Link>
              <Link href={SITE_CONFIG.linkedin} target="_blank"
                className="p-2 rounded-md border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors">
                <Linkedin size={18} />
              </Link>
            </div>
          </div>

          {/* Terminal window */}
          <div className="animate-slide-up stagger-3">
            <TerminalHero />
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section className="py-12 border-t border-[var(--color-border)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {skills.map(({ icon: Icon, label, desc }, i) => (
            <div key={label}
              className={`p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/40 transition-colors animate-slide-up stagger-${i + 1}`}>
              <Icon size={20} className="text-[var(--color-accent)] mb-3" />
              <p className="font-display text-sm font-semibold text-[var(--color-text)]">{label}</p>
              <p className="font-mono text-xs text-[var(--color-muted)] mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Projects ── */}
      {featuredProjects.length > 0 && (
        <section className="py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-[var(--color-text)]">Featured Projects</h2>
              <p className="font-mono text-xs text-[var(--color-muted)] mt-1">// things I've built</p>
            </div>
            <Link href="/projects/embedded"
              className="flex items-center gap-1 text-sm text-[var(--color-accent)] hover:gap-2 transition-all">
              All projects <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* ── Recent Posts ── */}
      {recentPosts.length > 0 && (
        <section className="py-16 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-[var(--color-text)]">Recent Writing</h2>
              <p className="font-mono text-xs text-[var(--color-muted)] mt-1">// thoughts & tutorials</p>
            </div>
            <Link href="/blog"
              className="flex items-center gap-1 text-sm text-[var(--color-accent)] hover:gap-2 transition-all">
              All posts <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentPosts.map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="py-16 border-t border-[var(--color-border)]">
        <div className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-dim)] p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-3">
            Let&apos;s build something together
          </h2>
          <p className="text-[var(--color-muted)] mb-6 max-w-md mx-auto">
            I&apos;m open to internships, collaborations, and interesting side projects in embedded systems and systems programming.
          </p>
          <Link href={`mailto:${SITE_CONFIG.email}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold hover:opacity-90 transition-opacity">
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
