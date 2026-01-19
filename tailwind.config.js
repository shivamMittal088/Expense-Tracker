/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ["Allura", "cursive"],
      },
      colors: {
        theme: {
          'bg-primary': 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-tertiary': 'var(--bg-tertiary)',
          'bg-card': 'var(--bg-card)',
          'bg-hover': 'var(--bg-hover)',
          'bg-active': 'var(--bg-active)',
          'bg-button': 'var(--bg-button)',
          'bg-button-hover': 'var(--bg-button-hover)',
          'bg-overlay': 'var(--bg-overlay)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
          'text-dim': 'var(--text-dim)',
          'text-button': 'var(--text-button)',
          'border': 'var(--border-color)',
          'border-subtle': 'var(--border-subtle)',
          'accent': 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
          'success': 'var(--success)',
          'danger': 'var(--danger)',
          'danger-hover': 'var(--danger-hover)',
        }
      },
    },
  },
  plugins: [],
};
