import type { Metadata } from 'next';
import { getProjectsByCategory } from '@/lib/projects';
import { ProjectsPage } from '@/components/projects/ProjectsPage';

export const metadata: Metadata = {
  title: 'Firmware Development Projects',
  description: 'Bootloaders, device drivers, DMA controllers, and low-level firmware for embedded systems.',
};

export default function FirmwarePage() {
  const projects = getProjectsByCategory('firmware');
  return (
    <ProjectsPage
      category="firmware"
      icon="🔧"
      subtitle="// close to the metal"
      title="Firmware Development"
      description="Bootloaders, USB stacks, DMA drivers, power management, and bare-metal firmware. Code that runs without an OS, talking directly to hardware registers."
      projects={projects}
    />
  );
}
