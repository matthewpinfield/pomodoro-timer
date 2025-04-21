"use client"; // Needs to be client for hooks and client utils

import type { Task } from "@/types/task";
import { motion } from "framer-motion";
import { useSettings } from "@/context/settings-context"; // Import useSettings
import { getTaskDisplayColor } from "@/lib/utils"; // Import color utility
import { List } from "lucide-react"; // Optional: Import icon for header

interface TaskRemindersProps {
  tasks: Task[];
}

export function TaskReminders({ tasks }: TaskRemindersProps) {
  // Get the monochrome setting
  const { useMonochromeChart } = useSettings();

  if (!tasks || tasks.length === 0) {
    // Use theme color for consistency
    return <p className="text-sm text-center text-muted-foreground">No other tasks for today</p>;
  }

  return (
    // Use theme colors
    <div className="text-sm text-foreground w-full">
      {/* Optional: Add a header like before */}
      <h3 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-2">
        <List className="w-4 h-4" /> {/* Example icon */}
        Today's other tasks:
      </h3>
      <ul className="space-y-2"> {/* Adjusted spacing */}
        {tasks.map((task, index) => {
          // Calculate display time (your existing logic is fine)
          const timeLeft = Math.max(0, task.goalTimeMinutes - task.progressMinutes);
          const hours = Math.floor(timeLeft / 60);
          const minutes = timeLeft % 60;
          const timeDisplay = `${hours > 0 ? `${hours}h ` : ""}${minutes}m`;

          // *** Calculate the display color for this task ***
          const taskColor = getTaskDisplayColor(task, useMonochromeChart);

          return (
            <motion.li
              key={task.id}
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-2"> {/* Added gap */}
                {/* Use a span for the dot and apply calculated color */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0" // Adjusted size, added flex-shrink-0
                  style={{ backgroundColor: taskColor }} // Use calculated color
                />
                {/* REMOVED task.color reference */}
                <span>{task.name}</span>
              </div>
              {/* Use theme colors for time badge */}
              <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-sm">
                {timeDisplay}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}