"use client";

import { useTimer } from "@/context/timer-context";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button"; // Import Button
import { ArrowLeft } from "lucide-react"; // Import ArrowLeft
import { useRouter } from "next/navigation"; // Import useRouter
import { motion } from "framer-motion"; // Import motion

export default function SettingsPage() {
  const { settings, toggleAutoPause } = useTimer();
  const router = useRouter(); // Initialize router

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 flex justify-start" // Align back button to start
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()} // Go back to previous page
          className="flex items-center text-gray-500 dark:text-gray-400"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </motion.header>

      <motion.main
        className="flex-1 max-w-md mx-auto w-full px-4 flex flex-col items-start pt-8" // Align content start
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Settings</h1>

        <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
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
          {/* Future settings can go here, e.g.:
          <div className="flex items-center justify-between">
            <Label htmlFor="pomodoro-duration">Pomodoro Duration (min)</Label>
            <Input id="pomodoro-duration" type="number" value={settings.pomodoro / 60} className="w-20" />
          </div>
          */}
        </div>
      </motion.main>
    </div>
  );
}
