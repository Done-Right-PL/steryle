const { brand, accent, ink, paper, success, danger } = require('@steryle/config/tokens')

/**
 * Mirrors apps/web's @theme tokens so the app and the storefront render the
 * same blue palette.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: brand[600],
          50: brand[50],
          100: brand[100],
          200: brand[200],
          300: brand[300],
          400: brand[400],
          500: brand[500],
          600: brand[600],
          700: brand[700],
          800: brand[800],
          900: brand[900],
          950: brand[950],
        },
        accent: {
          DEFAULT: accent[600],
          50: accent[50],
          100: accent[100],
          500: accent[500],
          600: accent[600],
          700: accent[700],
        },
        ink: {
          DEFAULT: ink[900],
          800: ink[800],
          700: ink[700],
          600: ink[600],
          500: ink[500],
          400: ink[400],
          300: ink[300],
        },
        paper: {
          DEFAULT: paper[0],
          50: paper[50],
          100: paper[100],
          200: paper[200],
          300: paper[300],
        },
        success: {
          DEFAULT: success[600],
          50: success[50],
          100: success[100],
          600: success[600],
          700: success[700],
        },
        danger: {
          DEFAULT: danger[600],
          50: danger[50],
          100: danger[100],
          500: danger[500],
          600: danger[600],
          700: danger[700],
        },
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
      },
    },
  },
  plugins: [],
}
