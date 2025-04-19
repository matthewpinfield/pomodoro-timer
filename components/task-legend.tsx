"use client"

import type { Task } from "@/types/task"
import { Check, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

// Helper function to get CSS variable value
const getCssVariable = (variableName: string): string => {
  if (typeof window === "undefined") return "#808080";
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || "#808080";
};

// Update the TaskLegendProps interface to include an onTaskClick handler
interface TaskLegendProps {
  tasks: Task[]
  workdayHours?: number
  onTaskClick?: (taskId: string) => void
}

// Update the function signature to include the new prop with a default empty function
export function TaskLegend({ tasks, workdayHours = 8, onTaskClick = () => {} }: TaskLegendProps) {
  // Calculate total task time
  const totalTaskMinutes = tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0)
  const workdayMinutes = workdayHours * 60
  const remainingMinutes = Math.max(0, workdayMinutes - totalTaskMinutes)

  // State to store computed colors
  const [computedColors, setComputedColors] = useState<{ [key: number]: string }>({});
  const [secondaryColor, setSecondaryColor] = useState('#f1f5f9'); // Default fallback

  // Effect to compute colors
  useEffect(() => {
    const newComputedColors: { [key: number]: string } = {};
    tasks.forEach(task => {
      if (task.chartIndex) {
        newComputedColors[task.chartIndex] = getCssVariable(`--chart-${task.chartIndex}`);
      }
    });
    setComputedColors(newComputedColors);
    setSecondaryColor(getCssVariable('--secondary')); // Get secondary color
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4 bg-card/80 backdrop-blur-sm rounded-xl shadow-sm border">
        <Clock className="w-icon-base h-icon-base mx-auto mb-sm text-muted-foreground/80" />
        <p>No tasks yet. Add tasks to see them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 bg-card/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border">
      <h3 className="font-medium text-foreground mb-sm">Task Overview</h3>
      {tasks.map((task, index) => {
        const isCompleted = task.progressMinutes >= task.goalTimeMinutes
        const progressText = isCompleted ? "Goal Achieved!" : "Progress"
        const progressHours = Math.floor(task.progressMinutes / 60)
        const progressMinutes = task.progressMinutes % 60
        const goalHours = Math.floor(task.goalTimeMinutes / 60)
        const goalMinutes = task.goalTimeMinutes % 60

        return (
          <motion.div
            key={task.id}
            className="flex items-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ x: 5 }}
            onClick={() => onTaskClick(task.id)}
          >
            <div
              className="w-icon-sm h-icon-sm rounded-full mr-md flex-shrink-0 shadow-sm"
              style={{ backgroundColor: computedColors[task.chartIndex] || '#cccccc' }}
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium text-foreground">{task.name}</span>
                {isCompleted && (
                  <div className="ml-sm bg-green-100 text-green-600 rounded-full p-xs">
                    <Check className="w-icon-xs h-icon-xs" />
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground flex flex-wrap items-center">
                <span className="mr-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs">
                  {goalHours > 0 ? `${goalHours}h ` : ""}
                  {goalMinutes}m
                </span>
                <span className="text-xs">
                  {progressText}: {progressHours > 0 ? `${progressHours}h ` : ""}
                  {progressMinutes}m / {goalHours > 0 ? `${goalHours}h ` : ""}
                  {goalMinutes}m
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Show remaining time if tasks don't fill the workday */}
      {remainingMinutes > 0 && (
        <motion.div
          className="flex items-center p-2 mt-2 border-t pt-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: tasks.length * 0.1 }}
        >
          <div 
            className="w-icon-sm h-icon-sm rounded-full mr-md flex-shrink-0"
            style={{ backgroundColor: secondaryColor }} 
          />
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium text-muted-foreground">Unallocated Time</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.floor(remainingMinutes / 60)}h {remainingMinutes % 60}m remaining in your {workdayHours}h day
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

