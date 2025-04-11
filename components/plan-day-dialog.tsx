"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DialogContentNoClose } from "@/components/ui/dialog-no-close"
import { Button } from "@/components/ui/button"
import { TaskForm } from "@/components/task-form"
import { TaskList } from "@/components/task-list"
import { useTasks } from "@/context/task-context"
import { PlusCircle } from "lucide-react"

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
      <DialogContentNoClose className="sm:max-w-dialog-lg max-h-dialog overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold px-w-xs py-xs">Plan Your Day</DialogTitle>
            <DialogDescription className="!text-dialog-description !text-gray-500 px-w-xs py-xs">
              Add tasks and set their duration for today.
            </DialogDescription>
          </div>
          <Button 
            onClick={() => onOpenChange(false)}
            variant="ghost" 
            className="text-base px-w-lg py-md font-medium hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            Done
          </Button>
        </DialogHeader>
        <div className="flex flex-col gap-xl py-xl px-w-xs">
          {isAddingTask ? (
            <div className="mb-xl p-xl border rounded-md bg-white dark:bg-slate-800 shadow-sm">
              <h3 className="text-dialog-title font-medium mb-xl px-w-sm">{editingTask ? "Edit Task" : "Add New Task"}</h3>
              <TaskForm
                onSubmit={editingTask ? handleUpdateTask : handleAddTask}
                onCancel={handleCancel}
                useAutoColors={!editingTask}
                standalone={false}
                initialValues={
                  editingTask
                    ? {
                        id: editingTask.id,
                        name: editingTask.name,
                        goalTimeMinutes: editingTask.goalTimeMinutes,
                        color: editingTask.color,
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <Button onClick={() => setIsAddingTask(true)} className="w-full flex items-center justify-center gap-md bg-blue-500 hover:bg-blue-600 text-white font-semibold py-lg px-xl rounded-lg shadow-md hover:shadow-lg transition-all text-dialog-button">
              <PlusCircle className="w-icon-lg h-icon-lg" />
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
            <p className="text-center text-gray-500 py-xl text-task-title">No tasks yet. Add your first task above.</p>
          )}
        </div>
      </DialogContentNoClose>
    </Dialog>
  )
}

