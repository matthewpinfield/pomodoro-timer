"use client"

import { useTasks } from "@/context/task-context"
import { useTimer } from "@/context/timer-context"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Flag } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { TaskForm } from "@/components/task-form"
import type { Task } from "@/types/task"
import { useRouter } from "next/navigation"

// Helper function to get CSS variable value
const getCssVariable = (variableName: string): string => {
  // Fallback color if window/CSS var is not available (SSR, initial render)
  if (typeof window === "undefined") return "#808080"; 
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim() || "#808080"; 
};

interface TaskListProps {
  tasks?: Task[]
  onEditTask?: (taskId: string) => void
  showControls?: boolean;
  forceMonochrome?: boolean;
}

export function TaskList({ 
  tasks = [], 
  onEditTask, 
  showControls = true,
  forceMonochrome = false,
}: TaskListProps) {
  const { deleteTask, restoreTask, updateTask, setCurrentTaskId, currentTaskId } = useTasks()
  const { isRunning } = useTimer()
  const router = useRouter()
  const { theme } = useTheme()
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [computedColors, setComputedColors] = useState<{[key: string]: string}>({});

  // Effect to compute colors based on theme AND forceMonochrome prop
  useEffect(() => {
    const newComputedColors: {[key: string]: string} = {};
    const primaryColor = getCssVariable('--primary');

    if (forceMonochrome) {
        // --- Monochrome Logic (mirrors PieChart logic) ---
        const baseLightness = 70; 
        const lightnessStep = 5; 
        tasks.forEach((task, index) => {
            const lightness = Math.max(30, Math.min(90, baseLightness - (index * lightnessStep)));
            const parts = primaryColor.match(/oklch\(([^ ]+) ([^ ]+) ([^)]+)\)/);
            if (parts && task.chartIndex) { // Also check if chartIndex exists
                 newComputedColors[task.chartIndex.toString()] = `oklch(${lightness / 100} ${parts[2]} ${parts[3]})`;
            } else if (task.chartIndex) {
                 newComputedColors[task.chartIndex.toString()] = primaryColor; // Fallback
            }
        });
    } else {
        // --- Standard Theme Color Logic --- 
        tasks.forEach(task => {
            if (task.chartIndex) { // Check if chartIndex exists
                newComputedColors[task.chartIndex.toString()] = getCssVariable(`--chart-${task.chartIndex}`);
            }
        });
    }
    
    setComputedColors(newComputedColors);
  }, [tasks, forceMonochrome, theme]);

  const handleEdit = (taskId: string) => {
    if (onEditTask) {
      onEditTask(taskId)
    } else {
      setEditingTaskId(taskId)
    }
  }

  const handleUpdate = (taskId: string, taskData: { name: string; goalTimeMinutes: number; isPriority?: boolean; startTime?: string }) => {
    updateTask(taskId, taskData)
    setEditingTaskId(null)
  }

  const handleDelete = (task: Task) => {
    deleteTask(task.id)
    toast(`"${task.name}" deleted`, {
      action: {
        label: "Undo",
        onClick: () => restoreTask(task),
      },
    })
  }

  // Function to handle starting a task timer
  const handleStartTask = (taskId: string) => {
    // Switching away from an already-running session (of a different task)
    // stops that session regardless - don't compound it by silently starting
    // this one too. Land idle instead so the switch is a conscious choice.
    const wouldInterruptRunningSession = isRunning && currentTaskId !== taskId;
    if (typeof window !== 'undefined') {
      localStorage.setItem("focuspie-selecting-task", "true");
      if (!wouldInterruptRunningSession) {
        // Picked up by the timer page once the newly-selected task has loaded,
        // so it can actually start the session instead of just landing idle.
        localStorage.setItem("focuspie-autostart-task", "true");
      }
    }
    setCurrentTaskId(taskId); // Set the task as current
    router.push('/timer'); // Navigate to the timer page
  };

  if (tasks.length === 0) {
    return <div className="text-center text-muted-foreground py-4 text-task-title">No tasks yet. Add your first task below.</div>
  }

  return (
    <div className="space-y-md">
      {tasks.map((task) => (
        <div key={task.id} className="group transition-all duration-300">
          {editingTaskId === task.id ? (
            <div className="p-6 rounded-[1.5rem] bg-card/80 backdrop-blur-md border border-white/10 shadow-xl">
              <h3 className="font-semibold text-lg text-foreground mb-4">Edit Task</h3>
              <TaskForm
                initialValues={{
                  id: task.id,
                  name: task.name,
                  goalTimeMinutes: task.goalTimeMinutes,
                  chartIndex: task.chartIndex,
                  isPriority: task.isPriority,
                  startTime: task.startTime,
                }}
                onSubmit={(data) => handleUpdate(task.id, data)}
                onCancel={() => setEditingTaskId(null)}
                standalone={false}
              />
            </div>
          ) : (
            <div
              className={`flex items-center justify-between p-4 sm:p-5 rounded-[1.25rem] border border-white/5 shadow-premium hover:-translate-y-1 transition-all duration-300 text-primary-foreground backdrop-blur-md relative overflow-hidden group/item ${showControls && !task.id.startsWith("demo-") ? "cursor-pointer" : ""}`}
              style={{ backgroundColor: computedColors[task.chartIndex?.toString()] ? `${computedColors[task.chartIndex?.toString()]}` : 'var(--card)' }}
              onClick={() => { if (showControls && !task.id.startsWith("demo-")) handleStartTask(task.id); }}
              role={showControls && !task.id.startsWith("demo-") ? "button" : undefined}
              tabIndex={showControls && !task.id.startsWith("demo-") ? 0 : undefined}
              onKeyDown={(e) => {
                if (showControls && !task.id.startsWith("demo-") && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleStartTask(task.id);
                }
              }}
              aria-label={showControls && !task.id.startsWith("demo-") ? `Start focus session for ${task.name}` : undefined}
            >
              {/* Subtle overlay for depth */}
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex flex-col gap-0.5 sm:gap-1 ml-1 sm:ml-4 relative z-10">
                <div className="font-semibold text-base sm:text-lg tracking-tight flex items-center drop-shadow-sm">
                  {task.isPriority && (
                    <Flag className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 fill-white/90 text-white" />
                  )}
                  {task.name}
                </div>
                <div className="text-xs sm:text-sm font-medium opacity-90 flex items-center gap-2">
                  <span className="bg-black/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {Math.floor(task.goalTimeMinutes / 60) > 0 && `${Math.floor(task.goalTimeMinutes / 60)}h `}
                    {task.goalTimeMinutes % 60}m
                  </span>
                  {task.progressMinutes > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {task.progressMinutes}m done
                    </span>
                  )}
                </div>
              </div>

              {showControls && (
                <div className="flex gap-1 sm:gap-2 relative z-10 sm:opacity-0 group-hover/item:opacity-100 transition-all duration-300 translate-x-4 group-hover/item:translate-x-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-white/25 text-white"
                    onClick={(e) => { e.stopPropagation(); handleEdit(task.id); }}
                    aria-label={`Edit ${task.name}`}
                    title="Edit task"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-white/25 text-white"
                    onClick={(e) => { e.stopPropagation(); handleDelete(task); }}
                    aria-label={`Delete ${task.name}`}
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}