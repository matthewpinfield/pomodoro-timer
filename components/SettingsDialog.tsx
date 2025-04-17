"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// Button might not be needed unless you add Save/Close explicitly
// import { Button } from "@/components/ui/button";
import { useTimer } from "@/context/timer-context";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"; // Import ToggleGroup components
import { useTheme } from "next-themes"; // Import the useTheme hook
import { Sun, Moon, Laptop } from "lucide-react"; // Import icons for theme buttons

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, toggleAutoPause } = useTimer(); // Existing timer settings
  const { theme, setTheme } = useTheme(); // Get theme state and setter function

  // Handle potential undefined theme during initial load or if 'system' resolves
  // The ToggleGroup value expects a string, 'system' is valid.
  const currentThemeValue = theme || 'system';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your timer and application preferences.
          </DialogDescription>
        </DialogHeader>
        {/* Container for settings rows - Added space-y for vertical spacing */}
        <div className="py-md space-y-md">
          {/* --- Existing Auto-pause setting --- */}
          <div className="flex items-center justify-between">
            {/* Use text-foreground for theme-aware text color */}
            <Label htmlFor="auto-pause-toggle" className="text-foreground">
              Auto-pause timer on tab/window switch
            </Label>
            <Toggle
              id="auto-pause-toggle"
              pressed={settings.autoPauseEnabled}
              onPressedChange={toggleAutoPause}
              aria-label="Toggle auto-pause"
            />
          </div>

          {/* --- New Theme Setting --- */}
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle-group" className="text-foreground">
              Appearance Theme
            </Label>
            <ToggleGroup
              id="theme-toggle-group"
              type="single" // Ensures only one item can be selected
              value={currentThemeValue} // Set the currently selected value
              onValueChange={(value) => {
                // When a new value is selected, update the theme
                // Check if value is truthy because clicking the selected item
                // might trigger change with an empty value depending on ToggleGroup config
                if (value) {
                  setTheme(value);
                }
              }}
              aria-label="Select theme"
              className="gap-1" // Optional: Adjust spacing between items
            >
              <ToggleGroupItem value="light" aria-label="Light theme">
                <Sun className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Dark theme">
                <Moon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="system" aria-label="System theme">
                <Laptop className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        {/* Default DialogFooter is often removed when content has its own controls */}
        {/* <DialogFooter> ... </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}