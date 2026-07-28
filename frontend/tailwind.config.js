/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F3',
        ink:   '#16201A',
        green: {
          DEFAULT: '#0D6B4E',
          dark:    '#0A5540',
          light:   '#E8F5F0',
        },
        ribbon: '#C94034',
        muted:  '#6B7A70',
        line:   '#E3DDD4',
        card:   '#FFFFFF',
      },
      fontFamily: {
        serif: ['Georgia', '"Times New Roman"', 'serif'],
        sans:  ['system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono:  ['ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
