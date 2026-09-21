import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f8ff',
          100: '#e6f0ff',
          200: '#c7d9ff',
          300: '#9ebeff',
          400: '#7398ff',
          500: '#4d73ff',
          600: '#3155db',
          700: '#2947b4',
          800: '#273f92',
          900: '#263a78',
        },
      },
      boxShadow: {
        soft: '0 20px 60px rgba(31, 41, 55, 0.12)',
      },
      backgroundImage: {
        grid: 'radial-gradient(circle at center, rgba(148,163,184,0.18) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;
