"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CircleTimer } from "@/components/circle-timer"
import { TaskList } from "@/components/task-list"
import { TimerStats } from "@/components/timer-stats"

export default function LayoutOne() {
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes in seconds
  const [taskTime, setTaskTime] = useState(45 * 60) // 45 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(pomodoroTime)

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(pomodoroTime)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const pomodoroProgress = 1 - timeLeft / pomodoroTime
  const taskProgress = 0.65 // Simulated task progress

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <main className="flex-1 max-w-md mx-auto w-full p-4 flex flex-col">
        <div className="flex justify-center my-8">
          <CircleTimer
            pomodoroProgress={pomodoroProgress}
            taskProgress={taskProgress}
            timeDisplay={formatTime(timeLeft)}
            subtitle="Pomodoro Session"
            variant="split"
          />
        </div>

        <TimerStats />

        <div className="mt-4 mb-2 flex space-x-2 justify-center">
          <Button onClick={toggleTimer} variant="outline" className="w-32">
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button onClick={resetTimer} variant="outline" className="w-32">
            Reset
          </Button>
        </div>

        <TaskList />
      </main>
    </div>
  )
}

