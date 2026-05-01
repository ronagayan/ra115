/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d1f16',
        surface: '#1a3a2a',
        accent: '#2d6a4f',
        highlight: '#52b788',
        'text-primary': '#d8f3dc',
        muted: '#74c69d',
        gold: '#f4a261',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"Courier Prime"', 'monospace'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(82, 183, 136, 0.4)' },
          '50%': { boxShadow: '0 0 0 16px rgba(82, 183, 136, 0)' },
        },
        scrollX: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        shake: 'shake 0.5s ease-in-out',
        pulseGreen: 'pulseGreen 1s ease-in-out',
        scrollX: 'scrollX 30s linear infinite',
      },
    },
  },
  plugins: [],
};
