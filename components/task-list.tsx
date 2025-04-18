"use client"

import { useTasks } from "@/context/task-context"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import { TaskForm } from "@/components/task-form"
import type { Task } from "@/types/task"

interface TaskListProps {
  tasks?: Task[]
  onEditTask?: (taskId: string) => void
}

export function TaskList({ tasks = [], onEditTask }: TaskListProps) {
  const { deleteTask, updateTask } = useTasks()
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

  const handleEdit = (taskId: string) => {
    if (onEditTask) {
      onEditTask(taskId)
    } else {
      setEditingTaskId(taskId)
    }
  }

  const handleUpdate = (taskId: string, taskData: { name: string; goalTimeMinutes: number; color: string }) => {
    updateTask(taskId, taskData)
    setEditingTaskId(null)
  }

  if (tasks.length === 0) {
    return <div className="text-center text-gray-500 py-4 text-task-title">No tasks yet. Add your first task below.</div>
  }

  return (
    <div className="space-y-md">
      {tasks.map((task) => (
        <div key={task.id}>
          {editingTaskId === task.id ? (
            <div className="p-4 border rounded-md bg-white shadow-sm">
              <h3 className="font-medium mb-md">Edit Task</h3>
              <TaskForm
                initialValues={{
                  id: task.id,
                  name: task.name,
                  goalTimeMinutes: task.goalTimeMinutes,
                  color: task.color,
                }}
                onSubmit={(data) => handleUpdate(task.id, data)}
                onCancel={() => setEditingTaskId(null)}
                standalone={false}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div className="w-icon-lg h-icon-lg rounded-full mr-lg" style={{ backgroundColor: task.color }} />
                <div className="flex flex-col gap-xs">
                  <div className="text-[hsl(var(--foreground))] font-medium px-2">{task.name}</div>
                  <div className="text-task-time text-gray-500 px-2">
                    {Math.floor(task.goalTimeMinutes / 60) > 0 && `${Math.floor(task.goalTimeMinutes / 60)}h `}
                    {task.goalTimeMinutes % 60}m
                    {task.progressMinutes > 0 && (
                      <span className="ml-2 text-xs">
                        • {task.progressMinutes}m worked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-xl w-xl sm:h-lg sm:w-lg" 
                  onClick={() => handleEdit(task.id)}
                >
                  <Edit className="w-icon-base h-icon-base" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-xl w-xl sm:h-lg sm:w-lg" 
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="w-icon-base h-icon-base" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

