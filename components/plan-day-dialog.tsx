"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { TaskForm } from "@/components/task-form"
import { TaskList } from "@/components/task-list"
import { useTasks } from "@/context/task-context"
import type { Task } from "@/types/task"

interface PlanDayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTaskId?: string | null
}

export function PlanDayDialog({ open, onOpenChange, editTaskId = null }: PlanDayDialogProps) {
  const { tasks, addTask, updateTask } = useTasks()
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    if (open && editTaskId) {
      const taskToEdit = tasks.find((task) => task.id === editTaskId)
      setEditingTask(taskToEdit || null)
    } else if (!open) {
        setEditingTask(null); 
    }
  }, [editTaskId, tasks, open])

  useEffect(() => {
    if (open && !editTaskId && editingTask?.id) {
       setEditingTask(null);
    } 
    if (open && editingTask && !tasks.find(t => t.id === editingTask.id)) {
        setEditingTask(null);
    }
  }, [open, editTaskId, editingTask, tasks]);

  const handleFormSubmit = (taskData: { name: string; goalTimeMinutes: number; isPriority?: boolean }) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData)
    } else {
      addTask(taskData)
    }
    setEditingTask(null) 
  }

  const handleFormCancel = () => {
    setEditingTask(null) 
  }
  
  const handleEditTaskClick = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task.id === taskId);
    setEditingTask(taskToEdit || null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-dialog-lg max-h-dialog overflow-y-auto border shadow-md"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Plan Your Day</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {editingTask ? "Edit task details below." : "Add a new task or manage existing tasks."} 
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <TaskForm
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            standalone={false}
            initialValues={editingTask ?? undefined} 
          />

          {tasks.length > 0 ? (
            <TaskList
              tasks={tasks}
              onEditTask={handleEditTaskClick} 
              showControls={false}
            />
          ) : (
            <p className="text-center text-muted-foreground py-4 text-task-title">No tasks yet. Add your first task using the form above.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

