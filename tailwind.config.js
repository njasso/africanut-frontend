/** @type {import('tailwindcss').Config} */
import scrollbarHide from 'tailwind-scrollbar-hide';

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          brown: "#8a4b2d",
          green: "#2f8f4e",
          yellow: "#f2b705",
          red: "#d63c2e",
          dark: "#1a1a1a"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.1)",
        innerSoft: "inset 0 4px 10px rgba(0,0,0,0.05)"
      },
      borderRadius: {
        '2xl': '1.25rem'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif']
      },
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
        colors: 'background-color, border-color, color, fill, stroke'
      },
      maxWidth: {
        'screen-2xl': '1440px'
      }
    },
  },
  plugins: [scrollbarHide],
}
