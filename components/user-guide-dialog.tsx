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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-white text-gray-800">
        <DialogHeader>
          <DialogTitle>FocusPie User Guide</DialogTitle>
          <DialogDescription className="text-gray-600">
            Everything you need to know to use FocusPie effectively
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 mt-2 -mx-6">
          <div className="px-6 py-4 space-y-6 text-sm">
            <section className="space-y-2">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">FocusPie is an ADHD-friendly Pomodoro timer application designed to help you manage your focus sessions and daily tasks. It features a visual pie chart representation of your tasks, customizable timers, and note-taking capabilities.</p>
            </section>
            
            <section className="space-y-2">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">Getting Started</h2>
              <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                <li><strong>Open FocusPie</strong> in your browser</li>
                <li><strong>Plan Your Day</strong> by adding tasks with their allocated time</li>
                <li><strong>Start a Timer</strong> by selecting a task from the pie chart</li>
                <li><strong>Complete Work Sessions</strong> using the Pomodoro technique</li>
                <li><strong>Take Notes</strong> during your focus sessions</li>
              </ol>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">Main Features</h2>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Pie Chart View</h3>
                <p className="text-xs text-gray-600 italic mb-1">The home screen displays a pie chart representing your daily tasks.</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
                  <li><strong>Pie Chart:</strong> Visual representation of your tasks with proportional time allocation</li>
                  <li><strong>Task Legend:</strong> List of your tasks with color coding, goal times, and progress tracking</li>
                  <li><strong>Plan My Day Button:</strong> Add or edit tasks</li>
                </ul>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Timer View</h3>
                <p className="text-xs text-gray-600 italic mb-1">The timer screen features a circular timer display with progress indicators.</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
                  <li><strong>Timer Circle:</strong> Shows progress of current interval and overall task completion</li>
                  <li><strong>Start/Pause Button:</strong> Control the timer in the center of the circle</li>
                  <li><strong>Mode Indicator:</strong> Shows current mode (Work, Short Break, Long Break)</li>
                  <li><strong>Task Reminders:</strong> Lists other tasks for the day</li>
                  <li><strong>Add Note Button:</strong> Take notes while working on a task</li>
                </ul>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Task Management</h3>
                 <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
                  <li><strong>Plan My Day Dialog:</strong> Add, edit, and delete tasks</li>
                  <li><strong>Task Properties:</strong> Name, color, and time allocation</li>
                  <li><strong>Task Legend:</strong> Shows progress bars for each task</li>
                  <li><strong>Click a Task:</strong> Easily edit an existing task</li>
                </ul>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Notes</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
                  <li><strong>Add Notes:</strong> Record thoughts, ideas, or progress during work sessions</li>
                  <li><strong>View Notes:</strong> Access all your notes from the dropdown menu</li>
                  <li><strong>Edit/Delete Notes:</strong> Manage your notes with inline editing</li>
                </ul>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Settings</h3>
                <p className="text-xs text-gray-600 italic mb-1">Customize your FocusPie experience by adjusting settings.</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
                  <li><strong>Timer Settings:</strong> Adjust work duration, short break, long break, and cycle count</li>
                  <li><strong>Theme Selection:</strong> Choose between light and dark modes</li>
                  <li><strong>Workday Hours:</strong> Set your default daily working hours</li>
                  <li><strong>Notifications:</strong> Enable or disable browser notifications</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">How to Use FocusPie</h2>
              <div className="space-y-1">
                <h3 className="text-base font-medium">Planning Your Day</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                  <li>Click the "Plan My Day" button on the home screen</li>
                  <li>Enter a task name</li>
                  <li>Choose a color for visual recognition</li>
                  <li>Set the time allocation in minutes</li>
                  <li>Click "Add Task"</li>
                  <li>Repeat for all your planned tasks</li>
                  <li>Edit tasks by clicking on them in the task legend</li>
                </ol>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Using the Timer</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                  <li>Click on a task in the pie chart to start working on it</li>
                  <li>Press the center of the timer circle to start the timer</li>
                  <li>Work until the timer ends or press center to pause</li>
                  <li>Take breaks when prompted</li>
                  <li>Add notes by clicking "Add Note" button</li>
                  <li>Return to pie chart by clicking "Back to Tasks"</li>
                </ol>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Managing Notes</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                  <li>Add notes during your work sessions</li>
                  <li>View all notes by selecting "View Notes" from the dropdown menu</li>
                  <li>Hover over a note to reveal Edit and Delete buttons</li>
                  <li>Click Edit to modify a note, then Save to confirm changes</li>
                  <li>Click Delete to remove a note</li>
                </ol>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-base font-medium">Customizing Settings</h3>
                <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                  <li>Access settings from the dropdown menu on the home screen</li>
                  <li>Adjust timer durations using sliders or number inputs</li>
                  <li>Set cycles before a long break</li>
                  <li>Choose your preferred theme</li>
                  <li>Set default workday hours</li>
                  <li>Enable/disable notifications</li>
                  <li>Click "Save Settings" to apply changes</li>
                </ol>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">Tips for Effective Use</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                <li><strong>Start Small:</strong> Begin with 2-3 tasks and realistic time allocations</li>
                <li><strong>Be Specific:</strong> Name tasks clearly to maintain focus</li>
                <li><strong>Take Breaks:</strong> Don't skip your break periods</li>
                <li><strong>Use Notes:</strong> Record insights or next steps during work sessions</li>
                <li><strong>Adjust Settings:</strong> Customize durations based on your personal focus patterns</li>
                <li><strong>Review Progress:</strong> Check your pie chart regularly to see task completion</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-semibold border-b pb-1 mb-2 text-gray-800">Pomodoro Technique Basics</h2>
              <p className="text-gray-600 leading-relaxed">The FocusPie app follows the Pomodoro technique:</p>
              <ol className="list-decimal pl-5 space-y-1.5 text-gray-600">
                <li>Work for a set period (default 25 minutes)</li>
                <li>Take a short break (default 5 minutes)</li>
                <li>After completing several work cycles, take a longer break (default 15 minutes)</li>
                <li>Repeat the process</li>
              </ol>
              <p className="text-gray-600 leading-relaxed">This technique helps maintain focus while preventing burnout through regular breaks.</p>
            </section>
            <div className="h-4"></div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 