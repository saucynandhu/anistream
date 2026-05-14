/**
 * PostCSS pipeline for Tailwind and Autoprefixer.
 *
 * @file Wires Tailwind into the build.
 * @imports tailwindcss, autoprefixer
 * @exports plugins array
 * @gotchas Required for Vite + Tailwind v3.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
