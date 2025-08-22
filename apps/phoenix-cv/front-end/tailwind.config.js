/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Phoenix Colors (Principales)
        phoenix: {
          primary: '#ff4500',
          secondary: '#ff6b35', 
          accent: '#ff8c42',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff4500',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12'
        },
        // Luna Colors (Complémentaires)
        luna: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        // Couleurs Système
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      backgroundImage: {
        'phoenix-gradient': 'linear-gradient(135deg, #ff4500 0%, #ff6b35 50%, #ff8c42 100%)',
        'luna-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
        'phoenix-luna-gradient': 'linear-gradient(135deg, #ff4500 0%, #6366f1 50%, #06b6d4 100%)'
      }
    },
  },
  plugins: [],
};
