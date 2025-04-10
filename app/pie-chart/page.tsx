"use client"
import { useRouter } from "next/navigation"
import { PieChart } from "@/components/pie-chart"
import { TaskLegend } from "@/components/task-legend"
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
  // Default workday is 8 hours - this would come from settings in a real app
  const workdayHours = 8

  // Handle task selection
  const handleTaskSelect = (taskId: string) => {
    setCurrentTaskId(taskId)
    router.push("/timer")
  }

  // Open task management modal
  const handlePlanDay = () => {
    setEditTaskId(null)
    setPlanDayOpen(true)
  }

  // Handle task click in the legend
  const handleTaskClick = (taskId: string) => {
    setEditTaskId(taskId)
    setPlanDayOpen(true)
  }

  // Empty state content
  const EmptyState = () => (
    <div className="text-center w-full max-w-xs mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-2">FocusPie</h2>
        <p className="text-sm text-gray-600 mb-6">Visualize. Focus. Achieve.</p>
        
        <div className="flex flex-col w-full max-w-xs mx-auto space-y-4 mt-4 mb-6 pl-[10px]">
          <div className="flex items-start space-x-3 text-left">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">Plan your day with purpose.</p>
          </div>
          
          <div className="flex items-start space-x-3 text-left">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">Create time blocks, track your progress.</p>
          </div>
          
          <div className="flex items-start space-x-3 text-left">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">Dive into deep work—all in one glance.</p>
          </div>
          
          <div className="flex items-start space-x-3 text-left">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">Turn your hours into accomplishments.</p>
          </div>
          
          <div className="flex items-start space-x-3 text-left">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-600">Ready to transform your productivity?</p>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="inline-block"
      >
        <Button
          onClick={handlePlanDay}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all mb-6"
          size="lg"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Plan My Day</span>
        </Button>
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-6xl flex flex-col md:flex-row md:gap-8 md:items-start">
        {/* Left column: Pie Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center md:w-1/2 mb-6 md:mb-0"
        >
          <PieChart
            tasks={tasks}
            onTaskSelect={handleTaskSelect}
            onCenterClick={handlePlanDay}
            workdayHours={workdayHours}
          />
        </motion.div>

        {/* Right column: Task info and controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-4 flex flex-col items-stretch justify-center w-full max-w-[350px]"
        >
          {tasks.length === 0 ? (
            <>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">FocusPie</h2>
              <p className="text-sm text-gray-600 mb-6">Visualize. Focus. Achieve.</p>
              <div className="flex flex-col space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">Plan your day with purpose.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">Create time blocks, track your progress.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">Dive into deep work—all in one glance.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">Turn your hours into accomplishments.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">Ready to transform your productivity?</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Tasks</h2>
              <div className="mb-6">
                <TaskList tasks={tasks} onEditTask={handleTaskClick} />
              </div>
            </>
          )}
          <div className="mt-6">
            <Button
              onClick={handlePlanDay}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all mb-2"
              size="lg"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Plan My Day</span>
            </Button>
          </div>
        </motion.div>
      </div>
      {/* Ensure the PlanDayDialog is always rendered, its visibility controlled by its props */}
      <PlanDayDialog open={planDayOpen} onOpenChange={setPlanDayOpen} editTaskId={editTaskId} />

      {/* Example Time Allocation under Pie Chart - only show when no tasks */}
      {tasks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center text-sm text-gray-600 w-full mt-4"
        >
          <div className="flex flex-row justify-center gap-8 w-full max-w-3xl mx-auto text-xs">
            {[
              { name: 'Deep Work', time: '2h', color: '#4f46e5' },
              { name: 'Meetings', time: '1h 30m', color: '#f97316' },
              { name: 'Planning', time: '1h', color: '#14b8a6' },
              { name: 'Breaks', time: '30m', color: '#ec4899' }
            ].map(task => (
              <div key={task.name} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: task.color }}></div>
                <span>{task.name} ({task.time})</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

