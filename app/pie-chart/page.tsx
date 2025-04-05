"use client"
import { useRouter } from "next/navigation"
import { PieChart } from "@/components/pie-chart"
import { TaskLegend } from "@/components/task-legend"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { PlusCircle } from "lucide-react"
import { PlanDayDialog } from "@/components/plan-day-dialog"
import { useState } from "react"
import { motion } from "framer-motion"

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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white p-4">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 text-center"
      >
        <h1 className="text-3xl font-bold text-gray-800">FocusPie</h1>
        <p className="text-gray-500">Your daily focus plan</p>
      </motion.header>

      <main className="flex-1 max-w-md mx-auto w-full flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full flex justify-center mb-6"
        >
          <PieChart
            tasks={tasks}
            onTaskSelect={handleTaskSelect}
            onCenterClick={handlePlanDay}
            workdayHours={workdayHours}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full mb-8"
        >
          <TaskLegend tasks={tasks} workdayHours={workdayHours} onTaskClick={handleTaskClick} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Button
            onClick={handlePlanDay}
            className="w-full max-w-xs flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Plan My Day</span>
          </Button>
        </motion.div>
      </main>
      <PlanDayDialog open={planDayOpen} onOpenChange={setPlanDayOpen} editTaskId={editTaskId} />
    </div>
  )
}

