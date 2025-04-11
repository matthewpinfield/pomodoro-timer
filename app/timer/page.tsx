"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { TimerCircle } from "@/components/timer-circle"
import { TaskReminders } from "@/components/task-reminders"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { useTimer } from "@/context/timer-context"
import { Plus, ArrowLeft, PlusCircle } from "lucide-react"
import { formatTime } from "@/lib/utils"
import { AddNoteDialog } from "@/components/add-note-dialog"
import { motion } from "framer-motion"

export default function TimerView() {
  const router = useRouter()
  const { tasks, currentTaskId } = useTasks()
  const {
    mode,
    timeLeftInMode,
    isRunning,
    settings,
    startWork,
    pauseTimer,
    skipBreak
  } = useTimer();

  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const [taskTimeLeftSeconds, setTaskTimeLeftSeconds] = useState<number>(NaN);

  const currentTask = tasks.find((task) => task.id === currentTaskId)
  const taskGoalSeconds = currentTask ? currentTask.goalTimeMinutes * 60 : 0;

  useEffect(() => {
    // Set selection state when component mounts
    if (typeof window !== 'undefined') {
      localStorage.setItem("focuspie-selecting-task", "true");
    }

    // Cleanup when component unmounts
    return () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("focuspie-selecting-task");
      }
    };
  }, []);

  useEffect(() => {
    if (!currentTaskId || !currentTask) {
      // Only redirect if we're not in the process of selecting a task
      if (typeof window !== 'undefined' && !localStorage.getItem("focuspie-selecting-task")) {
        localStorage.removeItem("focuspie-taskTimeLeft")
        setTaskTimeLeftSeconds(NaN);
        router.push("/pie-chart")
      }
    } else if (taskGoalSeconds <= 0) {
      // If task has no goal time, set a default of 25 minutes
      setTaskTimeLeftSeconds(25 * 60);
    } else {
      let initialTaskTimeLeft = taskGoalSeconds;
      if (typeof window !== 'undefined') {
        const savedTaskTime = localStorage.getItem("focuspie-taskTimeLeft");
        if (savedTaskTime !== null) {
          const parsedSavedTime = parseInt(savedTaskTime, 10);
          if (!isNaN(parsedSavedTime) && parsedSavedTime >= 0 && parsedSavedTime <= taskGoalSeconds) {
            initialTaskTimeLeft = parsedSavedTime;
          }
        }
      }
      setTaskTimeLeftSeconds(initialTaskTimeLeft);
    }
  }, [currentTaskId, currentTask, router, taskGoalSeconds]);

  useEffect(() => {
    let taskInterval: NodeJS.Timeout | undefined = undefined;

    if (mode === 'working' && isRunning && taskTimeLeftSeconds > 0) {
      taskInterval = setInterval(() => {
        setTaskTimeLeftSeconds((prev) => !isNaN(prev) ? Math.max(0, prev - 1) : 0);
      }, 1000);
    }

    return () => {
      if (taskInterval) clearInterval(taskInterval);
    };
  }, [mode, isRunning, taskTimeLeftSeconds]);

  useEffect(() => {
    if (typeof window !== 'undefined' && currentTaskId && !isNaN(taskTimeLeftSeconds)) {
      localStorage.setItem("focuspie-taskTimeLeft", taskTimeLeftSeconds.toString());
    }
  }, [taskTimeLeftSeconds, currentTaskId]);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(clockInterval)
  }, [])

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const timeDisplay = formatTime(timeLeftInMode)

  const taskProgress = taskGoalSeconds > 0 ? taskTimeLeftSeconds / taskGoalSeconds : 0;

  const handleTimerClick = () => {
      if (mode === 'idle') {
          startWork();
      } else {
          pauseTimer();
      }
  };

  const isEffectivelyRunning = isRunning;

  if (!currentTask || isNaN(taskTimeLeftSeconds)) return null

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <motion.main
        className="flex-1 w-full px-w-xs sm:px-w-sm py-md flex flex-col items-center md:flex-row md:justify-center md:items-start md:gap-xl md:max-w-4xl lg:max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row w-full items-start gap-xl">
          <div className="flex flex-col items-center md:w-1/2 mb-xl md:mb-0 flex-shrink-0">
            <TimerCircle
              mode={mode}
              currentModeTotalDuration={
                  mode === 'working' ? settings.pomodoro :
                  mode === 'shortBreak' ? settings.shortBreak :
                  mode === 'longBreak' ? settings.longBreak :
                  settings.pomodoro
              }
              timeLeftInMode={timeLeftInMode}
              timeDisplay={timeDisplay}
              taskProgress={taskProgress}
              taskName={currentTask.name}
              taskTimeLeftSeconds={taskTimeLeftSeconds}
              taskGoalMinutes={currentTask.goalTimeMinutes}
              isRunning={isEffectivelyRunning}
              onTimerClick={handleTimerClick}
            />

            {/* --- Simplified Legends Container --- */}
            <div className="mt-sm sm:mt-md flex justify-center items-center gap-md text-xs text-gray-600">
              {/* Current Task Indicator */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>Current Task</span>
              </div>

              <span>|</span>

              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Work</span>
                <span>/</span>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Rest</span>
              </div>
            </div>
            
            {(mode === 'shortBreak' || mode === 'longBreak') && (
                <Button onClick={skipBreak} variant="secondary" size="sm" className="mt-sm sm:mt-md">
                    Skip Break
                </Button>
            )}
          </div>

          {/* --- Right Column Wrapper (Desktop) --- */}
          <div className="flex flex-col items-center w-full md:w-1/2">
            {/* White Panel */}
            <motion.div
              className="w-full bg-white rounded-xl shadow-sm p-md sm:p-lg mt-md sm:mt-xl md:mt-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="mb-md sm:mb-xl">
                <TaskReminders tasks={tasks.filter((task) => task.id !== currentTaskId)} />
              </div>
              <div className="text-center text-gray-500 text-sm">{formattedTime}</div>
            </motion.div>

            {/* Add Note Button (Now below the panel, but within the right column) */}
            <div className="flex justify-center mt-md sm:mt-lg w-full">
              <Button 
                onClick={() => setNoteDialogOpen(true)} 
                className="w-full max-w-md flex items-center justify-center gap-sm bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                size="lg"
              >
                <PlusCircle className="w-icon-base h-icon-base" />
                <span>Add Note</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.main>

      {currentTaskId && (
        <AddNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} taskId={currentTaskId} />
      )}
    </div>
  )
}

