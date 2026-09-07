"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import type { Task, TaskNote } from "@/types/task"
import { v4 as uuidv4 } from "uuid"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./auth-context"

// --- Supabase row <-> Task shape conversion (DB columns are snake_case) ---
interface TaskRow {
  id: string
  user_id: string
  name: string
  goal_time_minutes: number
  progress_minutes: number
  chart_index: number
  is_priority: boolean
  notes: TaskNote[]
  source_uid: string | null
}

function taskToRow(task: Task, userId: string): Omit<TaskRow, "user_id"> & { user_id: string } {
  return {
    id: task.id,
    user_id: userId,
    name: task.name,
    goal_time_minutes: task.goalTimeMinutes,
    progress_minutes: task.progressMinutes,
    chart_index: typeof task.chartIndex === "number" ? task.chartIndex : parseInt(String(task.chartIndex), 10) || 1,
    is_priority: task.isPriority,
    notes: task.notes,
    source_uid: task.sourceUid ?? null,
  }
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    name: row.name,
    goalTimeMinutes: row.goal_time_minutes,
    progressMinutes: row.progress_minutes,
    chartIndex: row.chart_index,
    isPriority: row.is_priority,
    notes: row.notes ?? [],
    sourceUid: row.source_uid ?? undefined,
  }
}

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
  restoreTask: (task: Task) => void // Re-inserts a task as-is (e.g. undoing a delete)
  updateTaskProgress: (id: string, minutesCompleted: number) => void
  addTaskNote: (id: string, note: string) => void
  setCurrentTaskId: (id: string | null) => void
  // Creates/updates tasks from imported calendar events, matched by sourceUid
  // (the ICS event's own UID) so re-syncing the same calendar updates these
  // same tasks instead of duplicating them on every sync.
  importCalendarTasks: (events: { uid: string; summary: string; durationMinutes: number }[]) => void
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

// Define the total number of chart colors available
const TOTAL_CHART_COLORS = 20;

// Function to create demo tasks - stable IDs are helpful for comparison
const DEMO_TASK_1 = { id: "demo-1", name: "Project Design", goalTimeMinutes: 90, progressMinutes: 0, chartIndex: 1, isPriority: true, notes: [] };
const DEMO_TASK_2 = { id: "demo-2", name: "Client Meeting Prep", goalTimeMinutes: 45, progressMinutes: 0, chartIndex: 2, isPriority: false, notes: [] };
const DEMO_TASKS = [DEMO_TASK_1, DEMO_TASK_2];

// Helper to check if the current task list IS the demo list
const isDemoList = (currentTasks: Task[]): boolean => {
  if (currentTasks.length !== DEMO_TASKS.length) return false;
  // Check if all IDs match the demo IDs
  const currentIds = currentTasks.map(t => t.id).sort();
  const demoIds = DEMO_TASKS.map(t => t.id).sort();
  return currentIds.every((id, index) => id === demoIds[index]);
};

export function TaskProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([]) // Start empty before useEffect
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [nextChartIndex, setNextChartIndex] = useState(1);
  const [hasRealTasks, setHasRealTasks] = useState(false);
  // Set once the initial localStorage load has run, so the sign-in sync
  // effect below never races it and pushes up an empty/default task list.
  const localLoadDoneRef = useRef(false);
  // A ref for "started" (guards against re-entering the migration effect
  // twice for the same user - doesn't need to trigger a re-render) and state
  // for "done" (must be state, not a ref: it's only set after the async
  // pull-or-push resolves, and the write-through effect below depends on it -
  // a ref mutation doesn't retrigger effects, so if write-through ran and
  // bailed out *before* migration finished, nothing would ever make it retry).
  const migrationStartedForUserIdRef = useRef<string | null>(null);
  const [migrationDoneForUserId, setMigrationDoneForUserId] = useState<string | null>(null);

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

    localLoadDoneRef.current = true
  }, []) // Run only once on mount

  // --- Sync with Supabase when a user signs in ---
  // Runs once per sign-in (tracked via the refs above, not on every render).
  // Two cases: this account already has tasks synced from another device (the
  // server is authoritative - replace local state with it, no merge attempted)
  // or this is the first time this account has ever synced (push whatever
  // real, non-demo tasks already exist locally up as the starting point).
  useEffect(() => {
    if (!supabase || !user || !localLoadDoneRef.current || migrationStartedForUserIdRef.current === user.id) return
    migrationStartedForUserIdRef.current = user.id

    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase!.from("tasks").select("*").eq("user_id", user.id)
      if (cancelled) return
      if (error) {
        console.error("TASK_CONTEXT: Failed to load synced tasks:", error)
        // Still mark this user as "done" so write-through isn't permanently
        // blocked for the rest of the session by one failed read.
        setMigrationDoneForUserId(user.id)
        return
      }

      if (data && data.length > 0) {
        const serverTasks = sortTasks((data as TaskRow[]).map(rowToTask))
        setTasks(serverTasks)
        const highestIndex = serverTasks.reduce(
          (max, t) => (typeof t.chartIndex === "number" && t.chartIndex > max ? t.chartIndex : max),
          0,
        )
        setNextChartIndex((highestIndex % TOTAL_CHART_COLORS) + 1)
      } else {
        const realTasks = tasks.filter((t) => !t.id.startsWith("demo-"))
        if (realTasks.length > 0) {
          const { error: upsertError } = await supabase!
            .from("tasks")
            .upsert(realTasks.map((t) => taskToRow(t, user.id)))
          if (upsertError) console.error("TASK_CONTEXT: Failed to push initial tasks on sign-in:", upsertError)
        }
      }
      if (cancelled) return
      // Only now - after the pull-or-push has actually resolved - is it safe
      // for the write-through effect below to start acting on `tasks`. Setting
      // this any earlier let write-through fire mid-migration, using stale
      // pre-sync local state and racing the pull-down.
      setMigrationDoneForUserId(user.id)
    })()

    return () => {
      cancelled = true
    }
    // Only re-run when the signed-in user identity actually changes -
    // `tasks` is read inside but must not itself retrigger this migration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // --- Write-through: mirror every task-list change to Supabase while signed in ---
  // Deliberately not one Supabase call per mutation (addTask/updateTask/etc.) -
  // that would mean duplicating "what changed" logic at six call sites, each a
  // chance to drift from the local reducer or read a stale value. Instead this
  // watches the same `tasks` state the localStorage-persist effect already
  // does, and diffs it against what was last synced to find removals -
  // one place, always reading the current, authoritative local state.
  const lastSyncedIdsRef = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!supabase || !user || migrationDoneForUserId !== user.id) return

    const realTasks = tasks.filter((t) => !t.id.startsWith("demo-"))
    const currentIds = new Set(realTasks.map((t) => t.id))
    const previousIds = lastSyncedIdsRef.current

    ;(async () => {
      if (realTasks.length > 0) {
        const { error } = await supabase!.from("tasks").upsert(realTasks.map((t) => taskToRow(t, user.id)))
        if (error) console.error("TASK_CONTEXT: Failed to sync tasks to Supabase:", error)
      }
      if (previousIds) {
        const removedIds = [...previousIds].filter((id) => !currentIds.has(id))
        if (removedIds.length > 0) {
          const { error } = await supabase!.from("tasks").delete().in("id", removedIds)
          if (error) console.error("TASK_CONTEXT: Failed to delete synced tasks from Supabase:", error)
        }
      }
      lastSyncedIdsRef.current = currentIds
    })()
  }, [tasks, user, migrationDoneForUserId])

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

  // Re-inserts a task exactly as it was (id, progress, notes intact) - for undoing a delete
  const restoreTask = (task: Task) => {
    setTasks((prevTasks) => {
      if (prevTasks.some((t) => t.id === task.id)) return prevTasks; // already present, avoid duplicates
      return sortTasks([...prevTasks, task]);
    });
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

  const importCalendarTasks = (events: { uid: string; summary: string; durationMinutes: number }[]) => {
    setTasks((prevTasks) => {
      const base = isDemoList(prevTasks) ? [] : prevTasks
      let next = [...base]
      let chartIndexCursor = nextChartIndex
      for (const event of events) {
        const existingIdx = next.findIndex((t) => t.sourceUid === event.uid)
        if (existingIdx >= 0) {
          // Keep id/progress/notes intact - only the calendar-sourced fields refresh.
          next[existingIdx] = {
            ...next[existingIdx],
            name: event.summary,
            goalTimeMinutes: event.durationMinutes,
          }
        } else {
          next.push({
            id: uuidv4(),
            name: event.summary,
            goalTimeMinutes: event.durationMinutes,
            progressMinutes: 0,
            chartIndex: chartIndexCursor,
            isPriority: false,
            notes: [],
            sourceUid: event.uid,
          })
          chartIndexCursor = (chartIndexCursor % TOTAL_CHART_COLORS) + 1
        }
      }
      setNextChartIndex(chartIndexCursor)
      return sortTasks(next)
    })
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
        restoreTask,
        updateTaskProgress,
        addTaskNote,
        setCurrentTaskId,
        importCalendarTasks,
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


