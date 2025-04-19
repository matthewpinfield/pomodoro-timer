"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTasks } from "@/context/task-context"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import type { Task } from "@/types/task"

interface TaskFormProps {
  onSubmit: (task: { name: string; goalTimeMinutes: number; isPriority?: boolean }) => void
  onCancel?: () => void
  initialValues?: Partial<Task>
  workdayHours?: number
  standalone?: boolean
}

export function TaskForm({
  onSubmit,
  onCancel,
  initialValues,
  workdayHours = 8,
  standalone = false,
}: TaskFormProps) {
  const { tasks } = useTasks()
  const [name, setName] = useState(initialValues?.name || "")
  const [hours, setHours] = useState(Math.floor((initialValues?.goalTimeMinutes || 0) / 60).toString())
  const [minutes, setMinutes] = useState(((initialValues?.goalTimeMinutes || 0) % 60).toString())
  const [isPriority, setIsPriority] = useState(initialValues?.isPriority || false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(initialValues?.name || "")
    setHours(Math.floor((initialValues?.goalTimeMinutes || 0) / 60).toString())
    setMinutes(((initialValues?.goalTimeMinutes || 0) % 60).toString())
    setIsPriority(initialValues?.isPriority || false)
    setError(null)
  }, [initialValues])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsedHours = parseInt(hours, 10) || 0
    const parsedMinutes = parseInt(minutes, 10) || 0
    const goalTimeMinutes = parsedHours * 60 + parsedMinutes

    if (!name.trim()) {
      setError("Task name cannot be empty.")
      return
    }

    if (goalTimeMinutes <= 0) {
      setError("Task duration must be greater than 0.")
      return
    }

    const otherTasksTotalMinutes = tasks
      .filter((task) => task.id !== initialValues?.id)
      .reduce((sum, task) => sum + task.goalTimeMinutes, 0)
    const newTotalMinutes = otherTasksTotalMinutes + goalTimeMinutes
    const workdayMinutes = workdayHours * 60

    if (newTotalMinutes > workdayMinutes) {
      setError(
        `This would exceed your ${workdayHours}-hour workday by ${Math.floor((newTotalMinutes - workdayMinutes) / 60)}h ${(newTotalMinutes - workdayMinutes) % 60}m`,
      )
      return
    }

    onSubmit({
      name,
      goalTimeMinutes,
      isPriority,
    })

    if (standalone || !initialValues?.id) {
      setName("")
      setHours("0")
      setMinutes("0")
      setIsPriority(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-md">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="w-icon-base h-icon-base" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-1 mb-4">
        <Label htmlFor="name" className="text-base px-w-xs">Task Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter task name"
          className="w-full px-3 py-2 text-base"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-md">
          <Label htmlFor="hours" className="text-base px-w-xs">Hours</Label>
          <Input
            id="hours"
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 text-base"
          />
        </div>
        
        <div className="space-y-md">
          <Label htmlFor="minutes" className="text-base px-w-xs">Minutes</Label>
          <Input
            id="minutes"
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 text-base"
          />
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <Switch
            id="priority-switch"
            checked={isPriority}
            onCheckedChange={setIsPriority}
            aria-label="Mark task as priority"
          />
          <Label htmlFor="priority-switch" className="text-base cursor-pointer">
            Mark as Priority
          </Label>
        </div>

        <div className="flex space-x-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
           >
            Reset
          </Button>
          <Button type="submit">
            {initialValues?.id ? "Update" : "Add"} Task
          </Button>
        </div>
      </div>
    </form>
  )

  if (standalone) {
    return (
      <Dialog>
        <DialogContent className="sm:max-w-dialog-lg max-h-dialog overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{initialValues ? 'Edit Task' : 'Add Task'}</DialogTitle>
            <DialogDescription>
              {initialValues ? 'Update your task details.' : 'Create a new task for your day.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-xl py-xl">
            {formContent}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return formContent
}


