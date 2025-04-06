"use client"
import { useRouter } from "next/navigation"
import { PieChart } from "@/components/pie-chart"
import { TaskLegend } from "@/components/task-legend"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { useSettings } from "@/context/settings-context"
import { PlusCircle, Menu, ArrowLeft } from "lucide-react"
import { PlanDayDialog } from "@/components/plan-day-dialog"
import { useState } from "react"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotesViewDialog } from "@/components/notes-view-dialog"
import { UserGuideDialog } from "@/components/user-guide-dialog"
import { ResetProgressButton } from "@/components/reset-progress-button"

export default function PieChartView() {
  const router = useRouter()
  const { tasks, setCurrentTaskId } = useTasks()
  const { settings } = useSettings()
  const [planDayOpen, setPlanDayOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [notesViewOpen, setNotesViewOpen] = useState(false)
  const [userGuideOpen, setUserGuideOpen] = useState(false)
  // Get workday hours from settings
  const workdayHours = settings.workdayHours

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-50 to-white p-2 sm:p-4">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pb-2 mb-2 sm:mb-4 flex items-center justify-between w-full border-b border-gray-200/75"
      >
        <div className="w-10"></div>
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">FocusPie</h1>
          <p className="text-gray-500">Your daily focus plan</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-10 h-10 relative z-20 flex items-center justify-center">
              <Menu className="h-6 w-6 text-gray-700" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50">
            <DropdownMenuLabel>Menu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setNotesViewOpen(true)}>
              View Notes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setUserGuideOpen(true)}>
              User Guide
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <ResetProgressButton />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert("About clicked!")}>About</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.header>

      <main className="pt-2 sm:pt-4 flex-1 w-full mx-auto max-w-[95%] sm:max-w-md md:max-w-3xl lg:max-w-4xl flex flex-col items-center overflow-hidden pb-4">
        <div className="w-full flex flex-col md:flex-row md:items-start md:justify-center md:gap-8 lg:gap-12">
          <div className="w-full md:w-auto flex justify-center mb-2 sm:mb-4 md:mb-0">
            <PieChart
              tasks={tasks}
              onTaskSelect={handleTaskSelect}
              onCenterClick={handlePlanDay}
              workdayHours={workdayHours}
            />
          </div>

          <div className="w-full md:w-auto md:min-w-[300px] lg:min-w-[350px] mb-2 sm:mb-4 md:pt-0">
            <TaskLegend tasks={tasks} workdayHours={workdayHours} onTaskClick={handleTaskClick} />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full mt-4 md:mt-8 px-2"
        >
          <Button
            onClick={handlePlanDay}
            className="mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all h-10 px-4 py-2 sm:h-11 sm:px-8 sm:rounded-md active:scale-95"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Plan My Day</span>
          </Button>
        </motion.div>
      </main>
      <PlanDayDialog open={planDayOpen} onOpenChange={setPlanDayOpen} editTaskId={editTaskId} />
      <NotesViewDialog open={notesViewOpen} onOpenChange={setNotesViewOpen} />
      <UserGuideDialog open={userGuideOpen} onOpenChange={setUserGuideOpen} />
    </div>
  )
}

