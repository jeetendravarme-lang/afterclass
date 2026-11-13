/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#d4af37',
          light: '#f5d76e',
          dark: '#9a7b1e',
        },
        ink: '#0a0a12',
        panel: '#12121f',
        panel2: '#1a1a2e',
        violet: {
          deep: '#2a1052',
          glow: '#7b2ff7',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', '"Arial Narrow"', 'sans-serif'],
        body: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(123, 47, 247, 0.45)',
        gold: '0 0 24px rgba(212, 175, 55, 0.35)',
      },
    },
  },
  plugins: [],
};
