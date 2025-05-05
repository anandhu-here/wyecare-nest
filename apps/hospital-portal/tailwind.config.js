const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        blue: {
          ...colors.blue,
          theme: '#3b82f6', // The blue-500 we used in gradients
        },
        purple: {
          ...colors.purple,
          theme: '#8b5cf6', // The purple-500 we used in gradients
        },
        indigo: {
          ...colors.indigo,
          theme: '#6366f1', // For the night shift buttons
        },
        green: {
          ...colors.green,
          theme: '#22c55e',
        },

        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },

        // Update primary colors to blue shades
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Blue-500
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
          // Shadcn components
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },

        // Required shadcn colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // Add gradient utilities
      backgroundImage: {
        'gradient-primary':
          'linear-gradient(to right, var(--tw-gradient-stops))',
        'gradient-primary-to-tr':
          'linear-gradient(to top right, var(--tw-gradient-stops))',
        'gradient-primary-to-br':
          'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        // Add this new card gradient
        'card-gradient': 'linear-gradient(to bottom right, #ffffff, #ffffff)',
        'card-gradient-dark':
          'linear-gradient(to bottom right, #1f2937, #1c2431)',
      },

      gradientColorStops: {
        'primary-start': '#3b82f6', // blue-500
        'primary-end': '#8b5cf6', // purple-500
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      height: {
        header: '60px',
        tab: '48px',
        sidebar: '240px',
        'content-desktop': 'calc(100vh - 60px)',
        'content-mobile': 'calc(100vh - 120px)',
        'sidebar-desktop': 'calc(100vh - 64px - 48px)',
      },
      fontFamily: {
        sans: ['Avenir Next', 'Helvetica Neue', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
