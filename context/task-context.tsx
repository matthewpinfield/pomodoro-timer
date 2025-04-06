"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Task } from "@/types/task"
import { v4 as uuidv4 } from "uuid"

// Sample data for development only - will be ignored in production
const DEMO_TASKS: Task[] = [
  {
    id: "demo-task-1",
    name: "[DEV] Project Planning",
    goalTimeMinutes: 120, // 2 hours
    progressMinutes: 20,
    color: "#3b82f6", // blue
    notes: [],
  },
  {
    id: "demo-task-2",
    name: "[DEV] Client Meeting",
    goalTimeMinutes: 60, // 1 hour
    progressMinutes: 0,
    color: "#ef4444", // red
    notes: [],
  },
  {
    id: "demo-task-3",
    name: "[DEV] Documentation",
    goalTimeMinutes: 90, // 1.5 hours
    progressMinutes: 0,
    color: "#10b981", // green
    notes: [],
  },
  {
    id: "demo-task-4",
    name: "[DEV] Break Time",
    goalTimeMinutes: 30, // 0.5 hours
    progressMinutes: 0,
    color: "#f59e0b", // amber
    notes: [],
  }
]

interface TaskContextType {
  tasks: Task[]
  currentTaskId: string | null
  addTask: (task: { name: string; goalTimeMinutes: number; color: string }) => void
  updateTask: (id: string, task: { name: string; goalTimeMinutes: number; color: string }) => void
  deleteTask: (id: string) => void
  updateTaskProgress: (id: string, minutesCompleted: number) => void
  addTaskNote: (id: string, note: string) => void
  setCurrentTaskId: (id: string | null) => void
  resetAllTaskProgress: () => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  // Function to backup task progress to localStorage
  const backupTaskProgress = (tasksToBackup: Task[]) => {
    const today = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
    const backupKey = `focuspie-backup-${today}`
    localStorage.setItem(backupKey, JSON.stringify(tasksToBackup))
  }

  // Function to reset all task progress with notification
  const resetAllTaskProgress = () => {
    // Backup current progress before reset
    backupTaskProgress(tasks)
    
    // Reset progress
    setTasks((prevTasks) =>
      prevTasks.map((task) => ({
        ...task,
        progressMinutes: 0,
      }))
    )
    
    // Show notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Task Progress Reset', {
          body: 'All task progress has been reset for the new day.',
          icon: '/favicon.ico'
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Task Progress Reset', {
              body: 'All task progress has been reset for the new day.',
              icon: '/favicon.ico'
            })
          }
        })
      }
    }
  }

  // Check for midnight and reset progress
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const timeUntilMidnight = tomorrow.getTime() - now.getTime()
      
      // Set timeout for next midnight
      const timeoutId = setTimeout(() => {
        resetAllTaskProgress()
        // Set up next check
        checkMidnight()
      }, timeUntilMidnight)

      return () => clearTimeout(timeoutId)
    }

    // Initial check
    const cleanup = checkMidnight()
    return cleanup
  }, [tasks]) // Add tasks as dependency to ensure we have the latest data for backup

  // Load tasks from localStorage on initial render
  useEffect(() => {
    // Clear localStorage to force demo tasks
    localStorage.removeItem("focuspie-tasks")
    localStorage.removeItem("focuspie-current-task")

    // Load demo tasks in development mode
    if (process.env.NODE_ENV === "development") {
      setTasks(DEMO_TASKS)
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("focuspie-tasks", JSON.stringify(tasks))
  }, [tasks])

  // Save current task to localStorage whenever it changes
  useEffect(() => {
    if (currentTaskId) {
      localStorage.setItem("focuspie-current-task", currentTaskId)
    } else {
      localStorage.removeItem("focuspie-current-task")
    }
  }, [currentTaskId])

  const addTask = (task: { name: string; goalTimeMinutes: number; color: string }) => {
    const newTask: Task = {
      id: uuidv4(),
      name: task.name,
      goalTimeMinutes: task.goalTimeMinutes,
      progressMinutes: 0,
      color: task.color,
      notes: [],
    }

    setTasks((prevTasks) => [...prevTasks, newTask])
  }

  const updateTask = (id: string, task: { name: string; goalTimeMinutes: number; color: string }) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === id ? { ...t, name: task.name, goalTimeMinutes: task.goalTimeMinutes, color: task.color } : t,
      ),
    )
  }

  const deleteTask = (id: string) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== id))

    if (currentTaskId === id) {
      setCurrentTaskId(null)
    }
  }

  const updateTaskProgress = (id: string, minutesCompleted: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => (t.id === id ? { ...t, progressMinutes: t.progressMinutes + minutesCompleted } : t)),
    )
  }

  const addTaskNote = (id: string, note: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === id
          ? { ...t, notes: [...t.notes, { id: uuidv4(), text: note, timestamp: new Date().toISOString() }] }
          : t,
      ),
    )
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        currentTaskId,
        addTask,
        updateTask,
        deleteTask,
        updateTaskProgress,
        addTaskNote,
        setCurrentTaskId,
        resetAllTaskProgress,
      }}
    >
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider")
  }
  return context
}

