// page.tsx (Rollback State - WITH Debugging Logs Added)
"use client";

import * as React from "react";
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
    const { mode, timeLeftInMode, taskTimeLeft, isRunning, settings, sessionTotalDuration, startWork, pauseTimer, skipBreak } = useTimer();
    const { useMonochromeChart } = useSettings();
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);

    const [clientTaskColor, setClientTaskColor] = useState<string>('transparent');
    const [clientWorkColor, setClientWorkColor] = useState<string>('transparent');
    const [clientRestColor, setClientRestColor] = useState<string>('transparent');
    const [isClient, setIsClient] = useState(false);
    const [finalTaskArcColor, setFinalTaskArcColor] = useState<string>('transparent');

    // --- Layout Constants ---
    // --- Memos and Callbacks ---
    const currentTask = useMemo(() => currentTaskId ? tasks.find((task) => task.id === currentTaskId) : undefined, [tasks, currentTaskId]);
    const timeDisplay = useMemo(() => formatTime(timeLeftInMode), [timeLeftInMode]);
    const currentModeTotalDuration = sessionTotalDuration;
    const filteredTasks = useMemo(() => currentTaskId ? tasks.filter((task) => task.id !== currentTaskId) : tasks, [tasks, currentTaskId]);
    const handleTimerClick = useCallback(() => { if (mode === 'idle') { startWork() } else { pauseTimer() } }, [mode, startWork, pauseTimer]);

    // *** ADDED LOGS: Log Core State on Render ***
    console.log(`[Page Render] Mode: ${mode}, TaskID: ${currentTaskId}, Task Found: ${!!currentTask}, TaskTimeLeft Context: ${taskTimeLeft}`);
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

    // Effect for redirection
     useEffect(() => {
        if (!currentTaskId && mode !== 'idle') {
            if (typeof window !== 'undefined' && !localStorage.getItem("focuspie-selecting-task")) {
                router.push("/pie-chart");
            }
        }
     }, [currentTaskId, mode, router]);

    // Effect to auto-start a session when arriving via a task's Play button
    useEffect(() => {
        if (
            currentTask &&
            mode === 'idle' &&
            typeof window !== 'undefined' &&
            localStorage.getItem("focuspie-autostart-task") === "true"
        ) {
            localStorage.removeItem("focuspie-autostart-task");
            localStorage.removeItem("focuspie-selecting-task");
            startWork();
        }
    }, [currentTask, mode, startWork]);

    // --- Conditional Rendering Logic ---
    const isLoading = isClient && currentTaskId && !currentTask;
    const canRenderTimer = isClient && (currentTask || mode === 'idle');

    // --- Props for TimerCircle ---
    const goalMinutesForProp = currentTask?.goalTimeMinutes || (settings.pomodoro / 60);
    const timeLeftForProp = isNaN(taskTimeLeft) ? 0 : taskTimeLeft; // Use unified context time
     // *** ADDED LOG ***
    console.log(`[Page Render] Props -> taskGoalMinutes: ${goalMinutesForProp}, taskTimeLeftSeconds: ${timeLeftForProp}, taskColor: ${finalTaskArcColor}`);
    // *** END LOG ***

    return (
        <div className="flex flex-col w-full h-full">
            <motion.main
                 className="w-full max-w-7xl mx-auto px-0 sm:px-4 flex-1 flex flex-col"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, ease: "easeOut" }}
            >
             <div className="flex flex-col md:flex-row md:items-start gap-6 sm:gap-8 md:gap-12 flex-1">
                {/* Left Column - Timer Area */}
                <div className="flex flex-col items-center w-full md:w-5/12 lg:w-[45%] py-4 md:sticky self-start z-20 group" style={{ top: 0 }}>
                    
                    {/* Ambient Glow */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-primary/10 rounded-full blur-[80px] sm:blur-[100px] h-[250px] sm:h-[300px] w-full -z-10 opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                    
                    {isLoading ? (
                       <div className="flex items-center justify-center h-[300px] sm:h-[400px] text-muted-foreground animate-pulse font-medium">Loading Focus...</div>
                    ) : canRenderTimer ? (
                        <div className="relative w-[90%] sm:w-[75%] md:w-[90%] lg:w-[85%] xl:w-[80%] max-w-[400px] mx-auto mb-6 sm:mb-8 transform transition-transform duration-500 hover:scale-[1.02]">
                            <TimerCircle
                                mode={mode}
                                currentModeTotalDuration={currentModeTotalDuration}
                                timeLeftInMode={timeLeftInMode}
                                timeDisplay={timeDisplay}
                                taskName={currentTask?.name || "Ready"}
                                taskTimeLeftSeconds={timeLeftForProp}
                                taskGoalMinutes={goalMinutesForProp}
                                isRunning={isRunning}
                                onTimerClick={handleTimerClick}
                                taskColor={finalTaskArcColor}
                                workColor={clientWorkColor}
                                restColor={clientRestColor}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] sm:h-[400px] text-center space-y-4 px-6">
                            <div className="p-4 rounded-full bg-secondary/50 text-primary">
                                <PlusCircle className="w-8 h-8" />
                            </div>
                            <p className="text-xl font-bold tracking-tight text-foreground">No Task Selected</p>
                            <p className="text-sm text-muted-foreground max-w-[240px]">Select a task from your plan to begin your focus session.</p>
                            <Button onClick={() => router.push("/pie-chart")} variant="outline" className="rounded-full px-8">Go to Plan</Button>
                        </div>
                    )}

                    {/* Legends - Premium pill design */}
                    <div className="mt-2 flex flex-wrap justify-center items-center gap-4 sm:gap-6 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-card/40 backdrop-blur-md border border-white/10 shadow-sm text-[10px] sm:text-xs font-bold text-foreground/80 tracking-widest uppercase">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ring-2 ring-background shadow-sm" style={{ backgroundColor: clientTaskColor }}></div>
                            <span>Task</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ring-2 ring-background shadow-sm" style={{ backgroundColor: clientWorkColor }}></div>
                            <span>Pomodoro</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ring-2 ring-background shadow-sm" style={{ backgroundColor: clientRestColor }}></div>
                            <span>Rest</span>
                        </div>
                    </div>
                    
                    {/* Skip Button */}
                    {(mode === 'shortBreak' || mode === 'longBreak') && ( 
                        <Button
                            onClick={skipBreak}
                            className="mt-6 w-[85%] sm:w-[80%] rounded-xl sm:rounded-2xl h-12 sm:h-14 bg-primary text-primary-foreground hover:bg-primary/90 backdrop-blur-sm transition-all shadow-lg font-bold text-sm sm:text-base border border-primary-foreground/10 uppercase tracking-widest"
                        >
                            Skip Break 
                        </Button> 
                    )}
                </div>

                {/* Right Column - Tasks & Actions */}
                <div className="w-full md:w-7/12 lg:w-[55%] flex flex-col relative glass-card rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 xl:p-10 mb-4 md:sticky md:self-start md:top-0 md:max-h-[calc(100vh-8rem)]">

                   <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                   {/* Content Section */}
                   <div className="flex-1 min-h-0 flex flex-col">
                       <motion.div
                            className="w-full flex-1 min-h-0 flex flex-col space-y-10"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 100 }}
                        >
                            {/* --- Now Focusing Section --- */}
                            {currentTask && (
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Now Focusing</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-3.5 p-3.5">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: finalTaskArcColor }}></div>
                                                <span className="text-base font-semibold text-foreground truncate">{currentTask.name}</span>
                                            </div>
                                            <span className="text-xs font-semibold bg-secondary/80 text-secondary-foreground/90 px-2.5 py-1 rounded-full shadow-sm flex-shrink-0">
                                                {currentTask.progressMinutes >= 60 ? `${Math.floor(currentTask.progressMinutes / 60)}h ${currentTask.progressMinutes % 60}m` : `${currentTask.progressMinutes}m`}
                                                {' / '}
                                                {currentTask.goalTimeMinutes >= 60 ? `${Math.floor(currentTask.goalTimeMinutes / 60)}h ${currentTask.goalTimeMinutes % 60}m` : `${currentTask.goalTimeMinutes}m`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- Up Next Section (Highest Priority) --- */}
                            <div className="flex-1 min-h-0 flex flex-col">
                                <div className="flex items-center justify-between mb-4 sm:mb-6 flex-shrink-0">
                                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Up Next</h3>
                                    {filteredTasks?.length > 0 && (
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-widest">
                                            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-3 sm:pr-4 -mr-3 sm:-mr-4 space-y-4">
                                    {filteredTasks && filteredTasks.length > 0 ? (
                                         <TaskReminders tasks={filteredTasks} />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-[1.5rem] border border-dashed border-border/40 bg-secondary/10 backdrop-blur-sm">
                                             <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest">You&apos;re focused!</p>
                                             <p className="text-xs text-muted-foreground mt-2">No other tasks scheduled for now.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- Actions & Notes Section --- */}
                            <div className="space-y-6 pt-4 border-t border-border/40 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold tracking-tight text-foreground/80">Session Notes</h3>
                                    <Button
                                        onClick={() => setNoteDialogOpen(true)}
                                        size="sm"
                                        className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md font-bold text-xs flex items-center gap-2 px-4"
                                        disabled={!currentTask}
                                    >
                                        <PlusCircle className="w-3.5 h-3.5" />
                                        <span>Quick Note</span>
                                    </Button>
                                </div>

                                {/* --- Current Task Notes List --- */}
                                {currentTask && currentTask.notes && currentTask.notes.length > 0 ? (
                                    <div className="space-y-3">
                                        {currentTask.notes.map((note) => (
                                            <div key={note.id} className="p-4 rounded-2xl bg-secondary/30 border border-white/5 backdrop-blur-sm group/note relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
                                                <p className="text-sm sm:text-base text-foreground/90 leading-relaxed font-medium">{note.text}</p>
                                                <p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-tight">
                                                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 px-6 text-center rounded-[1.5rem] border border-dashed border-border/30 bg-secondary/5">
                                         <p className="text-xs font-bold text-foreground/40 uppercase tracking-widest">No notes yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
             </div>
            </motion.main>
            {currentTaskId && (<AddNoteDialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen} taskId={currentTaskId} />)}
        </div>
    );
}