"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useTasks } from "@/context/task-context"

interface AddNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
}

export function AddNoteDialog({ open, onOpenChange, taskId }: AddNoteDialogProps) {
  const { addTaskNote } = useTasks()
  const [note, setNote] = useState("")

  const handleSubmit = () => {
    if (note.trim()) {
      addTaskNote(taskId, note)
      setNote("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Write your note here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

