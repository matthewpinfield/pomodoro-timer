"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TimerCircle } from "@/components/timer-circle"
import { TaskReminders } from "@/components/task-reminders"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { useTimer } from "@/context/timer-context"
import { Plus, ArrowLeft, SkipForward, PlusCircle } from "lucide-react"
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
      // Update progress with the completed pomodoro time (25 minutes)
      updateTaskProgress(currentTaskId, 25)
      setTaskTimeLeft((prev) => Math.max(0, prev - 1500)) // 25 minutes in seconds
    }
  }, [timerState.currentPhase, timerState.timeLeft, currentTaskId, updateTaskProgress])

  // Update task time left when timer is running
  useEffect(() => {
    if (timerState.isRunning && timerState.currentPhase === "work" && currentTaskId) {
      const startTime = Date.now()
      const interval = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000)
        if (elapsedSeconds > 0) {
          // Update progress every minute
          if (elapsedSeconds % 60 === 0) {
            updateTaskProgress(currentTaskId, 1)
          }
          setTaskTimeLeft((prev) => Math.max(0, prev - 1))
        }
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timerState.isRunning, timerState.currentPhase, currentTaskId, updateTaskProgress])

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
        className="flex-1 max-w-5xl mx-auto w-full px-4 flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row gap-6 md:items-start">
          <div className="flex-1">
            <div className="my-6 md:my-0 flex justify-center">
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
          </div>

          <div className="md:w-80">
            <motion.div
              className="w-full md:w-80 bg-white rounded-xl shadow-sm p-4 mt-6 md:mt-0 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex flex-col h-full w-full">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-gray-700">Today's Other Tasks</h3>
                </div>
                
                <TaskReminders tasks={tasks.filter((task) => task.id !== currentTaskId)} />
                
                <div className="text-center text-gray-500 text-sm mt-auto pt-4">{formattedTime}</div>
              </div>
            </motion.div>

            <motion.div 
              className="w-full mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button 
                onClick={() => setNoteDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all h-10 px-4 py-2 sm:h-11 sm:px-8 sm:rounded-md active:scale-95"
              >
                <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add Note</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.main>

      <AddNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} taskId={currentTaskId || ""} />
    </div>
  )
}

