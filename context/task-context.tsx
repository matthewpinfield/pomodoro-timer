"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Task } from "@/types/task"
import { v4 as uuidv4 } from "uuid"

// Sample data for development only - will be ignored in production
const DEMO_TASKS: Task[] = [
  {
    id: "task-1",
    name: "Project Planning",
    goalTimeMinutes: 120, // 2 hours
    progressMinutes: 45,
    color: "#3b82f6", // blue
    notes: [],
  },
  {
    id: "task-2",
    name: "Client Meeting",
    goalTimeMinutes: 60, // 1 hour
    progressMinutes: 0,
    color: "#ef4444", // red
    notes: [],
  },
  {
    id: "task-3",
    name: "Documentation",
    goalTimeMinutes: 90, // 1.5 hours
    progressMinutes: 30,
    color: "#10b981", // green
    notes: [],
  },
  {
    id: "task-4",
    name: "Break Time",
    goalTimeMinutes: 30, // 0.5 hours
    progressMinutes: 15,
    color: "#f59e0b", // amber
    notes: [],
  },
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
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  // Load tasks from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem("focuspie-tasks")

    // If we have saved tasks, use them
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
    // Otherwise, in development mode, load demo tasks if enabled
    else if (process.env.NODE_ENV === "development") {
      // This line ensures the demo data doesn't appear in production
      // The comment below is for build tools to recognize this should be removed in production
      /* @__PURE__ */
      setTasks(DEMO_TASKS)
    }

    const savedCurrentTaskId = localStorage.getItem("focuspie-current-task")
    if (savedCurrentTaskId) {
      setCurrentTaskId(savedCurrentTaskId)
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

