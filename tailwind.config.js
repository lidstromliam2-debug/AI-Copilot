/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bloomberg Europe Color Palette
        'bloomberg-bg': '#F8F8F8',
        'bloomberg-white': '#FFFFFF',
        'bloomberg-black': '#000000',
        'bloomberg-headline': '#121212',
        'bloomberg-text': '#4A4A4A',
        'bloomberg-secondary': '#6F6F6F',
        'bloomberg-blue': '#0037FF',
        'bloomberg-blue-hover': '#0026C7',
        'bloomberg-yellow': '#F5C518',
        'bloomberg-red': '#E4002B',
        'bloomberg-green': '#0FA958',
        'bloomberg-negative': '#D7373F',
        'bloomberg-border': '#E0E0E0',
        'bloomberg-hover': '#E6E6E6',
        'bloomberg-btn-hover': '#1A1A1A',
      },
      backgroundImage: {
        'hero': "url('/chart-bg.jpeg')",
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
