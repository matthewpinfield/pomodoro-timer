"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, PieChart, Clock, AlertCircle, Info, Coffee, AlarmClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsDialog } from './SettingsDialog';
import { FeaturesDialog } from './features-dialog';
import { useTasks } from "@/context/task-context";
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from 'next/navigation';

// Define a threshold after which hiding can start (e.g., header height)
const HIDE_THRESHOLD = 60; // Adjust based on your header's approx height

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { currentTaskId, hasRealTasks } = useTasks();
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainContentRef = useRef<HTMLElement | null>(null); // Ref to store the main element

  // --- Scroll Handler ---
  const handleScroll = useCallback((target: HTMLElement) => {
    const currentScrollY = target.scrollTop;
    const isScrollingDown = currentScrollY > lastScrollY.current;

    if (currentScrollY < HIDE_THRESHOLD || !isScrollingDown) {
      setIsHeaderVisible(true);
    } else if (isScrollingDown && currentScrollY > HIDE_THRESHOLD) {
      setIsHeaderVisible(false);
    }

    if (Math.abs(currentScrollY - lastScrollY.current) > 5) {
       lastScrollY.current = currentScrollY;
    }
  }, []);

  // --- Effect to find main element and attach/detach listener ---
  useEffect(() => {
    const mainElement = document.getElementById('main-content-area');
    mainContentRef.current = mainElement;

    if (mainElement) {
      const scrollListener = (event: Event) => {
        handleScroll(event.target as HTMLElement);
      };
      mainElement.addEventListener('scroll', scrollListener);
      return () => {
        mainElement.removeEventListener('scroll', scrollListener);
      };
    } else {
      console.warn("Main content area element (#main-content-area) not found.");
    }
  }, [handleScroll]);


  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  // --- Menu items definition ---
  const menuItems = [
    {
      name: "Task Planning",
      // REMOVED text-popover-foreground from here
      icon: <PieChart className="w-icon-base h-icon-base" />,
      onClick: () => { router.push("/pie-chart"); setIsMenuOpen(false); },
    },
    {
      name: "Timer",
      // REMOVED text-popover-foreground from here
      icon: <Clock className="w-icon-base h-icon-base" />,
      onClick: () => { if (hasRealTasks && currentTaskId) { router.push("/timer"); setIsMenuOpen(false); } },
      disabled: !hasRealTasks,
      tooltip: "You need to create tasks first"
    },
    {
      name: "Alarms",
      icon: <AlarmClock className="w-icon-base h-icon-base" />,
      onClick: () => { router.push("/alarms"); setIsMenuOpen(false); },
    },
    {
      name: "Settings",
      // REMOVED text-popover-foreground from here
      icon: <Settings className="w-icon-base h-icon-base" />,
      onClick: () => { setIsSettingsOpen(true); setIsMenuOpen(false); },
    },
    {
      name: "About",
      // REMOVED text-popover-foreground from here
      icon: <Info className="w-icon-base h-icon-base" />,
      onClick: () => { setIsFeaturesOpen(true); setIsMenuOpen(false); },
    },
    {
      name: "Buy Me a Coffee",
      icon: <Coffee className="w-icon-base h-icon-base text-[#FFDD00]" />, // Buy Me A Coffee brand coloring
      onClick: () => { window.open("https://buymeacoffee.com/matthewpink", "_blank"); setIsMenuOpen(false); },
    },
  ];

  return (
    <header className={cn(
      "py-3 px-4 sm:px-6 md:px-8 bg-background/70 backdrop-blur-xl border-b border-white/10 dark:border-white/5 shadow-sm flex justify-between items-center sticky top-0 z-50 safe-top",
      "transition-all duration-500 ease-in-out",
      !isHeaderVisible ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100",
      "md:translate-y-0 md:opacity-100"
    )}>
      {/* --- Header content (Logo, Title, Menu Button) --- */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="relative z-0 group flex items-center gap-2 sm:gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]">
           <div className="relative overflow-hidden rounded-xl bg-gradient-to-tr from-primary/30 to-primary/10 p-1 shadow-inner ring-1 ring-white/10 group-hover:ring-primary/50 transition-all duration-300">
             <Image
              src={basePath + "/icon-192x192.png"}
              alt="FocusPie Logo"
              width={40} height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-md group-hover:rotate-12 transition-transform duration-300 pointer-events-none"
              priority loading="eager" fetchPriority="high"
             />
           </div>
           <div>
             <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent tracking-tight leading-none">FocusPie</h1>
             <p className="hidden sm:block text-[10px] md:text-xs font-medium text-primary/80 uppercase tracking-widest mt-0.5">Your Daily Focus Plan</p>
           </div>
        </Link>
      </div>

      {/* --- Hamburger menu container --- */}
      <div
        ref={menuRef}
        className="relative"
      >
        {/* Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="group flex flex-col justify-center items-center gap-1.5 p-2.5 rounded-full hover:bg-white/5 active:bg-white/10 transition-all duration-300"
          aria-label="Menu"
        >
          <span className={cn("block w-5 h-[2px] rounded-full bg-foreground transition-all duration-300", isMenuOpen ? "translate-y-2 rotate-45" : "")}></span>
          <span className={cn("block w-4 h-[2px] rounded-full bg-foreground transition-all duration-300", isMenuOpen ? "opacity-0 translate-x-3" : "")}></span>
          <span className={cn("block w-5 h-[2px] rounded-full bg-foreground transition-all duration-300", isMenuOpen ? "-translate-y-2 -rotate-45" : "")}></span>
        </button>

        {/* Dropdown Menu Panel */}
        {isMenuOpen && (
          <div
            className={cn(
              "absolute top-[calc(100%+1rem)] right-0 w-64 rounded-2xl bg-card/95 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden z-40 origin-top-right animate-in fade-in zoom-in-95 duration-200"
            )}
            role="menu"
          >
             <div className="flex flex-col py-2">
               {menuItems.map((item, index) => (
                 <div
                   key={index}
                   className={cn(
                     "group flex items-center gap-4 px-5 py-3.5 mx-2 my-0.5 rounded-xl cursor-pointer relative transition-all duration-200",
                     item.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10 hover:text-primary"
                   )}
                   onClick={item.disabled ? undefined : item.onClick}
                   onMouseEnter={() => item.disabled && item.tooltip ? setShowTooltip(true) : null}
                   onMouseLeave={() => item.disabled && item.tooltip ? setShowTooltip(false) : null}
                 >
                   <span className={cn(
                      "transition-colors duration-200 flex items-center justify-center text-muted-foreground",
                      !item.disabled && 'group-hover:text-primary group-hover:scale-110'
                    )}>
                       {item.icon}
                   </span>
                   
                   <span className="font-medium text-sm tracking-wide text-foreground group-hover:text-primary transition-colors">{item.name}</span>
                   
                   {item.disabled && ( <AlertCircle className="w-4 h-4 text-destructive ml-auto opacity-80" /> )}
                   {item.disabled && item.tooltip && showTooltip && (
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-4 bg-popover/95 backdrop-blur-md text-popover-foreground text-xs font-medium px-3 py-2 rounded-lg shadow-xl border border-white/10 z-50 whitespace-nowrap animate-in fade-in slide-in-from-right-2">
                          {item.tooltip}
                        </div>
                    )}
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* --- Dialogs --- */}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
      <FeaturesDialog
        open={isFeaturesOpen}
        onOpenChange={setIsFeaturesOpen}
      />
    </header>
  );
}