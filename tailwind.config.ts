import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C97A',
          dark: '#9A6E2A',
        },
        pitch: {
          900: '#0A0D0F',
          800: '#12181E',
          700: '#1C2530',
          600: '#243040',
        },
        green: {
          pitch: '#1A5C2E',
          bright: '#2D8B4E',
        },
      },
      fontFamily: {
        bebas: ['var(--font-bebas)', 'sans-serif'],
        barlow: ['var(--font-barlow)', 'sans-serif'],
        'barlow-condensed': ['var(--font-barlow-condensed)', 'sans-serif'],
      },
      backgroundImage: {
        'stadium-grid':
          'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(201,168,76,0.06) 28px,rgba(201,168,76,0.06) 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(201,168,76,0.06) 28px,rgba(201,168,76,0.06) 29px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0)' }, '50%': { boxShadow: '0 0 12px 2px rgba(201,168,76,0.3)' } },
      },
    },
  },
  plugins: [],
}

export default config
