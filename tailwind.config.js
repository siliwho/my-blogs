/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg:           'var(--color-bg)',
        surface:      'var(--color-surface)',
        border:       'var(--color-border)',
        text:         'var(--color-text)',
        muted:        'var(--color-muted)',
        accent:       'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
      },
      animation: {
        'fade-in':  'fadeIn 0.45s ease forwards',
        'slide-up': 'slideUp 0.55s ease forwards',
        'blink':    'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink:   { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
