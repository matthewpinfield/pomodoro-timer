/**
 * Design Token System
 * Single source of truth for design values that can be consumed by both CSS/Tailwind and Canvas
 */

// Base types for our token system
export type BaseToken<T, TW, CV> = {
  value: T;
  toTailwind: () => TW;
  toCanvas: () => CV;
};

type ColorValue = {
  hsl: string;      // HSL value for CSS
  rgb: [number, number, number]; // RGB values for Canvas
};

type SpacingValue = {
  value: number;
  unit: 'rem' | 'dvh' | 'dvw' | 'dvmin';
};

type ResponsiveValue = {
  min: number;
  preferred: number;
  preferredUnit: 'dvmin' | 'dvmax' | 'rem';
  max: number;
};

// Token type definitions
export type ColorToken = BaseToken<
  ColorValue,
  string,
  { r: number; g: number; b: number }
>;

export type SpacingToken = Omit<BaseToken<SpacingValue, string, number>, 'toCanvas'> & {
  toCanvas: {
    (): number;
    (viewportSize: number): number;
  };
};

export type FontSizeToken = BaseToken<
  ResponsiveValue,
  [string, { lineHeight: string }],
  number
> & {
  remValue: number;
  lineHeight: number;
  toCanvas: (viewportSize?: number) => number;
};

export type FontFamilyToken = BaseToken<
  string[],
  string[],
  string
>;

// Token creation functions
function createColorToken(hsl: string, rgb: [number, number, number]): ColorToken {
  return {
    value: { hsl, rgb },
    toTailwind: () => `hsl(${hsl})`,
    toCanvas: () => ({ r: rgb[0], g: rgb[1], b: rgb[2] })
  };
}

function createSpacingToken(value: number, unit: SpacingValue['unit']): SpacingToken {
  return {
    value: { value, unit },
    toTailwind: () => `${value}${unit}`,
    toCanvas: function(viewportSize?: number) {
      const size = viewportSize ?? (typeof window !== 'undefined' ? window.innerHeight : 0);
      switch (unit) {
        case 'rem': return value * 16;
        case 'dvh': return (size / 100) * value;
        case 'dvw': return (window.innerWidth / 100) * value;
        case 'dvmin': return (Math.min(window.innerWidth, window.innerHeight) / 100) * value;
        default: return value;
      }
    }
  };
}

function createFontSizeToken(
  min: number,
  preferred: number,
  max: number,
  preferredUnit: 'dvmin',
  remValue: number,
  lineHeight: number
): FontSizeToken {
  return {
    value: { min, preferred, max, preferredUnit },
    remValue,
    lineHeight,
    toTailwind: function() {
      return [
        `clamp(${this.value.min}rem, ${this.value.preferred}dvmin, ${this.value.max}rem)`,
        { lineHeight: String(this.lineHeight) }
      ];
    },
    toCanvas: function(viewportSize = typeof window !== 'undefined' ? Math.min(window.innerWidth, window.innerHeight) : 0) {
      if (typeof window === 'undefined') return this.remValue * 16;
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
      const minPx = this.value.min * rootFontSize;
      const maxPx = this.value.max * rootFontSize;
      const preferredPx = this.value.preferred * vmin;
      return Math.max(minPx, Math.min(preferredPx, maxPx));
    }
  };
}

function createFontFamilyToken(fonts: string[]): FontFamilyToken {
  return {
    value: fonts,
    toTailwind: function() {
      return this.value;
    },
    toCanvas: function() {
      return this.value.join(', ');
    }
  };
}

// Design tokens
export const tokens = {
  colors: {
    primary: createColorToken('221.2 83.2% 53.3%', [59, 130, 246]),
    background: createColorToken('0 0% 100%', [255, 255, 255]),
    foreground: createColorToken('222.2 84% 4.9%', [12, 24, 36]),
    border: createColorToken('214.3 31.8% 91.4%', [226, 232, 240]),
    input: createColorToken('214.3 31.8% 91.4%', [226, 232, 240]),
    ring: createColorToken('221.2 83.2% 53.3%', [59, 130, 246]),
    secondary: createColorToken('210 40% 96.1%', [241, 245, 249]),
    destructive: createColorToken('0 84.2% 60.2%', [239, 68, 68]),
    muted: createColorToken('210 40% 96.1%', [241, 245, 249]),
    accent: createColorToken('210 40% 96.1%', [241, 245, 249]),
    popover: createColorToken('0 0% 100%', [255, 255, 255]),
    card: createColorToken('0 0% 100%', [255, 255, 255])
  },
  spacing: {
    xs: createSpacingToken(0.3, 'dvh'),
    sm: createSpacingToken(0.5, 'dvh'),
    md: createSpacingToken(1, 'dvh'),
    lg: createSpacingToken(1.5, 'dvh'),
    xl: createSpacingToken(2, 'dvh'),
    'w-xs': createSpacingToken(0.3, 'dvw'),
    'w-sm': createSpacingToken(0.5, 'dvw'),
    'w-md': createSpacingToken(1, 'dvw'),
    'w-lg': createSpacingToken(1.5, 'dvw'),
    'w-xl': createSpacingToken(2, 'dvw')
  },
  fontSizes: {
    xs: createFontSizeToken(0.75, 1.1, 1.25, 'dvmin', 0.75, 1.5),
    sm: createFontSizeToken(0.875, 1.3, 1.5, 'dvmin', 0.875, 1.5),
    base: createFontSizeToken(1, 1.5, 1.75, 'dvmin', 1, 1.6),
    lg: createFontSizeToken(1.125, 1.7, 2, 'dvmin', 1.125, 1.6),
    xl: createFontSizeToken(1.25, 1.9, 2.25, 'dvmin', 1.25, 1.5)
  },
  fontFamilies: {
    sans: createFontFamilyToken(['var(--font-sans)', 'system-ui', 'sans-serif']),
    mono: createFontFamilyToken(['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']),
    doto: createFontFamilyToken(['var(--font-doto)', 'system-ui', 'sans-serif'])
  }
} as const;

// Helper functions for different contexts
export function getTokensForTailwind() {
  return {
    colors: Object.entries(tokens.colors).reduce((acc, [key, token]) => {
      acc[key] = token.toTailwind();
      return acc;
    }, {} as Record<string, string>),
    spacing: Object.entries(tokens.spacing).reduce((acc, [key, token]) => {
      acc[key] = token.toTailwind();
      return acc;
    }, {} as Record<string, string>),
    fontSize: Object.entries(tokens.fontSizes).reduce((acc, [key, token]) => {
      acc[key] = token.toTailwind();
      return acc;
    }, {} as Record<string, [string, { lineHeight: string }]>),
    fontFamily: Object.entries(tokens.fontFamilies).reduce((acc, [key, token]) => {
      acc[key] = token.toTailwind();
      return acc;
    }, {} as Record<string, string[]>)
  };
}

export function getCanvasTokens(viewportSize: number) {
  return {
    colors: Object.entries(tokens.colors).reduce((acc, [key, token]) => {
      acc[key] = token.toCanvas();
      return acc;
    }, {} as Record<string, { r: number; g: number; b: number }>),
    spacing: Object.entries(tokens.spacing).reduce((acc, [key, token]) => {
      acc[key] = token.toCanvas(viewportSize);
      return acc;
    }, {} as Record<string, number>),
    fontSize: Object.entries(tokens.fontSizes).reduce((acc, [key, token]) => {
      acc[key] = token.toCanvas(viewportSize);
      return acc;
    }, {} as Record<string, number>),
    fontFamily: Object.entries(tokens.fontFamilies).reduce((acc, [key, token]) => {
      acc[key] = token.toCanvas();
      return acc;
    }, {} as Record<string, string>)
  };
}

// Helper for getting complete Canvas font string
export function getCanvasFont(
  size: keyof typeof tokens.fontSizes,
  family: keyof typeof tokens.fontFamilies = 'sans',
  viewportSize?: number
): string {
  const fontSize = tokens.fontSizes[size].toCanvas(viewportSize);
  const fontFamily = tokens.fontFamilies[family].toCanvas();
  return `${fontSize}px ${fontFamily}`;
}

// Type helpers
export type TokenKeys = {
  [K in keyof typeof tokens]: keyof typeof tokens[K];
};

// Environment info helper
export function getEnvironmentInfo() {
  if (typeof window === 'undefined') {
    return {
      width: 0,
      height: 0,
      minDim: 0,
      baseFontSize: 16
    };
  }
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minDim = Math.min(width, height);
  const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return { width, height, minDim, baseFontSize };
}

export const isBrowser = typeof window !== 'undefined';