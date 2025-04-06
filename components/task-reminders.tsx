"use client"

import type { Task } from "@/types/task"
import { motion } from "framer-motion"

interface TaskRemindersProps {
  tasks: Task[]
}

export function TaskReminders({ tasks }: TaskRemindersProps) {
  if (tasks.length === 0) {
    return <div className="text-sm text-gray-500">No other tasks for today</div>
  }

  return (
    <div className="text-sm text-gray-600 w-full">
      <p className="font-medium mb-2">Today's other tasks:</p>
      <ul className="space-y-2 md:max-h-32 md:overflow-y-auto pr-1">
        {tasks.map((task, index) => {
          const timeLeft = Math.max(0, task.goalTimeMinutes - task.progressMinutes)
          const hours = Math.floor(timeLeft / 60)
          const minutes = timeLeft % 60
          const timeDisplay = `${hours > 0 ? `${hours}h ` : ""}${minutes}m`

          return (
            <motion.li
              key={task.id}
              className="flex items-center justify-between"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: task.color }} />
                <span>{task.name}</span>
              </div>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{timeDisplay}</span>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

