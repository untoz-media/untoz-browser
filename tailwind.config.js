/**
 * Tailwind CSS Configuration for Untoz Design System
 *
 * Implements a premium, modern design system inspired by Arc Browser and Zen Browser
 * with sophisticated use of color, transparency, blur, and motion.
 */
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // UNTOZ DESIGN SYSTEM - COLOR TOKENS
      colors: {
        // Foundation - Sophisticated dark theme with subtle transparency for mica effect
        background: '#0f0f0f',          // Primary background
        background-hover: '#1a1a1a',    // Hover state
        background-muted: '#1a1a1a',    // Muted background
        background-muted-hover: '#242424', // Muted hover

        foreground: '#ffffff',          // Primary foreground
        foreground-muted: '#a1a1aa',    // Muted foreground
        foreground-muted-hover: '#d4d4d8', // Muted foreground hover

        // Primary - Untoz Brand (Sophisticated Blue-Purple gradient-like)
        primary: '#6366f1',             // Vibrant Indigo
        primary-foreground: '#ffffff',  // Text on primary
        primary-muted: '#818cf8',       // Muted primary
        primary-muted-foreground: '#1e1b4b', // Text on muted primary

        // Secondary - Subtle accents
        secondary: '#8b5cf6',           // Violet
        secondary-foreground: '#ffffff',
        secondary-muted: '#a78bfa',
        secondary-muted-foreground: '#312e81',

        // Accent - For interactive elements
        accent: '#06b6d4',              // Cyan
        accent-foreground: '#ffffff',
        accent-muted: '#67e8f9',
        accent-muted-foreground: '#0369a1',

        // Border - Subtle borders with transparency
        border: 'rgb(255 255 255 / 0.1)',       // ~10% white
        border-hover: 'rgb(255 255 255 / 0.2)', // ~20% white
        border-muted: 'rgb(255 255 255 / 0.05)', // ~5% white
        input: 'rgb(255 255 255 / 0.15)',       // ~15% white for inputs

        // Ring - Focus rings
        ring: 'rgb(99 102 241 / 0.5)',          // Primary with 50% opacity
        ring-offset: 0,

        // Shadows - Sophisticated elevation
        shadow-sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        shadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        shadow-md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        shadow-lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1)',
        shadow-xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        shadow-2xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',

        // Blur effects for mica/acrylic appearance
        blur: '8px',
      },

      // UNTOZ DESIGN SYSTEM - TYPOGRAPHY
      fontFamily: {
        // Using Inter as base with potential for custom font later
        sans: ['Inter var', ...fontFamily.sans],
        mono: ['JetBrains Mono', ...fontFamily.mono],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      fontWeight: {
        hairline: '100',
        thin: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      // UNTOZ DESIGN SYSTEM - BORDER RADIUS
      borderRadius: {
        xs: '0.125rem',   // 2px
        sm: '0.25rem',    // 4px
        md: '0.375rem',   // 6px
        lg: '0.5rem',     // 8px
        xl: '0.75rem',    // 12px
        '2xl': '1rem',    // 16px
        '3xl': '1.5rem',  // 24px
        '4xl': '2rem',    // 32px
        '5xl': '2.5rem',  // 40px
        '6xl': '3rem',    // 48px
      },

      // UNTOZ DESIGN SYSTEM - SPACING SYSTEM
      spacing: {
        px: '1px',
        0: '0px',
        0.5: '0.125rem',  // 2px
        1: '0.25rem',     // 4px
        1.5: '0.375rem',  // 6px
        2: '0.5rem',      // 8px
        2.5: '0.625rem',  // 10px
        3: '0.75rem',     // 12px
        3.5: '0.875rem',  // 14px
        4: '1rem',        // 16px
        5: '1.25rem',     // 20px
        6: '1.5rem',      // 24px
        7: '1.75rem',     // 28px
        8: '2rem',        // 32px
        9: '2.25rem',     // 36px
        10: '2.5rem',     // 40px
        11: '2.75rem',    // 44px
        12: '3rem',       // 48px
        14: '3.5rem',     // 56px
        16: '4rem',       // 64px
        20: '5rem',       // 80px
        24: '6rem',       // 96px
        28: '7rem',       // 112px
        32: '8rem',       // 128px
        36: '9rem',       // 144px
        40: '10rem',      // 160px
        44: '11rem',      // 176px
        48: '12rem',      // 192px
        52: '13rem',      // 208px
        56: '14rem',      // 224px
        60: '15rem',      // 240px
        64: '16rem',      // 256px
        72: '18rem',      // 288px
        80: '20rem',      // 320px
        96: '24rem',      // 384px
      },

      // UNTOZ DESIGN SYSTEM - TRANSITIONS
      transitionDuration: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },
      transitionTimingFunction: {
        'in-browser': 'cubic-bezier(0.33, 0.01, 0.68, 0.99)',
        'out-browser': 'cubic-bezier(0.33, 1, 0.68, 1)',
        'in-out-browser': 'cubic-bezier(0.33, 0, 0.68, 1)',
      },

      // UNTOZ DESIGN SYSTEM - ANIMATIONS
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-in-out',
        'fade-out': 'fade-out 150ms ease-in-out',
        'slide-up': 'slide-up 200ms ease-out',
        'slide-down': 'slide-down 200ms ease-out',
        'scale-in': 'scale-in 150ms ease-out',
        'scale-out': 'scale-out 150ms ease-in',
      },

      // UNTOZ DESIGN SYSTEM - BOX SHADOW UTILITIES (for mica/acrylic effect)
      boxShadow: {
        'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        'shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },

      // Custom backdrop blur for mica effect
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      // Backdrop brightness for hover states
      backdropBrightness: {
        50: '.5',
        75: '.75',
        90: '.9',
        95: '.95',
        100: '1',
        105: '1.05',
        110: '1.1',
        120: '1.2',
        130: '1.3',
      },

      // Backdrop contrast for depth
      backdropContrast: {
        50: '.5',
        75: '.75',
        90: '.9',
        95: '.95',
        100: '1',
        105: '1.05',
        110: '1.1',
        120: '1.2',
        130: '1.3',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};