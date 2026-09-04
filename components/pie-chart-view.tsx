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
    <div className="w-full max-w-7xl mx-auto px-0 sm:px-4 flex flex-col h-full">

      {/* Responsive Container: flex-col default, md:flex-row */}
      <div className="flex flex-col md:flex-row md:items-start gap-6 sm:gap-8 md:gap-12 relative flex-1">

         {/* --- Left Column (Hero - Sticky) --- */}
         <div
           ref={pieChartContainerRef}
           className="w-full md:w-5/12 lg:w-[45%] py-4 md:sticky self-start z-20 flex flex-col items-center group" 
           style={{ top: 0 }}
         >
            {/* Pie Chart Ambient Glow */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-primary/10 rounded-full blur-[80px] sm:blur-[100px] h-[250px] sm:h-[300px] w-full -z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-700" />

            {/* Pie Chart Container */}
            <div className="relative aspect-square w-[90%] sm:w-[75%] md:w-[90%] lg:w-[85%] xl:w-[80%] max-w-[400px] mx-auto mb-4 sm:mb-6 transform transition-transform duration-500 hover:scale-[1.02]"> 
               <PieChart
                 tasks={tasks}
                 onTaskSelect={handleTaskSelect}
                 onCenterClick={handlePlanDay}
                 workdayHours={workdayHours}
                 className="w-full h-full drop-shadow-2xl"
                 forceMonochrome={effectiveMonochrome}
               />
            </div>
            
            {/* Task summary text */}
            {tasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center text-xs sm:text-sm font-medium text-foreground/80 bg-card/40 backdrop-blur-md px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/10 shadow-sm mt-2 sm:mt-4 tracking-wide" 
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                <span>
                  {tasks.length} {tasks.length === 1 ? "task" : "tasks"} • {Math.floor(totalGoalMinutes / 60)}h{totalGoalMinutes % 60}m / {workdayHours}h
                </span>
              </motion.div>
            )}
         </div>

         {/* --- Right Column (Content) --- */}
         <div className="w-full md:w-7/12 lg:w-[55%] flex flex-col relative glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 xl:p-10 mb-4 flex-1 md:sticky md:self-start md:top-0 md:max-h-[calc(100vh-8rem)]">
            
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {/* --- Button Section --- */}
            <div
              ref={buttonContainerRef}
              className="w-full sticky top-0 z-10 pb-4 sm:pb-6 mb-2 flex flex-col bg-transparent"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Today's Focus</h2>
                {tasks.length > 0 && (
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {Math.round((totalGoalMinutes / (workdayHours * 60)) * 100)}% Full
                  </span>
                )}
              </div>
              
              <Button
                onClick={handlePlanDay}
                className="w-full h-12 sm:h-14 flex items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-xl shadow-primary/20 border border-primary-foreground/10 font-bold text-sm sm:text-base"
                size="lg"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Plan New Task</span>
              </Button>
            </div>

            {/* --- List Section --- */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-3 sm:pr-4 -mr-3 sm:-mr-4" >
              <TaskList 
                tasks={tasks} 
                onEditTask={handleTaskClick} 
                forceMonochrome={effectiveMonochrome}
              />
            </div>
         </div>
      </div>

      <PlanDayDialog open={planDayOpen} onOpenChange={setPlanDayOpen} editTaskId={editTaskId} />
      <WelcomeDialog open={welcomeOpen} onDismiss={handleWelcomeDismiss} />

    </div>
  );
}