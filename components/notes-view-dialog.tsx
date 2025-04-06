"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useTasks } from "@/context/task-context"
import { format } from 'date-fns'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2, Check, X } from "lucide-react"
import type { Note } from "@/types/task"

interface NotesViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotesViewDialog({ open, onOpenChange }: NotesViewDialogProps) {
  const { tasks, updateTaskNote, deleteTaskNote } = useTasks()

  // State for inline editing
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  // Filter tasks that have notes
  const tasksWithNotes = tasks.filter(task => task.notes && task.notes.length > 0)

  const handleEditStart = (note: Note) => {
    setEditingNoteId(note.id)
    setEditText(note.text)
  }

  const handleEditCancel = () => {
    setEditingNoteId(null)
    setEditText("")
  }

  const handleEditSave = (taskId: string) => {
    if (editingNoteId && editText.trim() !== "") {
      updateTaskNote(taskId, editingNoteId, editText)
    }
    handleEditCancel() // Reset editing state regardless
  }

  const handleDelete = (taskId: string, noteId: string) => {
    // Optional: Add a confirmation dialog here?
    deleteTaskNote(taskId, noteId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col bg-white text-gray-800">
        <DialogHeader>
          <DialogTitle>Task Notes</DialogTitle>
          <DialogDescription className="text-gray-600">
            Notes added during your focus sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
          {tasksWithNotes.length > 0 ? (
            tasksWithNotes.map(task => (
              <div key={task.id} className="border-b pb-3 last:border-b-0">
                <h4 className="font-semibold mb-2 text-gray-800" style={{ color: task.color }}>
                  {task.name}
                </h4>
                <ul className="space-y-3 pl-1">
                  {task.notes.map(note => (
                    <li key={note.id} className="text-sm text-gray-600 group">
                      {editingNoteId === note.id ? (
                        // Edit Mode
                        <div className="flex flex-col gap-2 w-full">
                           <div className="font-medium text-gray-400">
                              {format(new Date(note.timestamp), 'MMM d, HH:mm')}:
                           </div>
                           <Textarea 
                             value={editText} 
                             onChange={(e) => setEditText(e.target.value)} 
                             className="min-h-[80px] text-sm w-full resize-y"
                           />
                           <div className="flex justify-end gap-2 mt-1">
                             <Button size="sm" variant="outline" className="h-7 text-red-600" onClick={handleEditCancel}>
                               <X size={14} className="mr-1"/> Cancel
                             </Button>
                             <Button size="sm" variant="outline" className="h-7 text-green-600" onClick={() => handleEditSave(task.id)}>
                               <Check size={14} className="mr-1"/> Save
                             </Button>
                           </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex flex-col w-full group-hover:bg-gray-50 rounded p-1 -ml-1">
                          <div className="font-medium text-gray-500">
                            {format(new Date(note.timestamp), 'MMM d, HH:mm')}
                          </div>
                          <div className="flex items-start mt-1">
                            <div className="whitespace-pre-wrap break-words flex-1">{note.text}</div>
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditStart(note)}>
                                <Pencil size={14}/>
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => handleDelete(task.id, note.id)}>
                                <Trash2 size={14}/>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No notes added yet.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 