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
    return <div className="text-center text-gray-500 py-md text-task-title">No tasks yet. Add your first task below.</div>
  }

  return (
    <div className="space-y-md">
      {tasks.map((task) => (
        <div key={task.id}>
          {editingTaskId === task.id ? (
            <div className="p-md border rounded-md bg-white shadow-sm">
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
            <div className="flex items-center justify-between p-lg bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div className="w-icon-lg h-icon-lg rounded-full mr-lg" style={{ backgroundColor: task.color }} />
                <div className="flex flex-col gap-xs">
                  <div className="text-[hsl(var(--foreground))] font-medium px-sm">{task.name}</div>
                  <div className="text-task-time text-gray-500 px-sm">
                    {Math.floor(task.goalTimeMinutes / 60) > 0 && `${Math.floor(task.goalTimeMinutes / 60)}h `}
                    {task.goalTimeMinutes % 60}m
                  </div>
                </div>
              </div>

              <div className="flex gap-sm">
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

