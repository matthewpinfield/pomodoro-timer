"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getRandomColor } from "@/lib/utils"
import { useTasks } from "@/context/task-context"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TaskFormProps {
  onSubmit: (task: { name: string; goalTimeMinutes: number; color: string }) => void
  onCancel: () => void
  initialValues?: {
    id?: string;
    name: string;
    goalTimeMinutes: number;
    color: string;
  }
  useAutoColors?: boolean
  workdayHours?: number
}

export function TaskForm({
  onSubmit,
  onCancel,
  initialValues,
  useAutoColors = false,
  workdayHours = 8,
}: TaskFormProps) {
  const { tasks } = useTasks()
  const [name, setName] = useState(initialValues?.name || "")
  const [hours, setHours] = useState(initialValues ? Math.floor(initialValues.goalTimeMinutes / 60).toString() : "")
  const [minutes, setMinutes] = useState(initialValues ? (initialValues.goalTimeMinutes % 60).toString() : "")
  const [color, setColor] = useState(initialValues?.color || getRandomColor())
  const [error, setError] = useState<string | null>(null)

  // Get a unique color that's not already used by other tasks
  useEffect(() => {
    if (useAutoColors && !initialValues) {
      const usedColors = tasks.map((task) => task.color)
      let newColor = getRandomColor()

      // Try up to 10 times to get a unique color
      let attempts = 0
      while (usedColors.includes(newColor) && attempts < 10) {
        newColor = getRandomColor()
        attempts++
      }

      setColor(newColor)
    }
  }, [useAutoColors, initialValues, tasks])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const hoursNum = Number.parseInt(hours) || 0
    const minutesNum = Number.parseInt(minutes) || 0
    const goalTimeMinutes = hoursNum * 60 + minutesNum

    // Validate task name
    if (name.trim() === "") {
      setError("Task name cannot be empty")
      return
    }

    // Check for duplicate task name
    const isDuplicateName = tasks.some(
      (task) => task.name.toLowerCase() === name.toLowerCase() && (!initialValues || task.id !== initialValues.id),
    )

    if (isDuplicateName) {
      setError("A task with this name already exists")
      return
    }

    // Validate task time
    if (goalTimeMinutes === 0) {
      setError("Task time must be greater than 0")
      return
    }

    // Check if total time exceeds workday
    const workdayMinutes = workdayHours * 60
    const currentTotalMinutes = tasks.reduce((sum, task) => {
      // Don't count the current task if we're editing it
      if (initialValues && task.id === initialValues.id) {
        return sum
      }
      return sum + task.goalTimeMinutes
    }, 0)

    const newTotalMinutes = currentTotalMinutes + goalTimeMinutes

    if (newTotalMinutes > workdayMinutes) {
      setError(
        `This would exceed your ${workdayHours}-hour workday by ${Math.floor((newTotalMinutes - workdayMinutes) / 60)}h ${(newTotalMinutes - workdayMinutes) % 60}m`,
      )
      return
    }

    onSubmit({
      name,
      goalTimeMinutes,
      color: useAutoColors ? color : color,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="task-name">Task Name</Label>
        <Input
          id="task-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter task name"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="task-hours">Hours</Label>
          <Input
            id="task-hours"
            type="number"
            min="0"
            max="24"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="task-minutes">Minutes</Label>
          <Input
            id="task-minutes"
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      {!useAutoColors && (
        <div>
          <Label htmlFor="task-color">Color</Label>
          <div className="flex items-center space-x-2">
            <input
              id="task-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-md border border-gray-300"
            />
            <span className="text-sm text-gray-500">Choose a color for this task</span>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialValues ? "Update Task" : "Add Task"}</Button>
      </div>
    </form>
  )
}

