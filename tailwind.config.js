/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,mdx}",
    "./components/**/*.{js,jsx,mdx}",
    "./features/**/*.{js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FFFBDC',
        brand: {
          primary: '#FF5900',
          secondary: '#FB8237',
          accent: '#FFD3A5',
          light: '#FFAA6E',
          dark: '#2B2B2B',
          muted: '#666666',
          border: '#EFE6DA',
        }
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
        'marquee-reverse': 'marquee-reverse 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-reverse': {
          '0%': { transform: 'translateX(-50%)' },
          '100%': { transform: 'translateX(0%)' },
        }
      }
    },
  },
  plugins: [],
};
