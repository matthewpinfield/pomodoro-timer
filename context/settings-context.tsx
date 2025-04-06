"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Define types for our settings
interface Settings {
  // Timer settings
  workDuration: number // minutes
  shortBreakDuration: number // minutes
  longBreakDuration: number // minutes
  cyclesBeforeLongBreak: number
  
  // General settings
  workdayHours: number
  enableNotifications: boolean
  theme: "light" | "dark" | "system"
}

// Default settings values
const defaultSettings: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  workdayHours: 8,
  enableNotifications: true,
  theme: "light"
}

// Define context type including settings and update functions
interface SettingsContextType {
  settings: Settings
  updateSettings: (newSettings: Partial<Settings>) => void
  resetSettings: () => void
}

// Create context
const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

// Provider component that wraps the app
export function SettingsProvider({ children }: { children: ReactNode }) {
  // State to hold our settings
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [isClient, setIsClient] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    try {
      const savedSettings = localStorage.getItem("focuspie-settings")
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings))
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error)
      // Use default settings if loading fails
    }
  }, [])

  // Update settings (partial update)
  const updateSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    // Only save to localStorage on client
    if (isClient) {
      try {
        localStorage.setItem("focuspie-settings", JSON.stringify(updatedSettings))
      } catch (error) {
        console.error("Failed to save settings to localStorage:", error)
      }
    }
  }
  
  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings)
    
    // Only save to localStorage on client
    if (isClient) {
      try {
        localStorage.setItem("focuspie-settings", JSON.stringify(defaultSettings))
      } catch (error) {
        console.error("Failed to save settings to localStorage:", error)
      }
    }
  }

  // Create context value
  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}

// Custom hook to use settings
export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
} 