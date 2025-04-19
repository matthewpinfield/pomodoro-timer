"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// Button might not be needed unless you add Save/Close explicitly
// import { Button } from "@/components/ui/button";
import { useTimer, type TimerSettings } from "@/context/timer-context"; // RE-ADD useTimer import
import { useSettings } from "@/context/settings-context"; // Import useSettings
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input"; // Import Input
import { Switch } from "@/components/ui/switch"; // Import Switch
import { Button } from "@/components/ui/button"; // Ensure Button is imported
import { useTheme } from "next-themes"; // Import the useTheme hook
import { Sun, Moon, PauseCircle, Palette, RotateCcw } from "lucide-react"; // Re-import icons
import * as React from "react"; // Import React itself
import { useRef, useEffect } from "react"; // Import useRef and useEffect

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  // Get settings and the new update function from useTimer
  const { settings: timerSettings, toggleAutoPause, updateTimerSetting } = useTimer(); 
  const { theme, setTheme } = useTheme();
  // Get the new monochrome setting and its updater
  const { workdayHours, updateWorkdayHours, useMonochromeChart, updateMonochromeChart } = useSettings();
  const contentRef = useRef<HTMLDivElement>(null); // Ref for DialogContent

  // Handler for duration inputs
  const handleDurationChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    // Ensure key is one of the allowed string keys
    key: Extract<keyof TimerSettings, 'pomodoro' | 'shortBreak' | 'longBreak' | 'pomodorosUntilLongBreak'>
  ) => {
    const value = parseInt(event.target.value, 10);
    // Ensure value is at least 1 before updating
    if (!isNaN(value) && value >= 1) {
      // Now TypeScript knows `key` is one of the specific strings
      updateTimerSetting(key, value);
    }
  };

  const handleWorkdayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    updateWorkdayHours(isNaN(value) ? 0 : value);
  };

  const handleResetWelcome = () => {
    localStorage.removeItem("focuspie-welcome-seen");
    // Optional: Add a notification/toast here to confirm reset
    alert("Welcome screen has been reset. It will show on the next page load."); 
  };

  // Effect to focus the dialog content instead of the first input when opened
  useEffect(() => {
    if (open) {
      // Use a short timeout to ensure the element is focusable after mounting/rendering
      const timer = setTimeout(() => {
        contentRef.current?.focus();
        // console.log("SETTINGS_DIALOG: Focusing dialog content."); // Optional debug log
      }, 50); // 50ms delay should be sufficient

      return () => clearTimeout(timer); // Cleanup timeout on close or re-render
    }
  }, [open]); // Run effect when 'open' state changes

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        ref={contentRef} 
        tabIndex={-1} // Make the content programmatically focusable
        className="sm:max-w-md border shadow-md"
      >
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your timer and application preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6"> {/* Increased spacing */}
          {/* --- Pomodoro Duration Setting --- */}
          <div className="flex items-center justify-between">
            <Label htmlFor="pomodoro-duration-input" className="text-foreground">
              Pomodoro Duration (min)
            </Label>
            <Input
              id="pomodoro-duration-input"
              type="number"
              min="1"
              max="120" // Example max
              step="1"
              // Display value in minutes
              value={timerSettings.pomodoro / 60}
              onChange={(e) => handleDurationChange(e, 'pomodoro')}
              className="w-20"
              aria-label="Pomodoro duration in minutes"
            />
          </div>

          {/* --- Short Break Duration Setting --- */}
          <div className="flex items-center justify-between">
            <Label htmlFor="short-break-duration-input" className="text-foreground">
              Short Break Duration (min)
            </Label>
            <Input
              id="short-break-duration-input"
              type="number"
              min="1"
              max="60" // Example max
              step="1"
              // Display value in minutes
              value={timerSettings.shortBreak / 60}
              onChange={(e) => handleDurationChange(e, 'shortBreak')}
              className="w-20"
              aria-label="Short break duration in minutes"
            />
          </div>

          {/* --- Long Break Duration Setting --- */}
          <div className="flex items-center justify-between">
            <Label htmlFor="long-break-duration-input" className="text-foreground">
              Long Break Duration (min)
            </Label>
            <Input
              id="long-break-duration-input"
              type="number"
              min="1"
              max="90" // Example max
              step="1"
              // Display value in minutes
              value={timerSettings.longBreak / 60}
              onChange={(e) => handleDurationChange(e, 'longBreak')}
              className="w-20"
              aria-label="Long break duration in minutes"
            />
          </div>
          
           {/* --- Workday Hours Setting --- */}
          <div className="flex items-center justify-between">
            <Label htmlFor="workday-hours-input" className="text-foreground">
              Workday Duration (hours)
            </Label>
            <Input
              id="workday-hours-input"
              type="number"
              min="1" 
              max="24"
              step="1"
              value={workdayHours}
              onChange={handleWorkdayChange}
              className="w-20"
              aria-label="Workday duration in hours"
            />
          </div>

          {/* --- Auto-pause setting --- */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 pr-4">
              <Label htmlFor="auto-pause-switch" className="text-foreground cursor-pointer">
                Pause timer when app is backgrounded
              </Label>
              <p className="text-xs text-muted-foreground">Pauses if you switch tabs/apps.</p>
            </div>
            <div className="flex items-center gap-2">
              <PauseCircle className="w-icon-sm h-icon-sm text-muted-foreground opacity-75" />
              <Switch
                id="auto-pause-switch"
                checked={timerSettings.autoPauseEnabled}
                onCheckedChange={(checked) => {
                  console.log(`SETTINGS_DIALOG: Auto-pause switch clicked. New checked state should be: ${checked}`);
                  toggleAutoPause();
                }}
                aria-label="Toggle auto-pause when app is backgrounded"
              />
            </div>
          </div>

          {/* --- Monochrome Chart Setting --- */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 pr-4">
              <Label htmlFor="monochrome-chart-switch" className="text-foreground cursor-pointer">
                Use Monochrome Pie Chart
              </Label>
              <p className="text-xs text-muted-foreground">Uses shades of the primary theme color.</p>
            </div>
            <div className="flex items-center gap-2">
              <Palette className="w-icon-sm h-icon-sm text-muted-foreground opacity-75" />
              <Switch
                id="monochrome-chart-switch"
                checked={useMonochromeChart}
                onCheckedChange={(checked) => {
                  console.log(`SETTINGS_DIALOG: Monochrome switch clicked. New checked state should be: ${checked}`);
                  updateMonochromeChart(checked);
                }}
                aria-label="Toggle monochrome pie chart colors"
              />
            </div>
          </div>

          {/* --- Theme Setting --- */}
          <div className="flex items-center justify-between">
            <Label className="text-foreground">
              Appearance Theme
            </Label>
            <div className="flex gap-1"> {/* Container for buttons */}
              <Button
                variant={theme === 'light' ? 'secondary' : 'outline'} // Highlight if active
                size="icon"
                onClick={() => setTheme('light')}
                aria-label="Set light theme"
              >
                <Sun className="h-4 w-4" />
              </Button>
              <Button
                variant={theme === 'dark' ? 'secondary' : 'outline'} // Highlight if active
                size="icon"
                onClick={() => setTheme('dark')}
                aria-label="Set dark theme"
              >
                <Moon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* --- Reset Welcome Screen --- */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-1 pr-4">
              <Label className="text-foreground">
                Show Welcome Screen Again
              </Label>
              <p className="text-xs text-muted-foreground">Resets the welcome dialog so it appears on next load.</p>
            </div>
            <Button 
              variant="outline"
              size="icon"
              onClick={handleResetWelcome}
              aria-label="Reset and show welcome screen on next load"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

        </div>
        {/* Default DialogFooter is often removed when content has its own controls */}
        {/* <DialogFooter> ... </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}