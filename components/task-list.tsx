"use client"

import { useTasks } from "@/context/task-context"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Flag, Play } from "lucide-react"
import { useState, useEffect } from "react"
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
  const { deleteTask, updateTask, setCurrentTaskId } = useTasks()
  const router = useRouter()
  const { theme } = useTheme()
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [computedColors, setComputedColors] = useState<{[key: number]: string}>({});

  // Effect to compute colors based on theme AND forceMonochrome prop
  useEffect(() => {
    const newComputedColors: {[key: number]: string} = {};
    const primaryColor = getCssVariable('--primary');

    if (forceMonochrome) {
        // --- Monochrome Logic (mirrors PieChart logic) ---
        const baseLightness = 70; 
        const lightnessStep = 5; 
        tasks.forEach((task, index) => {
            const lightness = Math.max(30, Math.min(90, baseLightness - (index * lightnessStep)));
            const parts = primaryColor.match(/oklch\(([^ ]+) ([^ ]+) ([^)]+)\)/);
            if (parts && task.chartIndex) { // Also check if chartIndex exists
                 newComputedColors[task.chartIndex] = `oklch(${lightness / 100} ${parts[2]} ${parts[3]})`;
            } else if (task.chartIndex) {
                 newComputedColors[task.chartIndex] = primaryColor; // Fallback
            }
        });
    } else {
        // --- Standard Theme Color Logic --- 
        tasks.forEach(task => {
            if (task.chartIndex) { // Check if chartIndex exists
                newComputedColors[task.chartIndex] = getCssVariable(`--chart-${task.chartIndex}`);
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

  const handleUpdate = (taskId: string, taskData: { name: string; goalTimeMinutes: number }) => {
    updateTask(taskId, taskData)
    setEditingTaskId(null)
  }

  // Function to handle starting a task timer
  const handleStartTask = (taskId: string) => {
    setCurrentTaskId(taskId); // Set the task as current
    router.push('/timer'); // Navigate to the timer page
  };

  if (tasks.length === 0) {
    return <div className="text-center text-muted-foreground py-4 text-task-title">No tasks yet. Add your first task below.</div>
  }

  return (
    <div className="space-y-md">
      {tasks.map((task) => (
        <div key={task.id}>
          {editingTaskId === task.id ? (
            <div className="p-4 border rounded-md bg-card shadow-md">
              <h3 className="font-medium mb-md">Edit Task</h3>
              <TaskForm
                initialValues={{
                  id: task.id,
                  name: task.name,
                  goalTimeMinutes: task.goalTimeMinutes,
                  chartIndex: task.chartIndex,
                  isPriority: task.isPriority
                }}
                onSubmit={(data) => handleUpdate(task.id, data)}
                onCancel={() => setEditingTaskId(null)}
                standalone={false}
              />
            </div>
          ) : (
            <div 
              className="flex items-center justify-between p-4 rounded-md border shadow-md text-primary-foreground"
              style={{ backgroundColor: computedColors[task.chartIndex] || 'var(--card)' }}
            >
              <div className="flex flex-col gap-xs ml-4">
                <div className="font-medium px-2 flex items-center">
                  {task.isPriority && (
                    <Flag className="w-4 h-4 mr-2 fill-current" />
                  )}
                  {task.name}
                </div>
                <div className="text-task-time px-2 opacity-80">
                  {Math.floor(task.goalTimeMinutes / 60) > 0 && `${Math.floor(task.goalTimeMinutes / 60)}h `}
                  {task.goalTimeMinutes % 60}m
                  {task.progressMinutes > 0 && (
                    <span className="ml-2 text-xs">
                      • {task.progressMinutes}m worked
                    </span>
                  )}
                </div>
              </div>
              {showControls && (
                <div className="flex gap-1 sm:gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-xl w-xl sm:h-lg sm:w-lg hover:bg-white/20 text-primary-foreground"
                    onClick={() => handleEdit(task.id)}
                  >
                    <Edit className="w-icon-base h-icon-base" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-xl w-xl sm:h-lg sm:w-lg hover:bg-white/20 text-primary-foreground"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="w-icon-base h-icon-base" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-xl w-xl sm:h-lg sm:w-lg hover:bg-white/20 text-primary-foreground"
                    onClick={() => handleStartTask(task.id)}
                    disabled={task.id.startsWith("demo-")}
                    aria-label="Start Task"
                  >
                    <Play className="w-icon-base h-icon-base" />
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