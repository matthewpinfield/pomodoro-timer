"use client"; // Essential for using hooks

// --- React and Next.js Imports ---
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";

// --- Component Imports ---
import { TimerCircle } from "@/components/timer-circle";
import { TaskReminders } from "@/components/task-reminders"; // Assuming this exists
import { Button } from "@/components/ui/button";
import { AddNoteDialog } from "@/components/add-note-dialog";
import { motion } from "framer-motion"; // Import motion

// --- Context Imports ---
import { useTasks } from "@/context/task-context";
import { useTimer } from "@/context/timer-context";

// --- Utility Imports ---
import { formatTime } from "@/lib/utils"; // Assuming this exists

// --- Icon Imports ---
import { PlusCircle } from "lucide-react"; // Only PlusCircle seems used in the final JSX

// --- The Actual Page Component ---
export default function TimerPage() {
    // --- Hooks defined inside the component ---
    const router = useRouter();
    const { tasks, currentTaskId } = useTasks();
    const { mode, timeLeftInMode, isRunning, settings, startWork, pauseTimer, skipBreak } = useTimer();
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [taskTimeLeftSeconds, setTaskTimeLeftSeconds] = useState<number>(NaN);

    const currentTask = useMemo(() => tasks.find((task) => task.id === currentTaskId), [tasks, currentTaskId]);
    const taskGoalSeconds = useMemo(() => currentTask ? currentTask.goalTimeMinutes * 60 : 0, [currentTask]);
    const timeDisplay = useMemo(() => formatTime(timeLeftInMode), [timeLeftInMode]);
    const taskProgress = useMemo(() => taskGoalSeconds > 0 && !isNaN(taskTimeLeftSeconds) ? (taskGoalSeconds - taskTimeLeftSeconds) / taskGoalSeconds : 0, [taskGoalSeconds, taskTimeLeftSeconds]);
    const currentModeTotalDuration = useMemo(() => mode === 'working' ? settings.pomodoro : mode === 'shortBreak' ? settings.shortBreak : mode === 'longBreak' ? settings.longBreak : settings.pomodoro, [mode, settings]);
    const formattedTime = useMemo(() => currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), [currentTime]);
    const filteredTasks = useMemo(() => tasks.filter((task) => task.id !== currentTaskId), [tasks, currentTaskId]);
    const handleTimerClick = useCallback(() => { if (mode === 'idle') { startWork() } else { pauseTimer() } }, [mode, startWork, pauseTimer]);

    // --- useEffect hooks ---
    useEffect(() => { /* ... localStorage setup ... */ }, []);
    useEffect(() => { /* ... task selection/timing effect ... */
        if (!currentTaskId || !currentTask) {
            if (typeof window !== 'undefined' && !localStorage.getItem("focuspie-selecting-task")) {
                localStorage.removeItem("focuspie-taskTimeLeft");
                setTaskTimeLeftSeconds(NaN);
                router.push("/pie-chart");
            }
        } else {
            let initialTaskTimeLeft = taskGoalSeconds > 0 ? taskGoalSeconds : settings.pomodoro * 60;
            if (typeof window !== 'undefined') {
                const savedTaskTime = localStorage.getItem("focuspie-taskTimeLeft");
                if (savedTaskTime !== null) {
                    const parsedSavedTime = parseInt(savedTaskTime, 10);
                    const maxTime = taskGoalSeconds > 0 ? taskGoalSeconds : Infinity;
                    if (!isNaN(parsedSavedTime) && parsedSavedTime >= 0 && parsedSavedTime <= maxTime) {
                        initialTaskTimeLeft = parsedSavedTime;
                    }
                }
            }
            setTaskTimeLeftSeconds(initialTaskTimeLeft);
        }
    }, [currentTaskId, currentTask, router, taskGoalSeconds, settings.pomodoro]);

    useEffect(() => { /* ... task interval effect ... */
        let taskInterval: NodeJS.Timeout | undefined = undefined;
        if (mode === 'working' && isRunning && taskTimeLeftSeconds > 0) {
            taskInterval = setInterval(() => {
                setTaskTimeLeftSeconds((prev) => !isNaN(prev) ? Math.max(0, prev - 1) : 0);
            }, 1000);
        }
        return () => {
            if (taskInterval) clearInterval(taskInterval);
        };
    }, [mode, isRunning, taskTimeLeftSeconds]);

    useEffect(() => { /* ... localStorage save effect ... */
        if (typeof window !== 'undefined' && currentTaskId && !isNaN(taskTimeLeftSeconds)) {
            localStorage.setItem("focuspie-taskTimeLeft", taskTimeLeftSeconds.toString());
        }
     }, [taskTimeLeftSeconds, currentTaskId]);

    useEffect(() => { /* ... clock interval effect ... */
        const clockInterval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(clockInterval);
     }, []);


    // --- Console Logs for Debugging ---
    console.log('--- TimerPage Render State ---');
    console.log('Current Task ID:', currentTaskId);
    console.log('Current Task:', currentTask);
    console.log('Is Running:', isRunning);
    console.log('Time Left (Mode):', timeLeftInMode);
    console.log('Task Time Left (Seconds):', taskTimeLeftSeconds);
    console.log('Note Dialog Open State:', noteDialogOpen);
    console.log('Mode:', mode);

    // --- Early Return Check ---
    if (!currentTaskId && mode !== 'idle') {
       console.error("TimerPage PREVENTING RENDER: No current task ID and not idle.");
       return null;
    }
    if (currentTaskId && !currentTask) {
        console.warn("TimerPage WAITING: Task ID selected, but task data not yet loaded.");
        return null;
    }

    // --- JSX Rendering ---
    return (
        <div className="flex flex-col h-full">
            <motion.main
                className="flex-1 w-full px-w-xs sm:px-w-sm py-md flex flex-col items-center md:flex-row md:justify-center md:items-start md:gap-xl md:max-w-4xl lg:max-w-5xl mx-auto"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
            >
                <div className="flex flex-col md:flex-row w-full items-start gap-xl">
                    {/* Left Column */}
                    <div className="flex flex-col items-center md:w-1/2 mb-xl md:mb-0 flex-shrink-0">
                        {(currentTask || mode === 'idle') && !isNaN(taskTimeLeftSeconds) ? (
                            <TimerCircle
                                mode={mode}
                                currentModeTotalDuration={currentModeTotalDuration}
                                timeLeftInMode={timeLeftInMode}
                                timeDisplay={timeDisplay}
                                taskProgress={taskProgress}
                                taskName={currentTask?.name || "Ready"}
                                taskTimeLeftSeconds={taskTimeLeftSeconds}
                                taskGoalMinutes={currentTask?.goalTimeMinutes || settings.pomodoro}
                                isRunning={isRunning}
                                onTimerClick={handleTimerClick}
                            />
                        ) : (
                           <div>Loading Timer...</div>
                        )}

                        {/* Legends and Skip Button */}
                         <div className="mt-sm sm:mt-md flex justify-center items-center gap-md text-xs text-gray-600 dark:text-gray-400">
                             <div className="flex items-center gap-2">
                                 <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                 <span>Current Task</span>
                             </div>
                             <span>|</span>
                             <div className="flex items-center gap-2">
                                 <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                 <span>Work</span>
                                 <span>/</span>
                                 <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                 <span>Rest</span>
                             </div>
                         </div>
                         {(mode === 'shortBreak' || mode === 'longBreak') && (
                             <Button onClick={skipBreak} variant="secondary" size="sm" className="mt-sm sm:mt-md">
                                 Skip Break
                             </Button>
                         )}
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col items-center w-full md:w-1/2">
                        <motion.div
                            className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-sm p-md sm:p-lg mt-md sm:mt-xl md:mt-0"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="mb-md sm:mb-xl">
                                <TaskReminders tasks={filteredTasks} />
                            </div>
                            {/* ***** CORRECTED PLACEMENT OF suppressHydrationWarning ***** */}
                            <div
                                className="text-center text-gray-500 dark:text-gray-400 text-sm"
                                suppressHydrationWarning={true} // CORRECTLY PLACED INSIDE THE DIV TAG
                            >
                                {formattedTime}
                            </div>
                        </motion.div> {/* Closing motion.div */}

                        {/* Add Note Button */}
                        <div className="flex justify-center mt-md sm:mt-lg w-full">
                            <Button
                                onClick={() => setNoteDialogOpen(true)}
                                className="w-full max-w-md flex items-center justify-center gap-sm bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transition-all"
                                size="lg"
                                disabled={!currentTask}
                            >
                                <PlusCircle className="w-icon-base h-icon-base" />
                                <span>Add Note</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.main>

            {/* Render Dialog only if task ID exists */}
            {currentTaskId && (
                <AddNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} taskId={currentTaskId} />
            )}
        </div>
    );
}