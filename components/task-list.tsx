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
    return <div className="text-center text-gray-500 py-4">No tasks yet. Add your first task below.</div>
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id}>
          {editingTaskId === task.id ? (
            <TaskForm
              initialValues={{
                name: task.name,
                goalTimeMinutes: task.goalTimeMinutes,
                color: task.color,
              }}
              onSubmit={(data) => handleUpdate(task.id, data)}
              onCancel={() => setEditingTaskId(null)}
            />
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: task.color }} />
                <div>
                  <div className="font-medium">{task.name}</div>
                  <div className="text-sm text-gray-500">
                    {Math.floor(task.goalTimeMinutes / 60) > 0 && `${Math.floor(task.goalTimeMinutes / 60)}h `}
                    {task.goalTimeMinutes % 60}m
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(task.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

