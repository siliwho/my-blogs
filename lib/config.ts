export const SITE_CONFIG = {
  name: 'siliwho',
  author: 'Anant Gyan Singhal',
  description: 'Electronics student | Embedded Systems | Firmware | Kernel Dev — Personal lab & journal',
  url: 'https://anantdev.vercel.app',
  twitterHandle: '@anantdev',
  github: 'https://github.com/siliwho',
  linkedin: 'https://linkedin.com/in/anant-gyan-singhal',
  email: 'sanantgyan@gmail.com',
  githubUsername: 'siliwho',
};

// Repos shown on the /activity page
export const PINNED_REPOS = [
  'siliwho/PlayCard',
  'siliwho/miniRTOS',
  'siliwho/spi-driver',
  'siliwho/tft_disp_glib',
  'siliwho/uart-driver',
  'siliwho/echopay',
];

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  {
    label: 'Projects',
    children: [
      { href: '/projects/embedded', label: 'Embedded Systems' },
      { href: '/projects/firmware', label: 'Firmware Dev' },
      { href: '/projects/kernel', label: 'Kernel / OS' },
    ],
  },
  { href: '/pdfs', label: 'PDFs' },
  { href: '/activity', label: 'Activity' },
  { href: '/about', label: 'About' },
];
