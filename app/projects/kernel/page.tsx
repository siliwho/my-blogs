import type { Metadata } from 'next';
import { getProjectsByCategory } from '@/lib/projects';
import { ProjectsPage } from '@/components/projects/ProjectsPage';

export const metadata: Metadata = {
  title: 'Kernel / OS Development Projects',
  description: 'Linux kernel modules, toy operating systems, drivers, and systems programming experiments.',
};

export default function KernelPage() {
  const projects = getProjectsByCategory('kernel');
  return (
    <ProjectsPage
      category="kernel"
      icon="🐧"
      subtitle="// deep in ring 0"
      title="Kernel / OS Development"
      description="From-scratch OS experiments, Linux kernel modules, device drivers, and systems programming. x86 protected mode, paging, syscalls — all the good stuff."
      projects={projects}
    />
  );
}
