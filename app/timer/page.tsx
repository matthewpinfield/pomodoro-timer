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
    if (!currentTaskId || !currentTask || taskGoalSeconds <= 0) {
      localStorage.removeItem("focuspie-taskTimeLeft")
      setTaskTimeLeftSeconds(NaN);
      router.push("/pie-chart")
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
    <div className="flex flex-col min-h-full p-4">
      {/* Add Back Button at the top of the content area */}
      <div className="w-full max-w-5xl mx-auto mb-4"> {/* Constrain width and add margin */}
        <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/pie-chart")}
            className="flex items-center text-gray-500 dark:text-gray-400"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Tasks
          </Button>
      </div>

      <motion.main
        className="flex-1 w-full px-4 flex flex-col items-center md:flex-row md:justify-center md:items-start md:gap-8 md:max-w-4xl lg:max-w-5xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col items-center md:w-1/2 my-6 md:my-0">
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
          <div className="mt-4 flex justify-center items-center space-x-4 text-xs text-gray-600">
            {/* Current Task Indicator - Make dot red */}
            <div className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-1.5 bg-red-500"
              ></div>
              <span>Current Task</span>
            </div>

            {/* Work/Rest Indicator */}
            <div className="flex items-center">
               <div className="w-3 h-3 rounded-full mr-1.5 bg-blue-500"></div>
               <span>Work / Rest</span>
            </div>
          </div>
          
          {(mode === 'shortBreak' || mode === 'longBreak') && (
              <Button onClick={skipBreak} variant="secondary" size="sm" className="mt-4">
                  Skip Break
              </Button>
          )}
        </div>

        {/* --- Right Column Wrapper (Desktop) --- */}
        <div className="flex flex-col items-center w-full md:w-1/2">
          {/* White Panel */}
          <motion.div
            className="w-full bg-white rounded-xl shadow-sm p-4 mt-6 md:mt-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="mb-6">
              <TaskReminders tasks={tasks.filter((task) => task.id !== currentTaskId)} />
            </div>
            <div className="text-center text-gray-500 text-sm">{formattedTime}</div>
          </motion.div>

          {/* Add Note Button (Now below the panel, but within the right column) */}
          <div className="flex justify-center mt-4 w-full">
            <Button 
              onClick={() => setNoteDialogOpen(true)} 
              className="w-full max-w-md flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Add Note</span>
            </Button>
          </div>
        </div>
      </motion.main>

      {currentTaskId && (
        <AddNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} taskId={currentTaskId} />
      )}
    </div>
  )
}

