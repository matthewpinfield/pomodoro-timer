import type { Config } from "tailwindcss"
import plugin from 'tailwindcss/plugin'

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
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
      spacing: {
        'xs': '0.3dvh',
        'sm': '0.5dvh',
        'md': '1dvh',
        'lg': '1.5dvh',
        'xl': '2dvh',
        '2xl': '2.5dvh',
        'w-xs': '0.3dvw',
        'w-sm': '0.5dvw',
        'w-md': '1dvw',
        'w-lg': '1.5dvw',
        'w-xl': '2dvw',
      },
      fontSize: {
        'xs': ['clamp(0.75rem, 1.125dvmin, 1.25rem)', { lineHeight: '1.5rem' }],
        'sm': ['clamp(0.875rem, 1.3dvmin, 1.5rem)', { lineHeight: '1.75rem' }],
        'base': ['clamp(1rem, 1.5dvmin, 1.8rem)', { lineHeight: '2rem' }],
        'lg': ['clamp(1.125rem, 1.7dvmin, 2rem)', { lineHeight: '2.25rem' }],
        'xl': ['clamp(1.25rem, 1.875dvmin, 2.25rem)', { lineHeight: '2.5rem' }],
        '2xl': ['clamp(1.5rem, 2.25dvmin, 2.5rem)', { lineHeight: '2.75rem' }],
        '3xl': ['clamp(1.875rem, 3dvmin, 3rem)', { lineHeight: '3.25rem' }],
        '4xl': ['clamp(2.25rem, 3.75dvmin, 3.5rem)', { lineHeight: '4rem' }],
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
    // Add plugin for custom variants
    plugin(({ addVariant }: { addVariant: (name: string, definition: string) => void }) => {
      addVariant('child', '& > *');
      addVariant('child-hover', '& > *:hover');
    }),
  ],
} satisfies Config

export default config

