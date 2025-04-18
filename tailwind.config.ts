// tailwind.config.js (Consolidated - No external design-tokens file needed)

import type { Config } from "tailwindcss"; // Optional: Provides type safety
import plugin from 'tailwindcss/plugin';

const config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      
      colors: {
        'primary': 'hsl(221.2 83.2% 53.3%)',
        'background': 'hsl(0 0% 100%)',
        'foreground': 'hsl(222.2 84% 4.9%)',
        'border': 'hsl(214.3 31.8% 91.4%)',
        'input': 'hsl(214.3 31.8% 91.4%)',
        'ring': 'hsl(221.2 83.2% 53.3%)',
        'secondary': 'hsl(210 40% 96.1%)',
        'destructive': 'hsl(0 84.2% 60.2%)',
        'muted': 'hsl(210 40% 96.1%)',
        'accent': 'hsl(210 40% 96.1%)',
        'popover': 'hsl(0 0% 100%)',
        'card': 'hsl(0 0% 100%)'
      },
           
      fontSize: {
        // Target: ~9.6px (~375px) to ~12.8px (~1440px)
        'xs': [`clamp(0.55rem, 0.44rem + 0.226vw, 0.8rem)`, { lineHeight: '1.5' }],
        // Target: ~11.2px (~375px) to ~14.4px (~1440px)
        'sm': [`clamp(0.7rem, 0.615rem + 0.226vw, 0.9rem)`, { lineHeight: '1.5' }],
        // Target: 12.8px (~375px) to 16px (~1440px) - Your new base reference
        'base': [`clamp(0.8rem, 0.703rem + 0.258vw, 1rem)`, { lineHeight: '1.5' }], // Adjusted LH
        // Target: ~14.4px (~375px) to ~19.2px (~1440px)
        'lg': [`clamp(0.9rem, 0.753rem + 0.392vw, 1.2rem)`, { lineHeight: '1.5' }],
        // Target: 16px (~375px) to ~22.4px (~1440px)
        'xl': [`clamp(1rem, 0.803rem + 0.525vw, 1.4rem)`, { lineHeight: '1.5' }],
        // Target: ~19.2px (~375px) to ~25.6px (~1440px)
        '2xl': [`clamp(1.3rem, 0.964rem + 0.629vw, 1.6rem)`, { lineHeight: '1.4' }],
        // Target: 24px (~375px) to 32px (~1440px)
        '3xl': [`clamp(1.5rem, 1.205rem + 0.787vw, 2rem)`, { lineHeight: '1.4' }],
        // Target: ~28.8px (~375px) to ~38.4px (~1440px)
        '4xl': [`clamp(1.8rem, 1.446rem + 0.944vw, 2.4rem)`, { lineHeight: '1.4' }],

      },
      
      fontFamily: {
        'sans': ['var(--font-sans)', 'system-ui', 'sans-serif'],
        'mono': ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },

      // --- Other customizations from your original config ---

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'task': '0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.08), 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.06)',
        'task-hover': '0 0.25rem 0.375rem rgba(0, 0, 0, 0.05)',
        'dialog': '0 1.5625rem 3.125rem -0.75rem rgba(0, 0, 0, 0.25)',
        'input': 'inset 0 0.125rem 0.25rem rgba(0, 0, 0, 0.05)',
        'input-focus': '0 0 0 0.125rem rgba(59, 130, 246, 0.3)',
      },
      backgroundImage: {
        'button-gradient': 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        'button-gradient-hover': 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        'card-gradient': 'linear-gradient(145deg, #ffffff, #f9fafb)',
        'card-gradient-dark': 'linear-gradient(145deg, #1f2937, #111827)',
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" }, },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" }, },
        "fade-in": { from: { opacity: "0", transform: "translateY(0.625rem)" }, to: { opacity: "1", transform: "translateY(0)" }, },
        "fade-out": { from: { opacity: "1", transform: "translateY(0)" }, to: { opacity: "0", transform: "translateY(0.625rem)" }, },
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
        xs: '0.125rem',
      },
      timer: {
        track: { width: '2.5rem', gap: '0.3125rem', },
        icon: { width: '1.5rem', height: '1.875rem', },
        shadow: { blur: '1.25rem', offset: '0.5rem', }
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
    }, // End of extend
  }, // End of theme
  plugins: [
    require("tailwindcss-animate"),
    plugin(({ addVariant }) => {
      addVariant('child', '& > *');
      addVariant('child-hover', '& > *:hover');
    }),
    plugin(({ addBase }) => {
      addBase({
        ':root': {
          '--radius': '0.5rem', // This seems like a reasonable place for CSS variables
        },
      });
    }),
  ],
} satisfies Config; // Use 'satisfies Config' if you imported the type

export default config;