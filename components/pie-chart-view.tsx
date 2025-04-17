"use client"

import { useRouter } from "next/navigation"
import { PieChart } from "@/components/pie-chart"
// import { TaskLegend } from "@/components/task-legend" // Removed if unused
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { PlusCircle, Clock, CheckCircle, ArrowRight } from "lucide-react"
import { PlanDayDialog } from "@/components/plan-day-dialog"
import { useState } from "react"
import { motion } from "framer-motion"
import { TaskList } from "@/components/task-list"

export default function PieChartView() {
  const router = useRouter()
  const { tasks, setCurrentTaskId } = useTasks()
  const [planDayOpen, setPlanDayOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const workdayHours = 8
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  // --- Handler functions remain the same ---
  const handleTaskSelect = async (taskId: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem("focuspie-selecting-task", "true");
      }
      await setCurrentTaskId(taskId);
      router.push(basePath + "/timer");
    } catch (error) {
      console.error("Error selecting task:", error);
      router.push(basePath + "/timer");
    }
  }

  const handlePlanDay = () => {
    setEditTaskId(null)
    setPlanDayOpen(true)
  }

  const handleTaskClick = (taskId: string) => {
    setEditTaskId(taskId)
    setPlanDayOpen(true)
  }

  // --- EmptyStateContent remains the same ---
  const EmptyStateContent = () => (
    <>
      <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-sm">FocusPie</h2>
      <p className="text-base text-gray-600 mb-lg">Visualize. Focus. Achieve.</p>
      <div className="flex flex-col space-y-lg">
        {/* ... CheckCircle items ... */}
        <div className="flex items-start space-x-sm">
          <CheckCircle className="h-icon-base w-icon-base text-green-500 flex-shrink-0" />
          <p className="text-base text-gray-600">Plan your day with purpose.</p>
        </div>
        <div className="flex items-start space-x-sm">
          <CheckCircle className="h-icon-base w-icon-base text-green-500 flex-shrink-0" />
          <p className="text-base text-gray-600">Create time blocks, track your progress.</p>
        </div>
        <div className="flex items-start space-x-sm">
          <CheckCircle className="h-icon-base w-icon-base text-green-500 flex-shrink-0" />
          <p className="text-base text-gray-600">Dive into deep work—all in one glance.</p>
        </div>
        <div className="flex items-start space-x-sm">
          <CheckCircle className="h-icon-base w-icon-base text-green-500 flex-shrink-0" />
          <p className="text-base text-gray-600">Turn your hours into accomplishments.</p>
        </div>
        <div className="flex items-start space-x-sm">
          <CheckCircle className="h-icon-base w-icon-base text-green-500 flex-shrink-0" />
          <p className="text-base text-gray-600">Ready to transform your productivity?</p>
        </div>
      </div>
    </>
  )

  return (
    // ***** CHANGE 1 *****
    // Removed h-screen. Added h-full to fill the parent <main> from layout.tsx.
    // Keep flex flex-col if direct children need flex layout.
    <div className="flex flex-col h-full">
      {/* ***** CHANGE 2 ***** */}
      {/* Removed flex-1 and overflow-y-auto from this motion.main */}
      {/* Scrolling is now handled by the <main> tag in layout.tsx */}
      {/* Keep padding (py-lg etc.) */}
      <motion.main
        className="w-full max-w-7xl mx-auto px-w-md py-lg" // Removed flex-1, overflow-y-auto
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Container for Chart + Task Info row */}
        {/* Removed bottom margin (mb-xl, md:mb-xs) */}
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-center gap-lg">

          {/* Left column: Pie Chart Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            // ***** CHANGE 3 *****
            // Make chart flexible, constrain width, add min-h-0 safeguard.
            // Removed aspect-square for testing flex height issues, can be added back if needed.
            className="w-full md:flex-1 flex justify-center items-center mb-lg md:mb-0 md:max-w-[50%] min-h-0"
          >
            <div className="w-full h-full flex justify-center items-center">
              <PieChart
                tasks={tasks}
                onTaskSelect={handleTaskSelect}
                onCenterClick={handlePlanDay}
                workdayHours={workdayHours}
                // Ensure chart respects container bounds
                className="w-full h-full max-w-full max-h-full"
              />
            </div>
          </motion.div>

          {/* Right column: Task info and controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            // ***** CHANGE 4 *****
            // Use flex properties. Removed max-h-[dvh] units. Add min-h-0 safeguard.
            // Keep flex flex-col to stack items vertically.
            className="w-full md:flex-1 md:max-w-[50%] bg-white dark:bg-slate-800 rounded-lg shadow-sm p-lg flex flex-col min-h-0"
          >
            {/* ***** CHANGE 5 ***** */}
            {/* Content wrapper: flex-1 makes this grow, overflow-y-auto handles list scroll */}
            <div className="flex-1 mb-lg min-h-0">
              {tasks.length === 0 ? (
                <EmptyStateContent />
              ) : (
                <>
                  <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-lg">Today's Tasks</h2>
                  {/* TaskList doesn't need specific height/overflow */}
                  <TaskList tasks={tasks} onEditTask={handleTaskClick} />
                </>
              )}
            </div>
            {/* Button container: mt-auto pushes to bottom */}
            <div className="mt-auto pt-lg flex justify-start"> {/* Use mt-auto, added pt-lg */}
              <Button
                onClick={handlePlanDay}
                className="w-auto flex items-center justify-center gap-md bg-blue-500 hover:bg-blue-600 text-white font-semibold py-md px-lg rounded-lg shadow-md hover:shadow-lg transition-all text-lg"
                size="lg"
              >
                <PlusCircle className="w-icon-lg h-icon-lg" />
                <span>Plan My Day</span>
              </Button>
            </div>
          </motion.div>
        </div>

        <PlanDayDialog open={planDayOpen} onOpenChange={setPlanDayOpen} editTaskId={editTaskId} />

        {/* Time Allocation Legend - appears okay */}
        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-x-md gap-y-sm mt-lg mb-md px-md" // Added mt-lg
          >
            {[
              { name: 'Deep Work', time: '2h', color: '#4f46e5' },
              { name: 'Meetings', time: '1h 30m', color: '#f97316' },
              { name: 'Planning', time: '1h', color: '#14b8a6' },
              { name: 'Breaks', time: '30m', color: '#ec4899' }
            ].map(task => (
              <div key={task.name} className="flex items-center text-xl text-gray-500 dark:text-gray-400 font-inter">
                <div className="w-icon-sm h-icon-sm rounded-full mr-sm flex-shrink-0" style={{ backgroundColor: task.color }}></div>
                <span className="whitespace-nowrap">{task.name} ({task.time})</span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.main>
    </div>
  )
}