/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 50: '#f3f6fb', 100: '#e4ebf5', 200: '#c9d7ea', 300: '#9fb7d9', 400: '#6b8fc4', 500: '#4a6fa8', 600: '#35568a', 700: '#2a4570', 800: '#1f3558', 900: '#14233d' }
      },
      fontFamily: { sans: ['"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'] }
    }
  },
  plugins: []
};
