"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TaskForm } from "@/components/task-form"
import { TaskList } from "@/components/task-list"
import { useTasks } from "@/context/task-context"
import { Plus } from "lucide-react"

interface PlanDayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTaskId?: string | null
}

export function PlanDayDialog({ open, onOpenChange, editTaskId = null }: PlanDayDialogProps) {
  const { tasks, addTask, updateTask } = useTasks()
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<any>(null)

  // When editTaskId changes, find the task and set it for editing
  useEffect(() => {
    if (editTaskId) {
      const taskToEdit = tasks.find((task) => task.id === editTaskId)
      if (taskToEdit) {
        setEditingTask(taskToEdit)
        setIsAddingTask(true)
      }
    } else {
      setEditingTask(null)
    }
  }, [editTaskId, tasks, open])

  const handleAddTask = (task: { name: string; goalTimeMinutes: number; color: string }) => {
    addTask(task)
    setIsAddingTask(false)
    setEditingTask(null)
  }

  const handleUpdateTask = (task: { name: string; goalTimeMinutes: number; color: string }) => {
    if (editingTask) {
      updateTask(editingTask.id, task)
      setIsAddingTask(false)
      setEditingTask(null)
    }
  }

  const handleCancel = () => {
    setIsAddingTask(false)
    setEditingTask(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan My Day</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isAddingTask ? (
            <div className="mb-6 p-4 border rounded-md bg-white shadow-sm">
              <h3 className="font-medium mb-4">{editingTask ? "Edit Task" : "Add New Task"}</h3>
              <TaskForm
                onSubmit={editingTask ? handleUpdateTask : handleAddTask}
                onCancel={handleCancel}
                useAutoColors={!editingTask}
                initialValues={
                  editingTask
                    ? {
                        name: editingTask.name,
                        goalTimeMinutes: editingTask.goalTimeMinutes,
                        color: editingTask.color,
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <Button onClick={() => setIsAddingTask(true)} className="w-full mb-6">
              <Plus className="w-4 h-4 mr-2" />
              Add New Task
            </Button>
          )}

          {tasks.length > 0 ? (
            <TaskList
              tasks={tasks}
              onEditTask={(taskId) => {
                const taskToEdit = tasks.find((task) => task.id === taskId)
                if (taskToEdit) {
                  setEditingTask(taskToEdit)
                  setIsAddingTask(true)
                }
              }}
            />
          ) : (
            <p className="text-center text-gray-500 py-4">No tasks yet. Add your first task above.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

