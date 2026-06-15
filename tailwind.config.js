/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          200: '#bce0ff',
          300: '#8eccff',
          400: '#59aeff',
          500: '#338bff',
          600: '#1f6cf5',
          700: '#1a56e1',
          800: '#1c47b6',
          900: '#1d408f',
          950: '#162857',
        },
        accent: {
          500: '#0ea5a4',
          600: '#0d9090',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        hover: '0 10px 30px rgba(31,108,245,0.12)',
      },
    },
  },
  plugins: [],
}
