import type { Metadata } from 'next';
import { getProjectsByCategory } from '@/lib/projects';
import { ProjectsPage } from '@/components/projects/ProjectsPage';

export const metadata: Metadata = {
  title: 'Embedded Systems Projects',
  description: 'Hardware projects, circuit designs, and firmware for microcontrollers and embedded systems.',
};

export default function EmbeddedPage() {
  const projects = getProjectsByCategory('embedded');
  return (
    <ProjectsPage
      category="embedded"
      icon="⚡"
      subtitle="// hardware meets software"
      title="Embedded Systems"
      description="Microcontroller projects, sensor fusion, real-time control systems, and hardware-software co-design. Built on ARM Cortex-M, AVR, and RISC-V targets."
      projects={projects}
    />
  );
}
