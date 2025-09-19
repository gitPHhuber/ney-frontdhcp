/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--netgrip-component-bg-dark)',
        border: 'var(--netgrip-border-dark)',
      },
    },
  },
  plugins: [],
};

