"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Task } from "@/types/task"
import { v4 as uuidv4 } from "uuid"

// Type for data passed to add/update functions
interface TaskData {
  name: string;
  goalTimeMinutes: number;
  isPriority?: boolean; // Include priority in the data type
}

interface TaskContextType {
  tasks: Task[]
  currentTaskId: string | null
  hasRealTasks: boolean
  addTask: (task: TaskData) => void // Use TaskData type
  updateTask: (id: string, task: TaskData) => void // Use TaskData type
  deleteTask: (id: string) => void
  updateTaskProgress: (id: string, minutesCompleted: number) => void
  addTaskNote: (id: string, note: string) => void
  setCurrentTaskId: (id: string | null) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

// Define the total number of chart colors available
const TOTAL_CHART_COLORS = 20;

// Function to create demo tasks - stable IDs are helpful for comparison
const DEMO_TASK_1 = { id: "demo-1", name: "Project Design", goalTimeMinutes: 90, progressMinutes: 0, chartIndex: 1, isPriority: true, notes: [] };
const DEMO_TASK_2 = { id: "demo-2", name: "Client Meeting Prep", goalTimeMinutes: 45, progressMinutes: 0, chartIndex: 2, isPriority: false, notes: [] };
const DEMO_TASK_3 = { id: "demo-3", name: "Code Review - X", goalTimeMinutes: 60, progressMinutes: 0, chartIndex: 3, isPriority: false, notes: [] };
const DEMO_TASK_4 = { id: "demo-4", name: "Research Competitors", goalTimeMinutes: 75, progressMinutes: 0, chartIndex: 4, isPriority: false, notes: [] };
const DEMO_TASKS = [DEMO_TASK_1, DEMO_TASK_2, DEMO_TASK_3, DEMO_TASK_4];

// Helper to check if the current task list IS the demo list
const isDemoList = (currentTasks: Task[]): boolean => {
  if (currentTasks.length !== DEMO_TASKS.length) return false;
  // Check if all IDs match the demo IDs
  const currentIds = currentTasks.map(t => t.id).sort();
  const demoIds = DEMO_TASKS.map(t => t.id).sort();
  return currentIds.every((id, index) => id === demoIds[index]);
};

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]) // Start empty before useEffect
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [nextChartIndex, setNextChartIndex] = useState(1);
  const [hasRealTasks, setHasRealTasks] = useState(false);

  // Helper function to sort tasks (priority first, then maybe by creation order/name?)
  // For now, just priority first.
  const sortTasks = (taskList: Task[]): Task[] => {
    return [...taskList].sort((a, b) => {
      // Prioritize tasks marked as priority
      if (a.isPriority && !b.isPriority) return -1; // a comes first
      if (!a.isPriority && b.isPriority) return 1;  // b comes first
      // Optional: Add secondary sort criteria here if needed (e.g., by name or original order)
      return 0; // Keep original order for non-priority or same-priority tasks
    });
  };

  // Load tasks or set demo tasks on initial mount
  useEffect(() => {
    let initialTasks: Task[] = [];
    const savedTasks = localStorage.getItem("focuspie-tasks")
    if (savedTasks) {
      try {
        initialTasks = JSON.parse(savedTasks).map((task: any) => ({ ...task, isPriority: task.isPriority || false }));
      } catch (e) { 
        console.error("Error parsing saved tasks:", e);
        localStorage.removeItem("focuspie-tasks"); // Clear invalid data
      }
    }

    // If loading failed or resulted in an empty list, use demo tasks
    if (initialTasks.length === 0) {
      console.log("TASK_CONTEXT: No valid saved tasks found, using demo tasks.");
      initialTasks = [...DEMO_TASKS]; // Use a copy of the demo tasks
    } else {
      console.log("TASK_CONTEXT: Loaded tasks from localStorage.");
    }

    // --- Calculate initial hasRealTasks --- 
    const initialHasReal = initialTasks.some(task => !task.id.startsWith("demo-"));
    setHasRealTasks(initialHasReal);

    setTasks(sortTasks(initialTasks));

    // --- Determine next chart index based on the loaded/demo tasks ---
    if (initialTasks.length > 0) {
      const highestIndex = initialTasks.reduce((maxIndex, task) => 
         // Ensure chartIndex is a number before comparing
         typeof task.chartIndex === 'number' && task.chartIndex > maxIndex ? task.chartIndex : maxIndex
      , 0);
      setNextChartIndex((highestIndex % TOTAL_CHART_COLORS) + 1);
    } else {
      setNextChartIndex(1);
    }
    // ------------------------------------------------------------------

    const savedCurrentTaskId = localStorage.getItem("focuspie-current-task")
    if (savedCurrentTaskId) {
      setCurrentTaskId(savedCurrentTaskId)
    }
  }, []) // Run only once on mount

  // Save tasks to localStorage whenever they change (unconditionally)
  useEffect(() => {
    console.log("TASK_CONTEXT: Saving tasks to localStorage:", tasks);
    localStorage.setItem("focuspie-tasks", JSON.stringify(tasks))
    // Recalculate hasRealTasks whenever tasks change
    setHasRealTasks(tasks.some(task => !task.id.startsWith("demo-")));
  }, [tasks])

  // Save current task to localStorage whenever it changes
  useEffect(() => {
    if (currentTaskId) {
      localStorage.setItem("focuspie-current-task", currentTaskId)
    } else {
      localStorage.removeItem("focuspie-current-task")
    }
  }, [currentTaskId])

  // Updated addTask to handle clearing demo tasks
  const addTask = (taskData: TaskData) => {
    const newTask: Task = {
      id: uuidv4(), // Always generate a new ID
      name: taskData.name,
      goalTimeMinutes: taskData.goalTimeMinutes,
      progressMinutes: 0,
      chartIndex: nextChartIndex,
      isPriority: taskData.isPriority || false, 
      notes: [],
    }

    setTasks((prevTasks) => {
      // Check if the current state IS the demo list (now expects 4)
      if (isDemoList(prevTasks)) {
        console.log("TASK_CONTEXT: First user task added, replacing demo list.");
        return sortTasks([newTask]); // Replace demo list with just the new task
      } else {
        console.log("TASK_CONTEXT: Adding new task to existing list.");
        return sortTasks([...prevTasks, newTask]); // Append to existing list
      }
    });

    // --- Determine next chart index --- (ensure this is recalculated correctly)
    // Calculate next index based on the potentially *new* task list length and max index
    // This might need adjustment if we want colours to be more stable after demo clear
    // For now, simple increment based on previous state works, but might jump.
    setNextChartIndex((prevIndex) => (prevIndex % TOTAL_CHART_COLORS) + 1);
    // A more robust way might be to recalculate from the new task list:
    // const newTaskList = isDemoList(tasks) ? [newTask] : [...tasks, newTask];
    // const highestIndex = newTaskList.reduce(...); 
    // setNextChartIndex(...);
  }

  // updateTask and deleteTask no longer need special demo logic
  // They operate on the current state, which is either demo or user data.
  // If user updates/deletes a demo task, the isDemoList check in addTask will handle it.
  const updateTask = (id: string, taskData: TaskData) => {
    setTasks((prevTasks) =>
      sortTasks( 
        prevTasks.map((t) =>
          t.id === id ? { ...t, ...taskData, isPriority: taskData.isPriority || false } : t
        )
      )
    )
  }

  const deleteTask = (id: string) => {
    setTasks((prevTasks) => sortTasks(prevTasks.filter((t) => t.id !== id)))
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
        tasks, // Already sorted
        currentTaskId,
        hasRealTasks,
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


