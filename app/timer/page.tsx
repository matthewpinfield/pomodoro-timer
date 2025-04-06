"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TimerCircle } from "@/components/timer-circle"
import { TaskReminders } from "@/components/task-reminders"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { useTimer } from "@/context/timer-context"
import { Plus, ArrowLeft, SkipForward } from "lucide-react"
import { formatTime } from "@/lib/utils"
import { AddNoteDialog } from "@/components/add-note-dialog"
import { motion } from "framer-motion"

export default function TimerView() {
  const router = useRouter()
  const { tasks, currentTaskId, updateTaskProgress } = useTasks()
  const { timerState, startTimer, pauseTimer, skipPhase } = useTimer()
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [taskTimeLeft, setTaskTimeLeft] = useState(0)

  const currentTask = tasks.find((task) => task.id === currentTaskId)

  // If no current task, redirect to pie chart view
  useEffect(() => {
    if (!currentTaskId || !currentTask) {
      router.push("/pie-chart")
    } else {
      // Calculate task time left in seconds
      const taskGoalSeconds = currentTask.goalTimeMinutes * 60
      const taskProgressSeconds = currentTask.progressMinutes * 60
      setTaskTimeLeft(taskGoalSeconds - taskProgressSeconds)
    }
  }, [currentTaskId, currentTask, router])

  // Update task progress when work phase completes
  useEffect(() => {
    if (timerState.currentPhase === "work" && timerState.timeLeft === 0 && currentTaskId) {
      updateTaskProgress(currentTaskId, timerState.timeLeft / 60)
      setTaskTimeLeft((prev) => Math.max(0, prev - timerState.timeLeft))
    }
  }, [timerState.currentPhase, timerState.timeLeft, currentTaskId, updateTaskProgress])

  // Update task time left when timer is running
  useEffect(() => {
    if (timerState.isRunning && timerState.currentPhase === "work" && currentTaskId) {
      const interval = setInterval(() => {
        setTaskTimeLeft((prev) => Math.max(0, prev - 1))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timerState.isRunning, timerState.currentPhase, currentTaskId])

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Toggle timer
  const toggleTimer = () => {
    if (timerState.isRunning) {
      pauseTimer()
    } else {
      startTimer()
    }
  }

  // Format current time
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  if (!currentTask) return null

  // Calculate progress percentages for visual arcs
  const pomodoroProgress = 1 - timerState.timeLeft / (25 * 60) // Assuming 25 minutes for work phase
  const taskProgress = currentTask.progressMinutes / currentTask.goalTimeMinutes

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/pie-chart")}
          className="flex items-center text-gray-500"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Tasks
        </Button>
      </motion.header>

      <motion.main
        className="flex-1 max-w-md mx-auto w-full px-4 flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="my-6">
          <TimerCircle
            pomodoroProgress={pomodoroProgress}
            taskProgress={taskProgress}
            timeDisplay={formatTime(timerState.timeLeft)}
            taskName={currentTask.name}
            isRunning={timerState.isRunning}
            onTimerClick={toggleTimer}
            taskGoalMinutes={currentTask.goalTimeMinutes}
            taskTimeLeftSeconds={taskTimeLeft}
          />
        </div>

        <motion.div
          className="w-full bg-white rounded-xl shadow-sm p-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex justify-between items-start mb-6">
            <TaskReminders tasks={tasks.filter((task) => task.id !== currentTaskId)} />

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setNoteDialogOpen(true)} className="text-gray-500">
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>
          </div>

          <div className="text-center text-gray-500 text-sm">{formattedTime}</div>
        </motion.div>
      </motion.main>

      <AddNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} taskId={currentTaskId || ""} />
    </div>
  )
}

