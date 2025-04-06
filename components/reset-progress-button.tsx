"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { RotateCcw } from "lucide-react"

export function ResetProgressButton() {
  const { resetAllTaskProgress } = useTasks()
  const [isOpen, setIsOpen] = useState(false)

  const handleReset = () => {
    resetAllTaskProgress()
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-gray-500">
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset Progress
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset All Task Progress</AlertDialogTitle>
          <AlertDialogDescription>
            This will reset all task progress to 0. Your progress will be backed up for analysis.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset}>Reset Progress</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 