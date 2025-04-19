"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// --- Constants ---
const DEFAULT_WORKDAY_HOURS = 8;
const MIN_WORKDAY_HOURS = 1;
const MAX_WORKDAY_HOURS = 24;
const MONOCHROME_STORAGE_KEY = "focuspie-settings-monochromeChart";
const WORKDAY_HOURS_STORAGE_KEY = "focuspie-settings-workdayHours"; // Use a consistent naming scheme

// --- Types ---
interface SettingsContextType {
  workdayHours: number;
  updateWorkdayHours: (hours: number) => void;
  useMonochromeChart: boolean; // Add new setting state
  updateMonochromeChart: (useMonochrome: boolean) => void; // Add updater function
  // Add other settings here later (timer durations, theme)
}

// --- Context Definition ---
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// --- Provider Component ---
export function SettingsProvider({ children }: { children: ReactNode }) {
  // --- State ---
  const [workdayHours, setWorkdayHours] = useState<number>(DEFAULT_WORKDAY_HOURS);
  const [useMonochromeChart, setUseMonochromeChart] = useState<boolean>(false); // Add state for monochrome setting

  // Load settings from localStorage on initial render
  useEffect(() => {
    // Load Workday Hours
    const savedHours = localStorage.getItem(WORKDAY_HOURS_STORAGE_KEY);
    if (savedHours) {
      const parsedHours = parseInt(savedHours, 10);
      if (!isNaN(parsedHours) && parsedHours >= MIN_WORKDAY_HOURS && parsedHours <= MAX_WORKDAY_HOURS) {
        setWorkdayHours(parsedHours);
      } else {
         localStorage.removeItem(WORKDAY_HOURS_STORAGE_KEY); 
      }
    }
    
    // Load Monochrome Setting
    const savedMonochrome = localStorage.getItem(MONOCHROME_STORAGE_KEY);
    // Check for 'true' string explicitly, as any non-empty string is truthy
    if (savedMonochrome === 'true') { 
      setUseMonochromeChart(true);
    } else if (savedMonochrome === 'false') {
        setUseMonochromeChart(false);
        // Optional: Remove item if it's 'false' to keep localStorage cleaner? Or leave it.
    } // If item doesn't exist or has other value, default 'false' is used.

  }, []);

  // Save workdayHours to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(WORKDAY_HOURS_STORAGE_KEY, workdayHours.toString());
  }, [workdayHours]);
  
  // Save useMonochromeChart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(MONOCHROME_STORAGE_KEY, useMonochromeChart.toString());
  }, [useMonochromeChart]);

  // --- Actions ---
  const updateWorkdayHours = (hours: number) => {
    const validatedHours = Math.max(MIN_WORKDAY_HOURS, Math.min(MAX_WORKDAY_HOURS, Math.round(hours)));
    if (!isNaN(validatedHours)) {
       setWorkdayHours(validatedHours);
    } else {
       setWorkdayHours(DEFAULT_WORKDAY_HOURS); 
    }
  };

  // Add updater function for monochrome setting
  const updateMonochromeChart = (useMonochrome: boolean) => {
    setUseMonochromeChart(useMonochrome);
  };

  // --- Context Value ---
  const value = {
    workdayHours,
    updateWorkdayHours,
    useMonochromeChart,       // Add state to value
    updateMonochromeChart,    // Add updater to value
    // Add other settings values/updaters here
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// --- Hook ---
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
} 