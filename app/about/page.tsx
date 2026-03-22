import type { Metadata } from 'next';
import Link from 'next/link';
import { Github, Linkedin, Mail, Download, BookOpen, Cpu, Terminal, Radio } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'About',
  description: 'Electronics student and aspiring systems developer.',
};

const timeline = [
    { year: '2026', title: 'PlayCard', desc: 'custom hand held gaming device can be used as a bluetooth controller.' },
  { year: '2025', title: 'Built bare-metal RTOS', desc: 'Preemptive scheduler + semaphores on STM32F4 from scratch.' },
];

const skills = [
  { category: 'Languages', items: ['C (expert)', 'Rust (learning)', 'x86/ARM ASM', 'Python', 'Bash'] },
  { category: 'Embedded', items: ['STM32 (F4/L4/H7)', 'AVR', 'ARM Cortex-M0–M7', 'RISC-V (basic)', 'CAN/SPI/I2C/UART/USB'] },
  { category: 'OS / Kernel', items: ['Linux LKM', 'x86 protected mode', 'QEMU/GDB', 'procfs/sysfs', 'Netfilter'] },
  { category: 'Toolchain', items: ['GCC/Clang', 'OpenOCD', 'JTAG/SWD', 'Make/CMake', 'Git'] },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-14">
        <p className="font-mono text-xs text-[var(--color-accent)] mb-2">// about me</p>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
          <div>
            <h1 className="font-display text-4xl font-bold text-[var(--color-text)] mb-2">Anant Gyan Singhal</h1>
            <p className="font-mono text-sm text-[var(--color-accent)]">
              Electronics Student · Embedded Systems · Firmware · Kernel Dev
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={SITE_CONFIG.github} target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/40 transition-colors">
              <Github size={15} /> GitHub
            </Link>
            <Link href={SITE_CONFIG.linkedin} target="_blank"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/40 transition-colors">
              <Linkedin size={15} /> LinkedIn
            </Link>
            <Link href={`mailto:${SITE_CONFIG.email}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)]/40 transition-colors">
              <Mail size={15} /> Email
            </Link>
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <p className="text-[var(--color-muted)] leading-relaxed text-base">
            I&apos;m a BTech Electronics Engineering student obsessed with systems that run close to the metal.
            My work spans bare-metal firmware on ARM Cortex-M microcontrollers, Linux kernel modules,
            and from-scratch OS experiments. I believe the best way to understand a system is to build
            one yourself — from the bootloader up.
          </p>
          <p className="text-[var(--color-muted)] leading-relaxed text-base mt-4">
            This site is my lab notebook and journal. I write about what I&apos;m building, what I&apos;m
            learning, and the low-level details that most tutorials skip over.
          </p>
        </div>
      </div>

      {/* Focus areas */}
      <section className="mb-14">
        <h2 className="font-display text-xl font-semibold text-[var(--color-text)] mb-6">Focus Areas</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Cpu, title: 'Embedded Systems', desc: 'RTOS, sensor fusion, real-time control, power management on STM32 and AVR.' },
            { icon: Radio, title: 'Firmware', desc: 'Bootloaders, USB stacks, DMA drivers, peripheral bring-up, and HAL-free code.' },
            { icon: Terminal, title: 'Kernel / OS', desc: 'Linux kernel modules, x86 OS from scratch, drivers, and syscall interfaces.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <Icon size={20} className="text-[var(--color-accent)] mb-3" />
              <h3 className="font-display font-semibold text-[var(--color-text)] mb-2">{title}</h3>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="mb-14">
        <h2 className="font-display text-xl font-semibold text-[var(--color-text)] mb-6">Skills</h2>
        <div className="grid md:grid-cols-2 gap-5">
          {skills.map(({ category, items }) => (
            <div key={category} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <p className="font-mono text-xs text-[var(--color-accent)] mb-3">{category}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(item => (
                  <span key={item} className="font-mono text-xs px-2 py-1 rounded bg-[var(--color-border)] text-[var(--color-muted)]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-14">
        <h2 className="font-display text-xl font-semibold text-[var(--color-text)] mb-6">Timeline</h2>
        <div className="relative pl-6 border-l border-[var(--color-border)] space-y-8">
          {timeline.map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-accent)]" />
              <p className="font-mono text-xs text-[var(--color-accent)] mb-1">{item.year}</p>
              <h3 className="font-display font-semibold text-[var(--color-text)] mb-1">{item.title}</h3>
              <p className="text-sm text-[var(--color-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Currently reading */}
      <section className="mb-14">
        <h2 className="font-display text-xl font-semibold text-[var(--color-text)] mb-5">Currently Reading</h2>
        <div className="space-y-3">
          {[
            { title: 'The Linux Kernel Development', author: 'Robert Love' },
            { title: 'Programming Rust', author: 'Jim Blandy' },
            { title: 'Computer Organization and Design (RISC-V)', author: 'Patterson & Hennessy' },
          ].map(book => (
            <div key={book.title} className="flex items-center gap-3">
              <BookOpen size={14} className="text-[var(--color-accent)] shrink-0" />
              <span className="text-sm text-[var(--color-text)]">{book.title}</span>
              <span className="text-xs text-[var(--color-muted)]">— {book.author}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-dim)] p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-[var(--color-text)] mb-2">Get in touch</h2>
        <p className="text-[var(--color-muted)] text-sm mb-5">
          Internship opportunities, collaborations, or just want to chat about embedded systems?
        </p>
        <Link href={`mailto:${SITE_CONFIG.email}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-[var(--color-bg)] font-semibold text-sm hover:opacity-90 transition-opacity">
          <Mail size={15} /> {SITE_CONFIG.email}
        </Link>
      </section>
    </div>
  );
}
