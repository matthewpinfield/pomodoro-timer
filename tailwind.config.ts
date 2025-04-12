import type { Config } from "tailwindcss"
import plugin from 'tailwindcss/plugin'
import { getTokensForTailwind } from './lib/design-tokens'

const { colors, spacing, fontSize, fontFamily } = getTokensForTailwind();

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors,
      spacing,
      fontSize,
      fontFamily,
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'task': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'task-hover': '0 4px 6px rgba(0, 0, 0, 0.05)',
        'dialog': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'input': 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
        'input-focus': '0 0 0 2px rgba(59, 130, 246, 0.3)',
      },
      backgroundImage: {
        'button-gradient': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'button-gradient-hover': 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        'card-gradient': 'linear-gradient(145deg, #ffffff, #f9fafb)',
        'card-gradient-dark': 'linear-gradient(145deg, #1f2937, #111827)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1", transform: "translateY(0)" },
          to: { opacity: "0", transform: "translateY(10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      backdropBlur: {
        xs: '2px',
      },
      timer: {
        track: {
          width: '2.5rem',
          gap: '0.3125rem',
        },
        icon: {
          width: '1.5rem',
          height: '1.875rem',
        },
        shadow: {
          blur: '1.25rem',
          offset: '0.5rem',
        }
      },
      sizes: {
        'icon-sm': 'clamp(1.5rem, 2.25dvmin, 2.25rem)',
        'icon-base': 'clamp(2rem, 3dvmin, 3rem)',
        'icon-lg': 'clamp(2.5rem, 3.75dvmin, 3.75rem)',
        'logo-mobile': 'clamp(6rem, 10dvmin, 10rem)',
        'logo-desktop': 'clamp(5rem, 8dvmin, 8rem)',
      },
      maxWidth: {
        'dialog-sm': '24rem',
        'dialog-md': '28rem',
        'dialog-lg': '32rem',
      },
      maxHeight: {
        'dialog': '90dvh',
        'note': '25dvh',
        'note-sm': '20dvh',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addVariant }) => {
      addVariant('child', '& > *');
      addVariant('child-hover', '& > *:hover');
    }),
    plugin(({ addBase }) => {
      addBase({
        ':root': {
          '--radius': '0.5rem',
        },
      });
    }),
  ],
} satisfies Config

export default config