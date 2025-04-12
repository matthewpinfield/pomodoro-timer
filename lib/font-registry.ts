/**
 * Font Registry for FocusPie
 * Integrates with Shadcn UI's font system
 */

import type { NextFont } from 'next/dist/compiled/@next/font';
import { tokens } from './design-tokens';

// Extended NextFont type that includes the variable property
interface ExtendedNextFont extends NextFont {
  variable: string;
}

// Type for font configuration
type FontConfig = {
  sans: ExtendedNextFont;
  mono: ExtendedNextFont;
  doto: ExtendedNextFont;
};

// Global registry to store font information
let registeredFonts: FontConfig | null = null;

// Add TypeScript global declaration for our font registry
declare global {
  interface Window {
    __FOCUSPIE_FONTS: Record<string, {
      variable: string;
      family: string;
      loaded: boolean;
    }>;
  }
}

/**
 * Register Next.js font objects with the design token system
 * This makes font information available for both CSS and Canvas contexts
 */
export function registerFonts(fonts: FontConfig): void {
  console.log('[FontRegistry] registerFonts called');
  registeredFonts = fonts;
  
  // If we're running in a browser environment, register a font loading handler
  if (typeof window !== 'undefined') {
    // Create a registry of loaded fonts for Canvas usage
    window.__FOCUSPIE_FONTS = window.__FOCUSPIE_FONTS || {};
    
    // Register Shadcn UI fonts
    Object.entries(fonts).forEach(([name, fontObj]) => {
      // Store the font information for global access
      window.__FOCUSPIE_FONTS[name] = {
        variable: fontObj.variable,
        family: name,
        loaded: document.fonts ? false : true // Default to true if document.fonts API isn't available
      };
    });
    
    // If the browser supports the Font Loading API, monitor font loading status
    if (document.fonts) {
      document.fonts.ready.then(() => {
        console.log('[FontRegistry] document.fonts.ready resolved');
        // Mark all fonts as loaded once the document fonts are ready
        Object.keys(window.__FOCUSPIE_FONTS).forEach(fontName => {
          if (window.__FOCUSPIE_FONTS[fontName]) {
            window.__FOCUSPIE_FONTS[fontName].loaded = true;
          }
        });
        
        console.log('[FontRegistry] Dispatching fontsloaded event');
        // Dispatch an event so Canvas elements can redraw with the loaded fonts
        window.dispatchEvent(new CustomEvent('fontsloaded'));
      });
    }
  }
}

/**
 * Get information about registered fonts
 * @returns The registered font configuration or null if not registered
 */
export function getRegisteredFonts(): FontConfig | null {
  return registeredFonts;
}

/**
 * Check if a specific font has been loaded
 * @param fontName The name of the font to check
 * @returns True if the font is loaded, false otherwise
 */
export function isFontLoaded(fontName: keyof typeof tokens.fontFamilies): boolean {
  if (typeof window === 'undefined') return false;
  
  const isLoaded = window.__FOCUSPIE_FONTS?.[fontName]?.loaded || false;
  console.log(`[FontRegistry] isFontLoaded('${fontName}') -> ${isLoaded}`);
  return isLoaded;
}

/**
 * Get a font's CSS variable
 * @param fontName The name of the font
 * @returns The CSS variable name or empty string if not found
 */
export function getFontVariable(fontName: keyof typeof tokens.fontFamilies): string {
  if (typeof window === 'undefined') return '';
  
  return window.__FOCUSPIE_FONTS?.[fontName]?.variable || '';
}

// Export default for convenience
export default { registerFonts, getRegisteredFonts, isFontLoaded, getFontVariable }; 