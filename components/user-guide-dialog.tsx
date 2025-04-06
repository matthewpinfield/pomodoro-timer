"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UserGuideDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserGuideDialog({ open, onOpenChange }: UserGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col bg-white text-gray-800">
        <DialogHeader className="flex-none pb-2">
          <DialogTitle>FocusPie User Guide</DialogTitle>
          <DialogDescription className="text-gray-600">
            Everything you need to know to use FocusPie effectively
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="px-6 space-y-6 text-sm">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">FocusPie is an ADHD-friendly Pomodoro timer that helps you manage your focus sessions and daily tasks. The app uses a visual pie chart to represent your tasks, making it easy to see how your day is planned and track your progress.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">How to Use FocusPie</h2>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Planning Your Day</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                  <li>Click the "Plan My Day" button in the center of the pie chart, or use the button at the bottom of the task list</li>
                  <li>Enter a task name and choose a color for easy identification</li>
                  <li>Set the time allocation - this determines your task's slice size in the pie chart</li>
                  <li>Click "Add Task" to save it</li>
                  <li>Your task will appear in both the pie chart and task legend</li>
                  <li>Edit tasks anytime by clicking them in the task legend</li>
                </ol>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Using the Timer</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                  <li>Start a task by clicking its slice in the pie chart or selecting it from the task legend</li>
                  <li>In the timer view, click the timer circle or use the Start button to begin</li>
                  <li>The timer follows the Pomodoro technique:
                    <ul className="list-disc pl-5 mt-1 text-gray-600">
                      <li>Work for 25 minutes (customizable in settings)</li>
                      <li>Take a 5-minute break</li>
                      <li>After 4 work sessions, take a longer 15-minute break</li>
                    </ul>
                  </li>
                  <li>Your progress is automatically saved to the task's total time</li>
                  <li>Switch tasks easily using the task list in the sidebar</li>
                </ol>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Customizing Your Timer</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                  <li>Click the gear icon in the navigation to access settings</li>
                  <li>Adjust your timer durations:
                    <ul className="list-disc pl-5 mt-1 text-gray-600">
                      <li>Work sessions: 1-60 minutes</li>
                      <li>Short breaks: 1-20 minutes</li>
                      <li>Long breaks: 5-30 minutes</li>
                    </ul>
                  </li>
                  <li>Set how many sessions before a long break (1-10)</li>
                  <li>Adjust your workday hours to affect pie chart calculations</li>
                  <li>Enable or disable browser notifications</li>
                </ol>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Taking Notes</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                  <li>During any task, click the "Add Note" button</li>
                  <li>Write down thoughts, progress, or reminders</li>
                  <li>Notes are saved with your task for later reference</li>
                  <li>View all notes from the dropdown menu</li>
                  <li>Edit or delete notes by hovering over them</li>
                </ol>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">Tips for Success</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li>Break large tasks into smaller, manageable chunks</li>
                <li>Use the pie chart to ensure your day is realistically planned</li>
                <li>Take your breaks - they help maintain focus</li>
                <li>Use notes to track progress and reduce anxiety about forgetting details</li>
                <li>Adjust timer durations to match your personal focus patterns</li>
                <li>Enable notifications to stay on track</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 