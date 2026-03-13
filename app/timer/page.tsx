// page.tsx (Rollback State - WITH Debugging Logs Added)
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TimerCircle } from "@/components/timer-circle";
import { TaskReminders } from "@/components/task-reminders";
import { Button } from "@/components/ui/button";
import { AddNoteDialog } from "@/components/add-note-dialog";
import { motion } from "framer-motion";
import { useTasks } from "@/context/task-context";
import { useTimer } from "@/context/timer-context";
import { useSettings } from "@/context/settings-context";
// Import from single utility file
import { formatTime, getCssVariable, getTaskModeColor } from "@/lib/utils";
import { PlusCircle } from "lucide-react";

export default function TimerPage() {
    const router = useRouter();
    const { tasks, currentTaskId } = useTasks();
    const { mode, timeLeftInMode, isRunning, settings, startWork, pauseTimer, skipBreak } = useTimer();
    const { useMonochromeChart } = useSettings();
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [taskTimeLeftSeconds, setTaskTimeLeftSeconds] = useState<number>(NaN); // Initialize as NaN

    const [clientTaskColor, setClientTaskColor] = useState<string>('transparent');
    const [clientWorkColor, setClientWorkColor] = useState<string>('transparent');
    const [clientRestColor, setClientRestColor] = useState<string>('transparent');
    const [isClient, setIsClient] = useState(false);
    const [finalTaskArcColor, setFinalTaskArcColor] = useState<string>('transparent');

    // --- Memos and Callbacks ---
    const currentTask = useMemo(() => currentTaskId ? tasks.find((task) => task.id === currentTaskId) : undefined, [tasks, currentTaskId]);
    const taskGoalSeconds = useMemo(() => (currentTask?.goalTimeMinutes ?? 0) * 60, [currentTask]);
    const timeDisplay = useMemo(() => formatTime(timeLeftInMode), [timeLeftInMode]);
    const currentModeTotalDuration = useMemo(() => {
         switch (mode) {
            case 'working': return settings.pomodoro;
            case 'shortBreak': return settings.shortBreak;
            case 'longBreak': return settings.longBreak;
            default: return settings.pomodoro;
        }
     }, [mode, settings]);
    const filteredTasks = useMemo(() => currentTaskId ? tasks.filter((task) => task.id !== currentTaskId) : tasks, [tasks, currentTaskId]);
    const handleTimerClick = useCallback(() => { if (mode === 'idle') { startWork() } else { pauseTimer() } }, [mode, startWork, pauseTimer]);

    // *** ADDED LOGS: Log Core State on Render ***
    console.log(`[Page Render] Mode: ${mode}, TaskID: ${currentTaskId}, Task Found: ${!!currentTask}, TaskTimeLeft State: ${taskTimeLeftSeconds}`);
    console.log(`[Page Render] TaskColor State: ${finalTaskArcColor}`);
    // *** END LOGS ***

    // Effect to set client flag and STATIC legend colors
    useEffect(() => {
        setIsClient(true);
        setClientWorkColor(getCssVariable('--primary', 'blue'));
        setClientRestColor(getCssVariable('--success', 'green'));
        // *** ADDED LOG ***
        console.log("[Page Effect] Client flag set, static legend colors fetched.");
    }, []);

    // Effect to compute ONLY the base task arc color
    useEffect(() => {
        if (!isClient) {
             setClientTaskColor('transparent');
             setClientWorkColor('transparent');
             setClientRestColor('transparent');
             setFinalTaskArcColor('transparent');
            return;
        }
    
        const baseColor = getTaskModeColor(currentTask, useMonochromeChart, 'base');
        setClientTaskColor(baseColor);
        setFinalTaskArcColor(baseColor);
    
        const workColor = getTaskModeColor(currentTask, useMonochromeChart, 'work');
        setClientWorkColor(workColor);
    
        const restColor = getTaskModeColor(currentTask, useMonochromeChart, 'rest');
        setClientRestColor(restColor);
    
    }, [isClient, currentTask, useMonochromeChart]);

    // Effect for loading/saving task time & redirection
     useEffect(() => {
         // *** ADDED LOG ***
         console.log(`[Task Load Effect] Running. TaskId: ${currentTaskId}, Task Found: ${!!currentTask}, Mode: ${mode}`);
        if (currentTaskId && currentTask) {
            // *** ADDED LOGS ***
            console.log(`[Task Load Effect] Task Goal Minutes: ${currentTask.goalTimeMinutes}, Goal Seconds: ${taskGoalSeconds}`);
            let initialTaskTimeLeft = taskGoalSeconds > 0 ? taskGoalSeconds : settings.pomodoro * 60;
            console.log(`[Task Load Effect] Calculated Initial Time (before localStorage): ${initialTaskTimeLeft}`);
            // *** END LOGS ***

            if (typeof window !== 'undefined') {
                const savedTaskTime = localStorage.getItem(`focuspie-taskTimeLeft-${currentTaskId}`);
                 // *** ADDED LOG ***
                console.log(`[Task Load Effect] localStorage value for ${currentTaskId}: ${savedTaskTime}`);
                if (savedTaskTime !== null) {
                    const parsedSavedTime = parseInt(savedTaskTime, 10);
                    const maxTime = taskGoalSeconds > 0 ? taskGoalSeconds : Infinity;
                     // *** ADDED LOG ***
                    console.log(`[Task Load Effect] Parsed saved: ${parsedSavedTime}, Max time: ${maxTime}`);
                    if (!isNaN(parsedSavedTime) && parsedSavedTime >= 0 && parsedSavedTime <= maxTime) {
                        initialTaskTimeLeft = parsedSavedTime;
                         // *** ADDED LOG ***
                        console.log(`[Task Load Effect] Using valid saved time: ${initialTaskTimeLeft}`);
                    } else {
                         // *** ADDED LOG ***
                        console.log(`[Task Load Effect] Invalid saved time found: ${parsedSavedTime}. Removing from localStorage.`);
                        localStorage.removeItem(`focuspie-taskTimeLeft-${currentTaskId}`);
                    }
                } else {
                     // *** ADDED LOG ***
                    console.log(`[Task Load Effect] No saved time found in localStorage.`);
                }
            }
             // *** ADDED LOG ***
            console.log(`[Task Load Effect] ---> Calling setTaskTimeLeftSeconds with: ${initialTaskTimeLeft}`);
            setTaskTimeLeftSeconds(initialTaskTimeLeft); // Set the state

            if (typeof window !== 'undefined') {
                localStorage.removeItem("focuspie-selecting-task");
                  // *** ADDED LOG ***
                console.log("[Task Load Effect] Removed selecting flag.");
            }

        } else if (!currentTaskId && mode !== 'idle') {
             // *** ADDED LOG ***
            console.log("[Task Load Effect] Condition: No Task ID and not Idle.");
            if (typeof window !== 'undefined' && !localStorage.getItem("focuspie-selecting-task")) {
                 // *** ADDED LOG ***
                console.log("[Task Load Effect] Redirecting to /pie-chart");
                setTaskTimeLeftSeconds(NaN);
                router.push("/pie-chart");
            } else {
                 // *** ADDED LOG ***
                console.log("[Task Load Effect] Redirect prevented by flag.");
                if (isNaN(taskTimeLeftSeconds)) setTaskTimeLeftSeconds(NaN);
            }
        } else {
             // *** ADDED LOG ***
            console.log(`[Task Load Effect] Conditions not met for loading time (Task ID: ${currentTaskId}, Task Found: ${!!currentTask}, Mode: ${mode}). Setting time to NaN.`);
            setTaskTimeLeftSeconds(NaN);
            if (typeof window !== 'undefined') localStorage.removeItem("focuspie-selecting-task");
        }
     }, [currentTaskId, currentTask, taskGoalSeconds, settings.pomodoro, mode, router]);

     // Effect for task countdown interval
     useEffect(() => {
        let taskInterval: NodeJS.Timeout | undefined = undefined;
        if (mode === 'working' && isRunning && !isNaN(taskTimeLeftSeconds) && taskTimeLeftSeconds > 0) {
             // *** ADDED LOG ***
            console.log(`[Interval Effect] Starting interval. Current task time: ${taskTimeLeftSeconds}`);
            taskInterval = setInterval(() => {
                setTaskTimeLeftSeconds((prev) => {
                    if (isNaN(prev)) return 0;
                    const nextVal = Math.max(0, prev - 1);
                    return nextVal;
                });
            }, 1000);
        }
        return () => {
            if (taskInterval) { clearInterval(taskInterval); }
        };
     }, [mode, isRunning, taskTimeLeftSeconds]);

     // Effect for saving task time to localStorage
     useEffect(() => {
        if (typeof window !== 'undefined' && currentTaskId && !isNaN(taskTimeLeftSeconds)) {
            localStorage.setItem(`focuspie-taskTimeLeft-${currentTaskId}`, taskTimeLeftSeconds.toString());
        }
     }, [taskTimeLeftSeconds, currentTaskId]);

    // --- Conditional Rendering Logic ---
    const isLoading = isClient && currentTaskId && !currentTask;
    const canRenderTimer = isClient && (currentTask || mode === 'idle');

    // --- Props for TimerCircle ---
    const goalMinutesForProp = currentTask?.goalTimeMinutes || (settings.pomodoro / 60);
    const timeLeftForProp = isNaN(taskTimeLeftSeconds) ? 0 : taskTimeLeftSeconds; // Pass 0 if NaN
     // *** ADDED LOG ***
    console.log(`[Page Render] Props -> taskGoalMinutes: ${goalMinutesForProp}, taskTimeLeftSeconds: ${timeLeftForProp}, taskColor: ${finalTaskArcColor}`);
    // *** END LOG ***

    return (
        <div className="flex flex-col h-full">
            <motion.main
                 className="flex-1 w-full px-4 sm:px-4 py-4 flex flex-col items-center md:flex-row md:justify-center md:items-start md:gap-8 md:max-w-4xl lg:max-w-5xl mx-auto"
                 initial={{ opacity: 1 }}
                 animate={{ opacity: 1 }}
            >
                <div className="flex flex-col md:flex-row w-full items-start gap-xl">
                    {/* Left Column */}
                    <div className="flex flex-col items-center md:w-1/2 mb-xl md:mb-0 flex-shrink-0">
                        {isLoading ? (
                           <div>Loading Timer...</div>
                        ) : canRenderTimer ? (
                            <TimerCircle
                                mode={mode}
                                currentModeTotalDuration={currentModeTotalDuration}
                                timeLeftInMode={timeLeftInMode}
                                timeDisplay={timeDisplay}
                                // taskProgress prop removed
                                taskName={currentTask?.name || "Ready"}
                                taskTimeLeftSeconds={timeLeftForProp} // Use calculated prop value
                                taskGoalMinutes={goalMinutesForProp} // Use calculated prop value
                                isRunning={isRunning}
                                onTimerClick={handleTimerClick}
                                taskColor={finalTaskArcColor} // Use state value
                                // NO modeColor prop passed
                            />
                        ) : (
                            <div>Select a task to begin</div> // Fallback
                        )}

                            {/* Legends - Using STATIC work/rest colors */}
                            <div className="mt-2 sm:mt-4 flex justify-center items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: clientTaskColor }}></div>
                                <span>Current Task</span>
                            </div>
                            <span>|</span>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: clientWorkColor }}></div>
                                <span>Work</span>
                                <span>/</span>
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: clientRestColor }}></div>
                                <span>Rest</span>
                            </div>
                        </div>
                         {/* Skip Button */}
                         {(mode === 'shortBreak' || mode === 'longBreak') && ( <Button onClick={skipBreak} variant="secondary" size="sm" className="mt-sm sm:mt-md"> Skip Break </Button> )}
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col items-center w-full md:w-1/2">
                       {/* Add Note Button */}
                       <div className="flex justify-center mt-4 md:mt-0 mb-4 w-full">
                            <Button
                                onClick={() => setNoteDialogOpen(true)}
                                className="w-full max-w-md flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                                size="lg"
                                disabled={!currentTask}
                            >
                                <PlusCircle className="w-icon-base h-icon-base" />
                                <span>Add Note</span>
                            </Button>
                        </div>
                       {/* Task List Container */}
                       <motion.div
                            className="w-full max-w-md bg-card border rounded-xl shadow-md p-4 sm:p-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="mb-md sm:mb-xl">
                                {filteredTasks && filteredTasks.length > 0 ? (
                                     <TaskReminders tasks={filteredTasks} />
                                ) : (
                                     <p className="text-sm text-center text-muted-foreground">No other tasks for today</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.main>
            {/* Add Note Dialog */}
            {currentTaskId && (<AddNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} taskId={currentTaskId} />)}
        </div>
    );
}