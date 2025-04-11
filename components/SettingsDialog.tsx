"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/context/timer-context";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, toggleAutoPause } = useTimer();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your timer and application preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="py-md">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-pause-toggle" className="text-gray-700 dark:text-gray-300">
              Auto-pause timer on tab/window switch
            </Label>
            <Toggle
              id="auto-pause-toggle"
              pressed={settings.autoPauseEnabled}
              onPressedChange={toggleAutoPause}
              aria-label="Toggle auto-pause"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 