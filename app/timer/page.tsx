"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TimerCircle } from "@/components/timer-circle"
import { TaskReminders } from "@/components/task-reminders"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { Plus, ArrowLeft } from "lucide-react"
import { formatTime } from "@/lib/utils"
import { AddNoteDialog } from "@/components/add-note-dialog"
import { motion } from "framer-motion"

const POMODORO_DURATION_SECONDS = 25 * 60 // Default Pomodoro time

export default function TimerView() {
  const router = useRouter()
  const { tasks, currentTaskId, updateTaskProgress } = useTasks()
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Load timer state from localStorage or use defaults
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedTime = localStorage.getItem("focuspie-timeLeft")
      return savedTime ? parseInt(savedTime, 10) : POMODORO_DURATION_SECONDS
    }
    return POMODORO_DURATION_SECONDS
  })

  const [isRunning, setIsRunning] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedRunning = localStorage.getItem("focuspie-isRunning")
      return savedRunning ? JSON.parse(savedRunning) : false
    }
    return false
  })

  // Load task time left from localStorage or calculate if not present/invalid
  const [taskTimeLeft, setTaskTimeLeft] = useState<number>(0) // Initial value set later

  const currentTask = tasks.find((task) => task.id === currentTaskId)

  // Initial setup, redirection, and taskTimeLeft initialization
  useEffect(() => {
    if (!currentTaskId || !currentTask) {
      // Clear timer state if no task is selected
      localStorage.removeItem("focuspie-timeLeft")
      localStorage.removeItem("focuspie-isRunning")
      localStorage.removeItem("focuspie-taskTimeLeft") // Clear task time left
      router.push("/pie-chart")
    } else {
      // Calculate task time left based on stored progress
      const taskGoalSeconds = currentTask.goalTimeMinutes * 60
      const taskProgressSeconds = currentTask.progressMinutes * 60
      const calculatedTaskTimeLeft = Math.max(0, taskGoalSeconds - taskProgressSeconds)

      // Try to load from localStorage, fallback to calculated value
      let initialTaskTimeLeft = calculatedTaskTimeLeft;
      if (typeof window !== 'undefined') {
        const savedTaskTime = localStorage.getItem("focuspie-taskTimeLeft");
        // Use saved value ONLY if it's less than or equal to the calculated time
        // This prevents using stale data if task progress was updated elsewhere
        if (savedTaskTime !== null) {
            const parsedSavedTime = parseInt(savedTaskTime, 10);
            if (!isNaN(parsedSavedTime) && parsedSavedTime <= calculatedTaskTimeLeft) {
                initialTaskTimeLeft = parsedSavedTime;
            }
        }
      }
      setTaskTimeLeft(initialTaskTimeLeft)

      // Ensure timeLeft doesn't exceed task time left if loaded from storage
      setTimeLeft(prevTimeLeft => Math.min(prevTimeLeft, initialTaskTimeLeft))
    }
    // Include tasks in dependency array as progressMinutes might change
  }, [currentTaskId, currentTask, router, tasks])

  // Save timer state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("focuspie-timeLeft", timeLeft.toString())
      localStorage.setItem("focuspie-isRunning", JSON.stringify(isRunning))
      // Only save taskTimeLeft if it's a valid number (initialized)
      if (!isNaN(taskTimeLeft)) {
          localStorage.setItem("focuspie-taskTimeLeft", taskTimeLeft.toString())
      }
    }
  }, [timeLeft, isRunning, taskTimeLeft])

  // Main Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined = undefined

    if (isRunning && timeLeft > 0 && taskTimeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => Math.max(0, prevTime - 1))
        setTaskTimeLeft((prevTaskTime) => Math.max(0, prevTaskTime - 1))
      }, 1000)
    }

    // Handle Pomodoro Completion
    if (timeLeft === 0 && isRunning && currentTaskId) {
      const completedPomodoroMinutes = POMODORO_DURATION_SECONDS / 60
      updateTaskProgress(currentTaskId, completedPomodoroMinutes)

      // Reset for next pomodoro
      setTimeLeft(POMODORO_DURATION_SECONDS)
      setIsRunning(false)
      // Task time left is already updated via the interval
      // Or recalculate based on updated task progress if needed for sync
      // const updatedTask = tasks.find(t => t.id === currentTaskId);
      // if (updatedTask) {
      //   const taskGoalSeconds = updatedTask.goalTimeMinutes * 60;
      //   const taskProgressSeconds = updatedTask.progressMinutes * 60;
      //   setTaskTimeLeft(Math.max(0, taskGoalSeconds - taskProgressSeconds));
      // }
    }

    return () => {
        if(interval) clearInterval(interval)
    };
  // Ensure dependencies cover all scenarios for starting/stopping/completion
  }, [isRunning, timeLeft, taskTimeLeft, currentTaskId, updateTaskProgress])

  // Update current clock time
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(clockInterval)
  }, [])

  // Toggle timer running state
  const toggleTimer = () => {
    // Prevent starting if task is already complete
    if (taskTimeLeft <= 0 && !isRunning) return;
    setIsRunning(!isRunning)
  }

  // Format current time display
  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  // Format pomodoro time left for display
  const timeDisplay = formatTime(timeLeft)

  // Render null or loading state until task is confirmed
  if (!currentTask) return null

  // Calculate progress percentages for visual arcs
  // Pomodoro progress based on its own duration
  const pomodoroProgress = 1 - timeLeft / POMODORO_DURATION_SECONDS
  // Task progress based on minutes recorded in context (updates per pomodoro)
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
            taskProgress={taskProgress} // Red arc still based on completed pomodoros
            timeDisplay={timeDisplay}
            taskName={currentTask.name}
            isRunning={isRunning}
            onTimerClick={toggleTimer}
            taskGoalMinutes={currentTask.goalTimeMinutes}
            taskTimeLeftSeconds={taskTimeLeft} // This now counts down
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

            <Button variant="ghost" size="sm" onClick={() => setNoteDialogOpen(true)} className="text-gray-500">
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div>

          <div className="text-center text-gray-500 text-sm">{formattedTime}</div>
        </motion.div>
      </motion.main>

      {/* Only render dialog if a task is selected */}
      {currentTaskId && (
        <AddNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} taskId={currentTaskId} />
      )}
    </div>
  )
}

