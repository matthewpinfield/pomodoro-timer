"use client"

import { useRouter } from "next/navigation"
import { PieChart } from "@/components/pie-chart"
import { Button } from "@/components/ui/button"
import { useTasks } from "@/context/task-context"
import { useSettings } from "@/context/settings-context"
import { PlusCircle, CheckCircle, Clock } from "lucide-react"
import { PlanDayDialog } from "@/components/plan-day-dialog"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion" // Keep motion if desired
import { TaskList } from "@/components/task-list"
import { WelcomeDialog } from "@/components/welcome-dialog"

// --- !! IMPORTANT: ADJUST THESE VALUES !! ---
const HEADER_HEIGHT_ESTIMATE = '3.5rem'; // Approx px height of your sticky Header (e.g., 72px = 4.5rem)
const MAIN_PADDING_TOP = '1.5rem'; // Corresponds to p-6 in layout.tsx (6 * 0.25rem = 1.5rem)
const GAP_BELOW_CHART = '1rem'; // Desired space between bottom of chart and top of button (e.g., 1rem = 16px)
const GAP_BELOW_BUTTON = '1.5rem'; // Desired space between bottom of button area and top of task list (e.g., 1.5rem = 24px)
const WELCOME_SEEN_KEY = "focuspie-welcome-seen"; // localStorage key
// --- End Configuration ---

export default function PieChartView() {
  const router = useRouter()
  const { tasks, setCurrentTaskId } = useTasks()
  const { workdayHours, useMonochromeChart } = useSettings()
  const [planDayOpen, setPlanDayOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState<string | null>(null)
  const [welcomeOpen, setWelcomeOpen] = useState(false); // State for welcome dialog
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  // Calculate total task time for summary text
  const totalGoalMinutes = tasks.reduce((sum, task) => sum + task.goalTimeMinutes, 0);

  // Refs to measure element heights for sticky positioning
  const pieChartContainerRef = useRef<HTMLDivElement>(null);
  const buttonContainerRef = useRef<HTMLDivElement>(null); // Ref for button container height
  const [pieChartHeight, setPieChartHeight] = useState(0);
  const [buttonContainerHeight, setButtonContainerHeight] = useState(0); // State for button height

  // Calculate sticky top offsets dynamically
  // Top for the Chart = Header Height + Padding Above Main Content
  const chartStickyTop = `calc(${HEADER_HEIGHT_ESTIMATE} + ${MAIN_PADDING_TOP})`;

  // Top for the Button = Chart Top + Measured Chart Height + Gap Below Chart
  const buttonStickyTop = `calc(${chartStickyTop} + ${pieChartHeight}px + ${GAP_BELOW_CHART})`;

  // Effect to check if welcome screen should be shown
  useEffect(() => {
    const welcomeSeen = localStorage.getItem(WELCOME_SEEN_KEY) === "true";
    if (!welcomeSeen) {
      setWelcomeOpen(true);
    }
  }, []); // Run only once on mount

  // Measure element heights after render using ResizeObserver
  useEffect(() => {
    const chartElement = pieChartContainerRef.current;
    const buttonElement = buttonContainerRef.current;
    let chartObserver: ResizeObserver | null = null;
    let buttonObserver: ResizeObserver | null = null;

    if (chartElement) {
      chartObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setPieChartHeight(entry.contentRect.height);
        }
      });
      chartObserver.observe(chartElement);
      setPieChartHeight(chartElement.offsetHeight); // Initial measurement
    }

    if (buttonElement) {
      buttonObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setButtonContainerHeight(entry.contentRect.height);
        }
      });
      buttonObserver.observe(buttonElement);
      setButtonContainerHeight(buttonElement.offsetHeight); // Initial measurement
    }

    // Cleanup observers
    return () => {
      if (chartObserver && chartElement) chartObserver.unobserve(chartElement);
      if (buttonObserver && buttonElement) buttonObserver.unobserve(buttonElement);
      chartObserver?.disconnect();
      buttonObserver?.disconnect();
    };
  }, []); // Run once on mount

  // Determine the effective monochrome state for children
  const effectiveMonochrome = welcomeOpen || useMonochromeChart;

  // --- Handlers ---
  const handleTaskSelect = async (taskId: string) => {
    try { if (typeof window !== 'undefined') { localStorage.setItem("focuspie-selecting-task", "true"); } await setCurrentTaskId(taskId); router.push(basePath + "/timer"); } catch (error) { console.error("Error selecting task:", error); router.push(basePath + "/timer"); }
  };
  const handlePlanDay = () => { setEditTaskId(null); setPlanDayOpen(true); };
  const handleTaskClick = (taskId: string) => { setEditTaskId(taskId); setPlanDayOpen(true); };

  const handleWelcomeDismiss = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, "true");
    setWelcomeOpen(false);
  };

  return (
    // Simple wrapper for max-width and centering
    <div className="w-full max-w-7xl mx-auto">

      {/* Responsive Container: flex-col default, md:flex-row */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 relative">

         {/* --- Left Column (Hero - Sticky) --- */}
         {/* Width uses calc to account for gap. self-start prevents stretching. */}
         <div
           ref={pieChartContainerRef} // Ref for height measurement
           className={`w-full md:w-[calc(55%-0.75rem)] py-4 md:sticky self-start z-20`} // Adjust 0.75rem if gap-lg changes
           style={{ top: chartStickyTop }} // Apply calculated top offset
         >
            {/* Pie Chart Container - Controls aspect ratio and width */}
            <div className="aspect-square w-[90%] mx-auto md:w-full max-w-md mb-4"> {/* Adjust max-width */}
               <PieChart
                 tasks={tasks}
                 onTaskSelect={handleTaskSelect}
                 onCenterClick={handlePlanDay}
                 workdayHours={workdayHours}
                 className="w-full h-full max-w-full max-h-full"
                 forceMonochrome={effectiveMonochrome}
               />
            </div>
            {/* Task summary text below chart */}
            {tasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center text-sm text-muted-foreground mt-4 mb-1" // Added justify-center and mt-4
              >
                <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""} • {Math.floor(totalGoalMinutes / 60)}h{totalGoalMinutes % 60}m of {workdayHours}h day
                </span>
              </motion.div>
            )}
         </div>

         {/* --- Right Column (Content + Button) --- */}
         {/* Added calculated height for md+ screens */}
         <div className="w-full md:w-[calc(45%-0.75rem)] flex flex-col relative md:h-[calc(100vh_-_11rem)] bg-card border rounded-lg shadow-md p-4"> 
            {/* --- Button Section (Adjust top positioning if needed due to padding) --- */}
            <div
              ref={buttonContainerRef}
              className="w-full sticky top-0 bg-card z-10 pt-2 pb-4 mb-4 border-b" /* Use bg-card, add padding/border */
              style={{ top: `calc(${HEADER_HEIGHT_ESTIMATE} + ${MAIN_PADDING_TOP})` }} /* Simplified top */
            >
              <Button
                onClick={handlePlanDay}
                className="w-full flex items-center justify-center gap-2 py-2 px-6 rounded-lg shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
                size="lg"
              >
                <PlusCircle className="w-icon-base h-icon-base" />
                <span>Plan My Day</span>
              </Button>
            </div>

            {/* --- Content Section (Scrollable) --- */}
            <div className="flex-1 overflow-y-auto" > 
              <TaskList 
                tasks={tasks} 
                onEditTask={handleTaskClick} 
                forceMonochrome={effectiveMonochrome}
              />
            </div>
         </div> {/* End Right Column */}
      </div> {/* End Responsive Container */}

      <PlanDayDialog open={planDayOpen} onOpenChange={setPlanDayOpen} editTaskId={editTaskId} />
      <WelcomeDialog open={welcomeOpen} onDismiss={handleWelcomeDismiss} />

    </div> // End Component Root
  );
}