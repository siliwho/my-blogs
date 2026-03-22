export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  techStack: string[];
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  category: 'embedded' | 'firmware' | 'kernel';
  status: 'active' | 'completed' | 'wip';
  featured?: boolean;
  highlights?: string[];
}

export const PROJECTS: Project[] = [
  // ── Embedded Systems ──
  {
    id: 'rtos-scheduler',
    title: 'Bare-Metal RTOS Scheduler',
    description: 'A preemptive task scheduler written in C for ARM Cortex-M4, with priority inheritance and semaphore support.',
    longDescription: 'Implemented a cooperative and preemptive RTOS scheduler from scratch targeting the STM32F4 microcontroller. Features include round-robin + priority scheduling, binary semaphores, message queues, and a basic memory allocator. Written entirely in C with inline assembly for context switching.',
    techStack: ['C', 'ARM Cortex-M4', 'STM32F4', 'OpenOCD', 'GDB'],
    githubUrl: 'https://github.com/yourusername/rtos-scheduler',
    category: 'embedded',
    status: 'completed',
    featured: true,
    highlights: [
      'Preemptive context switching via PendSV handler',
      'Priority-based scheduling with 8 levels',
      'Binary semaphores with priority inheritance',
      'Lightweight memory pool allocator',
    ],
  },
  {
    id: 'can-logger',
    title: 'CAN Bus Data Logger',
    description: 'Real-time CAN bus data acquisition system for automotive diagnostics, with SD card storage and OLED display.',
    techStack: ['C', 'STM32', 'CAN 2.0B', 'SPI', 'FatFS', 'OLED'],
    githubUrl: 'https://github.com/yourusername/can-logger',
    category: 'embedded',
    status: 'completed',
    highlights: [
      'Captures and decodes CAN frames at 500kbps',
      'Circular buffer for burst logging',
      'SD card logging via FatFS',
    ],
  },
  {
    id: 'sensor-fusion',
    title: 'IMU Sensor Fusion (Kalman)',
    description: 'Attitude estimation using MPU6050 IMU with Kalman filter implementation on AVR.',
    techStack: ['C', 'AVR', 'MPU6050', 'I2C', 'Kalman Filter'],
    githubUrl: 'https://github.com/yourusername/sensor-fusion',
    category: 'embedded',
    status: 'completed',
  },

  // ── Firmware ──
  {
    id: 'bootloader',
    title: 'Custom USB Bootloader',
    description: 'A USB DFU-class bootloader for STM32 with AES-128 encrypted firmware updates and integrity verification.',
    longDescription: 'A production-ready USB DFU bootloader implementing the USB Device Firmware Upgrade specification. Includes AES-128-CTR encrypted image support, CRC32 integrity checking, and a Python host-side flashing tool.',
    techStack: ['C', 'STM32', 'USB DFU', 'AES-128', 'Python'],
    githubUrl: 'https://github.com/yourusername/usb-bootloader',
    category: 'firmware',
    status: 'completed',
    featured: true,
    highlights: [
      'USB DFU class compliance',
      'AES-128-CTR encrypted images',
      'CRC32 integrity validation',
      'Python flashing utility',
    ],
  },
  {
    id: 'uart-driver',
    title: 'DMA-Driven UART Driver',
    description: 'High-performance UART driver using DMA circular buffers, eliminating CPU polling overhead.',
    techStack: ['C', 'STM32', 'DMA', 'UART', 'Ring Buffer'],
    githubUrl: 'https://github.com/yourusername/uart-dma',
    category: 'firmware',
    status: 'completed',
  },
  {
    id: 'power-manager',
    title: 'Low-Power Manager',
    description: 'Firmware library for managing MCU sleep modes, peripheral power gating, and wake-up sources.',
    techStack: ['C', 'STM32L4', 'STOP/STANDBY modes', 'RTC', 'WFI/WFE'],
    githubUrl: 'https://github.com/yourusername/power-manager',
    category: 'firmware',
    status: 'active',
  },

  // ── Kernel / OS ──
  {
    id: 'mini-kernel',
    title: 'MiniKernel x86',
    description: 'A toy x86 kernel written from scratch — bootloader, protected mode, paging, syscalls, and a basic shell.',
    longDescription: 'A learning OS project targeting x86-32. Includes a two-stage bootloader written in assembly, protected mode setup, a simple page-frame allocator, interrupt descriptor table (IDT) setup, keyboard driver, VGA text-mode driver, and a minimal shell interpreter. Runs in QEMU.',
    techStack: ['C', 'x86 Assembly', 'NASM', 'QEMU', 'GDB', 'Makefile'],
    githubUrl: 'https://github.com/yourusername/mini-kernel',
    category: 'kernel',
    status: 'active',
    featured: true,
    highlights: [
      'Two-stage bootloader (MBR → kernel)',
      'GDT, IDT, and basic PIC setup',
      'Simple page-frame allocator',
      'PS/2 keyboard + VGA text driver',
      'Minimalist shell with builtins',
    ],
  },
  {
    id: 'linux-module',
    title: 'Linux Kernel Modules',
    description: 'Collection of Linux kernel modules: character device, proc filesystem entries, and a netfilter hook.',
    techStack: ['C', 'Linux Kernel', 'LKM', 'procfs', 'Netfilter'],
    githubUrl: 'https://github.com/yourusername/linux-modules',
    category: 'kernel',
    status: 'completed',
    highlights: [
      'Character device driver with ioctl interface',
      '/proc filesystem entries for runtime stats',
      'Netfilter hook for simple packet logging',
    ],
  },
];

export function getProjectsByCategory(category: Project['category']): Project[] {
  return PROJECTS.filter(p => p.category === category);
}

export function getFeaturedProjects(): Project[] {
  return PROJECTS.filter(p => p.featured);
}

export function getProjectById(id: string): Project | undefined {
  return PROJECTS.find(p => p.id === id);
}
