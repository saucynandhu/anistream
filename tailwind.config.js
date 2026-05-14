/**
 * Tailwind CSS configuration for AniStream (dark-only UI tokens).
 *
 * @file Extends theme with brand colors and font stacks.
 * @imports tailwindcss default export
 * @exports default Tailwind config
 * @gotchas `content` paths must include all JSX files or classes will be purged in production.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d0d0f',
          raised: '#141418',
          border: '#23232a',
        },
        accent: {
          DEFAULT: '#e11d48',
          muted: '#fb7185',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Inter',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,0.45)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s ease-in-out infinite',
        fadeIn: 'fadeIn 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
