/**
 * Canvas Utilities for FocusPie
 *
 * This module provides helper functions for canvas operations
 * that integrate with our design token system.
 */

// CORRECTED Import: getEnvironmentInfo instead of getViewportSize
import { tokens, getEnvironmentInfo, isBrowser } from './design-tokens';
import { isFontLoaded, getFontVariable } from './font-registry';
import type { ColorToken, FontSizeToken, FontFamilyToken, SpacingToken } from './design-tokens';

// Consistent font size in pixels used ONLY for font loading detection logic.
// This value doesn't affect visual rendering or responsiveness.
const FONT_DETECTION_SIZE_PX = 16;

// Configuration for font sizes
const fontSizeConfig: Record<keyof typeof tokens.fontSizes, { min: number; preferred: number; max: number; unit: string }> = {
  xs: { min: 0.75, preferred: 1.1, max: 1.25, unit: 'dvmin' },
  sm: { min: 0.875, preferred: 1.3, max: 1.5, unit: 'dvmin' },
  base: { min: 1, preferred: 1.5, max: 1.75, unit: 'dvmin' },
  lg: { min: 1.125, preferred: 1.7, max: 2, unit: 'dvmin' },
  xl: { min: 1.25, preferred: 1.9, max: 2.25, unit: 'dvmin' }
};

// Types for canvas context with additional properties
export interface ExtendedCanvasRenderingContext2D extends CanvasRenderingContext2D {
  // Store the relevant environment info for token calculations
  _tokenEnvInfo?: { width: number; height: number; minDim: number; baseFontSize: number };
  _fontLoaded?: Record<string, boolean>; // DEPRECATED? Font loading state is now global
  _fontLoadAttempted?: Record<string, boolean>; // Track font loading attempts per context?
}

// Font loading states (Unchanged)
export enum FontLoadState {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  FAILED = 'failed'
}

// Global font loading state tracking (Unchanged)
const fontLoadingState: Record<string, FontLoadState> = {};
const fontLoadCallbacks: Record<string, Array<() => void>> = {};
const FONT_LOAD_TIMEOUT = 3000;

// initFontLoadingSystem (Unchanged)
export function initFontLoadingSystem(): void {
  if (!isBrowser) return;
  window.addEventListener('fontsloaded', () => {
    Object.keys(fontLoadCallbacks).forEach(fontKey => {
      const callbacks = fontLoadCallbacks[fontKey] || [];
      callbacks.forEach(callback => callback());
      fontLoadingState[fontKey] = FontLoadState.LOADED;
    });
    Object.keys(fontLoadCallbacks).forEach(key => { fontLoadCallbacks[key] = []; });
  });
}
initFontLoadingSystem();

// preloadCanvasFont (Unchanged logic, but ensure fontToken access is correct)
export function preloadCanvasFont(
  fontKey: keyof typeof tokens.fontFamilies,
  callback?: () => void
): Promise<boolean> {
  if (!isBrowser) return Promise.resolve(false);
  
  return new Promise(resolve => {
    const fontToken = tokens.fontFamilies[fontKey];
    if (!fontToken) { fontLoadingState[fontKey] = FontLoadState.FAILED; resolve(false); return; }

    if (isFontLoaded(fontKey)) {
      if (callback) callback();
      resolve(true);
      return;
    }

    // Font Face Observer pattern
    const fontFaceObserver = () => {
      const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(false); return; }

      const fallbackFont = 'monospace';
      const testFont = `${fontToken.toCanvas()}`;

      ctx.font = `${FONT_DETECTION_SIZE_PX}px ${fallbackFont}`;
      const fallbackWidth = ctx.measureText(text).width;
      ctx.font = `${FONT_DETECTION_SIZE_PX}px ${testFont}`;
      const testWidth = ctx.measureText(text).width;

      if (fallbackWidth !== testWidth) {
        fontLoadingState[fontKey] = FontLoadState.LOADED;
        if (callback) callback();
        resolve(true);
      } else {
        setTimeout(fontFaceObserver, 50);
      }
    };
    fontFaceObserver();
  });
}

// getCanvasFontLoadState (Unchanged)
export function getCanvasFontLoadState(fontKey: keyof typeof tokens.fontFamilies): FontLoadState {
  if (!isBrowser) return FontLoadState.UNLOADED;
  return fontLoadingState[fontKey] || FontLoadState.UNLOADED;
}

// preloadAllCanvasFonts (Unchanged)
export function preloadAllCanvasFonts(callback?: () => void): Promise<boolean[]> {
  const fontKeys = Object.keys(tokens.fontFamilies) as Array<keyof typeof tokens.fontFamilies>;
  const promises = fontKeys.map(key => preloadCanvasFont(key));
  Promise.all(promises).then(() => { if (callback) callback(); });
  return Promise.all(promises);
}

// getBestCanvasFont (Ensure fontToken access is correct)
export function getBestCanvasFont(
  ctx: ExtendedCanvasRenderingContext2D,
  fontKey: keyof typeof tokens.fontFamilies,
  attemptLoad = true
): string {
  ctx._fontLoadAttempted = ctx._fontLoadAttempted || {};
  const firstAttempt = !ctx._fontLoadAttempted[fontKey];
  ctx._fontLoadAttempted[fontKey] = true;

  const loadState = getCanvasFontLoadState(fontKey);
  const fontToken = tokens.fontFamilies[fontKey];
  if (!fontToken) return 'system-ui, sans-serif';

  if (loadState === FontLoadState.LOADED) {
    return fontToken.toCanvas();
  }

  if (loadState === FontLoadState.FAILED) {
    return 'system-ui, sans-serif';
  }

  if (firstAttempt && attemptLoad) {
    preloadCanvasFont(fontKey, () => {
      if (ctx.canvas) {
        ctx.canvas.dispatchEvent(new CustomEvent('fontloaded', { detail: { fontKey } }));
      }
    });
  }
  return 'system-ui, sans-serif';
}

// applyTokenFont (MODIFIED - uses getEnvironmentInfo)
export function applyTokenFont(
  ctx: ExtendedCanvasRenderingContext2D,
  sizeKey: keyof typeof tokens.fontSizes,
  fontKey: keyof typeof tokens.fontFamilies = 'sans'
): void {
  const fontSize = tokens.fontSizes[sizeKey].toCanvas();
  const fontFamily = getBestCanvasFont(ctx, fontKey);
  ctx.font = `${fontSize}px ${fontFamily}`;
}

// isFontAvailable (Unchanged)
export function isFontAvailable(fontFamily: string): boolean {
  if (!isBrowser) return false;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  const text = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const fallbackFont = 'monospace';
  const testFont = `"${fontFamily}", ${fallbackFont}`; // Ensure family is quoted
  ctx.font = `${FONT_DETECTION_SIZE_PX}px ${fallbackFont}`;
  const fallbackWidth = ctx.measureText(text).width;
  ctx.font = `${FONT_DETECTION_SIZE_PX}px ${testFont}`;
  const testWidth = ctx.measureText(text).width;
  return fallbackWidth !== testWidth;
}

// getFallbackFont (Ensure fontToken access is correct)
export function getFallbackFont(
  ctx: ExtendedCanvasRenderingContext2D,
  fontKey: keyof typeof tokens.fontFamilies
): string {
  const fontToken = tokens.fontFamilies[fontKey];
  if (!fontToken) return 'system-ui, sans-serif';
  return fontToken.toCanvas();
}

// initializeCanvas (MODIFIED - uses getEnvironmentInfo)
export function initializeCanvas(
  canvas: HTMLCanvasElement,
  width?: number,
  height?: number,
  preloadFonts: boolean = true
): ExtendedCanvasRenderingContext2D | null {
  if (!canvas) return null;
  const ctx = canvas.getContext('2d') as ExtendedCanvasRenderingContext2D | null;
  if (!ctx) return null;

  const dpr = isBrowser ? window.devicePixelRatio || 1 : 1;
  const rect = canvas.getBoundingClientRect();
  const cssWidth = width || rect.width;
  const cssHeight = height || rect.height;

  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  // Store environment info for token calculations
  ctx._tokenEnvInfo = getEnvironmentInfo(); // Store the whole object
  ctx._fontLoadAttempted = {}; // Reset attempted fonts

  // Font loading setup (unchanged)
  if (isBrowser && preloadFonts) {
    if (!canvas.hasAttribute('data-font-listener')) {
      canvas.setAttribute('data-font-listener', 'true');
      canvas.addEventListener('fontloaded', () => {
        canvas.dispatchEvent(new CustomEvent('redraw'));
      });
      preloadAllCanvasFonts();
    }
  }

  return ctx;
}

// redrawCanvas (Unchanged logic, relies on initializeCanvas)
export function redrawCanvas(
  canvas: HTMLCanvasElement,
  drawFunction: (ctx: ExtendedCanvasRenderingContext2D) => void
): void {
  const ctx = initializeCanvas(canvas);
  if (!ctx) return;
  // Clear based on CSS pixels
  const cssWidth = canvas.width / (window.devicePixelRatio || 1);
  const cssHeight = canvas.height / (window.devicePixelRatio || 1);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  drawFunction(ctx);
}

// getContextEnvironmentInfo (NEW HELPER FUNCTION)
// Gets env info stored on context or calculates it
function getContextEnvironmentInfo(ctx: ExtendedCanvasRenderingContext2D): { width: number; height: number; minDim: number; baseFontSize: number } {
  if (ctx._tokenEnvInfo) {
    return ctx._tokenEnvInfo;
  }
  // Calculate and store if not present
  const envInfo = getEnvironmentInfo();
  ctx._tokenEnvInfo = envInfo;
  return envInfo;
}

// =====================================
// Color Utilities (Unchanged)
// =====================================
export function applyTokenColor(
  ctx: ExtendedCanvasRenderingContext2D,
  colorKey: keyof typeof tokens.colors,
  alpha = 1
): void {
  const color = tokens.colors[colorKey].toCanvas();
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

export function applyTokenStroke(
  ctx: ExtendedCanvasRenderingContext2D,
  colorKey: keyof typeof tokens.colors,
  alpha = 1
): void {
  const color = tokens.colors[colorKey].toCanvas();
  ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

export function createTokenGradient(
  ctx: ExtendedCanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  colorStops: Array<{ color: keyof typeof tokens.colors; position: number; alpha?: number }>
): CanvasGradient {
  const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
  colorStops.forEach(({ color, position, alpha = 1 }) => {
    const c = tokens.colors[color].toCanvas();
    gradient.addColorStop(position, `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`);
  });
  return gradient;
}

// =====================================
// Typography Utilities (MODIFIED - measureText, drawText)
// =====================================
export function drawText(
  ctx: ExtendedCanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  options: { /* ... options type unchanged ... */
    fontKey?: keyof typeof tokens.fontFamilies;
    sizeKey?: keyof typeof tokens.fontSizes;
    colorKey?: keyof typeof tokens.colors;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    alpha?: number;
    maxWidth?: number;
  } = {}
): void {
  const { /* ... destructuring unchanged ... */
    fontKey = 'sans',
    sizeKey = 'base',
    colorKey = 'foreground',
    align = 'center',
    baseline = 'middle',
    alpha = 1,
    maxWidth,
  } = options;

  // Apply text styling (uses the updated applyTokenFont)
  applyTokenFont(ctx, sizeKey, fontKey);
  applyTokenColor(ctx, colorKey, alpha);

  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  if (maxWidth !== undefined) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
}

// measureText (MODIFIED - uses updated applyTokenFont)
export function measureText(
  ctx: ExtendedCanvasRenderingContext2D,
  text: string,
  sizeKey: keyof typeof tokens.fontSizes,
  fontKey: keyof typeof tokens.fontFamilies = 'sans'
): TextMetrics {
  // Apply the font first to ensure context has correct size and family
  applyTokenFont(ctx, sizeKey, fontKey);
  return ctx.measureText(text);
}

// =====================================
// Shape Utilities (MODIFIED - drawRoundedRect)
// =====================================
export function drawRoundedRect(
  ctx: ExtendedCanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  radius = 4, // Use pixel value instead of token
  fill = true, stroke = false
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// drawCircle (Unchanged)
export function drawCircle( /* ... */ ) { /* ... */ }

// drawArc (Unchanged)
export function drawArc( /* ... */ ) { /* ... */ }

// drawTimerTrack (Unchanged logic, color usage is fine)
export function drawTimerTrack( /* ... */ ) { /* ... */ }

// applyShadow (Unchanged logic, color usage is fine)
export function applyShadow( /* ... */ ) { /* ... */ }

// clearShadow (Unchanged)
export function clearShadow(ctx: ExtendedCanvasRenderingContext2D): void { /* ... */ }

// =====================================
// Responsive Layout Utilities (MODIFIED - getTokenSpacing, setResponsiveLineWidth)
// =====================================

// getTokenSpacing (MODIFIED - uses baseFontSize)
export function getTokenSpacing(
  ctx: ExtendedCanvasRenderingContext2D,
  spacingKey: keyof typeof tokens.spacing
): number {
  const envInfo = getContextEnvironmentInfo(ctx);
  return tokens.spacing[spacingKey].toCanvas(envInfo.minDim);
}

// setResponsiveLineWidth (MODIFIED - uses minDim from envInfo)
export function setResponsiveLineWidth(
  ctx: ExtendedCanvasRenderingContext2D,
  width: number,
  minWidth = 1,
  maxWidth = 10
): void {
  const envInfo = getContextEnvironmentInfo(ctx);
  // Scale based on minDim for consistency with dvmin logic
  const scaleFactor = Math.max(0.5, Math.min(envInfo.minDim / 1000, 1.5)); // Example scaling
  const scaledWidth = width * scaleFactor;
  ctx.lineWidth = Math.max(minWidth, Math.min(scaledWidth, maxWidth));
}

// =====================================
// Helper Utilities (MODIFIED - registerCanvasResizeHandler)
// =====================================

// preloadImages (Unchanged)
export function preloadImages( /* ... */ ) { /* ... */ }

// registerCanvasResizeHandler (MODIFIED - updates envInfo on context)
export function registerCanvasResizeHandler(
  canvas: HTMLCanvasElement,
  drawFunction: (ctx: ExtendedCanvasRenderingContext2D) => void,
  debounceTime = 250
): () => void {
  if (!isBrowser) return () => {};
  let debounceTimeout: number | null = null;

  const handleResize = () => {
    if (debounceTimeout) window.clearTimeout(debounceTimeout);
    debounceTimeout = window.setTimeout(() => {
      // Re-initialize canvas (which recalculates DPR, scale, etc.)
      const ctx = initializeCanvas(canvas);
      if (ctx) {
        // Re-calculate and store the *new* environment info
        ctx._tokenEnvInfo = getEnvironmentInfo(); // Update stored info
        // Clear based on CSS pixels
        const cssWidth = canvas.width / (window.devicePixelRatio || 1);
        const cssHeight = canvas.height / (window.devicePixelRatio || 1);
        ctx.clearRect(0, 0, cssWidth, cssHeight);
        // Redraw
        drawFunction(ctx);
      }
    }, debounceTime);
  };

  window.addEventListener('resize', handleResize);
  return () => { /* ... remove listener ... */ };
}

// addCanvasEventListener (Unchanged logic, coordinate translation is fine)
export function addCanvasEventListener( /* ... */ ) { /* ... */ }

// Export a singleton instance (Unchanged)
export const CanvasUtils = { /* ... */ };
export default CanvasUtils;

/**
 * Converts Tailwind's responsive font size to Canvas-compatible pixels
 * @param {string} tailwindSize - The tailwind font size key (e.g., 'sm')
 * @returns {number} - Calculated pixel value
 */
function calculateTailwindFontSizeInPixels(tailwindSize: keyof typeof tokens.fontSizes): number {
  const config = fontSizeConfig[tailwindSize];
  if (!config) return 16;
  
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
  
  const minPx = config.min * rootFontSize;
  const maxPx = config.max * rootFontSize;
  const preferredPx = config.preferred * vmin;
  
  return Math.max(minPx, Math.min(preferredPx, maxPx));
}
