// lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Task } from "@/types/task"; // Ensure path is correct

// EXPORTED - Server Safe
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// EXPORTED - Server Safe
export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// --- Color Calculation Utilities (Client-Side Dependencies) ---

// EXPORTED Helper (Client-Side)
export const getCssVariable = (variableName: string, fallbackColor: string): string => {
  if (typeof window === "undefined") {
    return fallbackColor;
  }
  try {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim();
    return value || fallbackColor;
  } catch (e) {
    // console.error(`Error getting CSS variable ${variableName}:`, e); // Optional log
    return fallbackColor;
  }
};

// EXPORTED Helper (Client-Side context)
export const parseOklch = (
  oklchString: string
): { l: number; c: number; h: number } | null => {
   if (!oklchString || typeof oklchString !== 'string') return null;
   const match = oklchString.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)/);
   if (match && match[1] && match[2] && match[3]) {
       let l = parseFloat(match[1]);
       if (match[1].endsWith("%")) l = l / 100;
       const c = parseFloat(match[2]);
       const h = parseFloat(match[3]);
       if (!isNaN(l) && l >= 0 && l <= 1 && !isNaN(c) && c >= 0 && !isNaN(h)) {
           return { l, c, h };
       }
   }
   // console.warn(`Failed to parse Oklch: ${oklchString}`); // Optional log
   return null;
};

// EXPORTED: Get task display color (uses pre-defined palettes - Client-Side)
export function getTaskDisplayColor(
  task: Task | undefined | null,
  isMonochrome: boolean
): string {
  const standardChartFallbackColor = "oklch(0.8 0.01 90)"; // Neutral gray fallback
  const monoFallbackVariableName = "--mono-1"; // Darkest defined mono color name
  const standardFallbackVariableName = "--chart-1"; // First standard chart color name
  const absoluteFallback = standardChartFallbackColor;

  if (!task || typeof task.chartIndex !== 'number' || task.chartIndex < 1) {
      // console.warn(`getTaskDisplayColor: Invalid task/index.`); // Optional log
      return absoluteFallback;
  }

  const chartIndex = task.chartIndex;
  let colorVariableName: string;
  let fallbackForModeVariableName: string;

  if (isMonochrome) {
      const totalMonoColors = 15; // Your defined number
      const monoIndex = Math.max(1, Math.min(totalMonoColors, (totalMonoColors + 1) - chartIndex));
      colorVariableName = `--mono-${monoIndex}`;
      fallbackForModeVariableName = monoFallbackVariableName;
  } else {
      colorVariableName = `--chart-${chartIndex}`;
      fallbackForModeVariableName = standardFallbackVariableName;
  }

  const specificColor = getCssVariable(colorVariableName, "");
  if (specificColor) return specificColor;

  // console.warn(`getTaskDisplayColor: CSS var ${colorVariableName} not found. Trying fallback ${fallbackForModeVariableName}`); // Optional log
  const modeFallbackColor = getCssVariable(fallbackForModeVariableName, "");
  if (modeFallbackColor) return modeFallbackColor;

  // console.error(`getTaskDisplayColor: Mode fallback CSS var ${fallbackForModeVariableName} also not found! Returning absolute fallback.`); // Optional log
  return absoluteFallback;
}

// NOTE: calculateModeArcColor function is NOT defined here in this state.