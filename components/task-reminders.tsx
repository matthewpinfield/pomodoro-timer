"use client"; // Needs to be client for hooks and client utils

import type { Task } from "@/types/task";
import { motion } from "framer-motion";
import { useSettings } from "@/context/settings-context";
import { useTasks } from "@/context/task-context";
import { getTaskDisplayColor } from "@/lib/utils";

interface TaskRemindersProps {
  tasks: Task[];
}

export function TaskReminders({ tasks }: TaskRemindersProps) {
  const { useMonochromeChart } = useSettings();
  const { setCurrentTaskId } = useTasks();

  if (!tasks || tasks.length === 0) {
    // Use theme color for consistency
    return <p className="text-sm text-center text-muted-foreground">No other tasks for today</p>;
  }

  return (
    // Use theme colors
    <div className="text-sm text-foreground w-full">
      <ul className="space-y-2"> {/* Adjusted spacing */}
        {tasks.map((task, index) => {
          // Calculate display time to show [Worked] / [Goal]
          const formatMins = (m: number) => {
             const hrs = Math.floor(m / 60);
             const mins = Math.floor(m % 60);
             return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
          };
          const timeDisplay = `${formatMins(task.progressMinutes)} / ${formatMins(task.goalTimeMinutes)}`;

          // *** Calculate the display color for this task ***
          const taskColor = getTaskDisplayColor(task, useMonochromeChart);

          return (
            <motion.li
              key={task.id}
              onClick={() => setCurrentTaskId(task.id)}
              className="group flex items-center justify-between p-3.5 rounded-2xl bg-background/50 border border-transparent hover:border-border/50 hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: taskColor }} 
                />
                <span className="font-medium text-sm text-foreground/90 group-hover:text-foreground transition-colors">{task.name}</span>
              </div>
              
              <span className="text-xs font-semibold bg-secondary/80 text-secondary-foreground/90 px-2.5 py-1 rounded-full shadow-sm">
                {timeDisplay}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}