export interface PDFItem {
  id: string;
  title: string;
  description: string;
  category: string;
  filename: string; // file in /public/pdfs/
  date: string;
  tags: string[];
}

export const PDF_CATEGORIES = [
  'Research Papers',
  'Datasheets',
  'Notes',
  'Textbooks',
  'Presentations',
];

export const PDFS: PDFItem[] = [
  {
    id: 'arm-cortex-m4-ref',
    title: 'ARM Cortex-M4 Technical Reference',
    description: 'Official ARM Cortex-M4 processor technical reference manual covering architecture, instruction set, and memory model.',
    category: 'Datasheets',
    filename: 'arm-cortex-m4-ref.pdf',
    date: '2024-01-10',
    tags: ['ARM', 'Cortex-M4', 'Architecture'],
  },
  {
    id: 'rtos-internals-notes',
    title: 'RTOS Internals — Personal Notes',
    description: 'My handwritten notes on RTOS scheduling algorithms, context switching, and IPC mechanisms.',
    category: 'Notes',
    filename: 'rtos-notes.pdf',
    date: '2024-03-22',
    tags: ['RTOS', 'Scheduling', 'Embedded'],
  },
  {
    id: 'linux-kernel-dev',
    title: 'Linux Kernel Development Overview',
    description: 'A condensed reference for Linux kernel module development — from module init to advanced device drivers.',
    category: 'Notes',
    filename: 'linux-kernel-dev.pdf',
    date: '2024-05-15',
    tags: ['Linux', 'Kernel', 'LKM'],
  },
  {
    id: 'can-bus-spec',
    title: 'CAN Bus Protocol Specification',
    description: 'Bosch CAN 2.0 specification document — frame formats, bit timing, and error handling.',
    category: 'Datasheets',
    filename: 'can-bus-spec.pdf',
    date: '2023-11-02',
    tags: ['CAN', 'Protocol', 'Automotive'],
  },
];
