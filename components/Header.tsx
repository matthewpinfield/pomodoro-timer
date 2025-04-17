"use client";

import { useState, useRef, useEffect, useCallback } from 'react'; // Added useCallback
import { Menu, Settings, PieChart, Clock, AlertCircle, XCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsDialog } from './SettingsDialog';
import { useTasks } from "@/context/task-context";
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from 'next/navigation';

// Define a threshold after which hiding can start (e.g., header height)
const HIDE_THRESHOLD = 60; // Adjust based on your header's approx height

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { tasks } = useTasks();
  const hasTasks = tasks && tasks.length > 0;
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainContentRef = useRef<HTMLElement | null>(null); // Ref to store the main element

    // --- Scroll Handler ---
  // Now takes the event target (the scrolling element)
  const handleScroll = useCallback((target: HTMLElement) => {
    // Read scrollTop from the target element
    const currentScrollY = target.scrollTop;
    const isScrollingDown = currentScrollY > lastScrollY.current;

    // console.log(`Scroll: current=${currentScrollY}, last=${lastScrollY.current}, down=${isScrollingDown}, visible=${isHeaderVisible}`); // DEBUG LOG

    // Logic remains similar
    if (currentScrollY < HIDE_THRESHOLD || !isScrollingDown) {
      setIsHeaderVisible(true);
    } else if (isScrollingDown && currentScrollY > HIDE_THRESHOLD) {
      setIsHeaderVisible(false);
    }

    // Update last scroll position using scrollTop
    // Add a buffer to prevent reacting to tiny scroll changes
    if (Math.abs(currentScrollY - lastScrollY.current) > 5) {
       lastScrollY.current = currentScrollY;
    }
  }, []); // isHeaderVisible removed dependency, logic based on scroll values

     // --- Effect to find main element and attach/detach listener ---
  useEffect(() => {
    const mainElement = document.getElementById('main-content-area');
    mainContentRef.current = mainElement;

    if (mainElement) {
      // Define the listener function
      const scrollListener = (event: Event) => {
        // ***** ADD THIS LOG *****
        console.log('Scroll event detected on main element!');
        // ***********************

        // Call handleScroll passing the element itself
        handleScroll(event.target as HTMLElement);
      };

      console.log("Attaching scroll listener to:", mainElement); // Keep this log
      mainElement.addEventListener('scroll', scrollListener);

      // Cleanup listener on component unmount
      return () => {
        console.log("Removing scroll listener from:", mainElement); // Keep this log
        mainElement.removeEventListener('scroll', scrollListener);
      };
    } else {
      console.warn("Main content area element (#main-content-area) not found."); // Keep this log
    }
  }, [handleScroll]); // Dependency array remains the same


  // Close menu when clicking outside (existing logic)
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

  // --- Menu items definition (existing logic - truncated for brevity) ---
  const menuItems = [
    // ... your menu items ...
     {
      name: "Task Planning",
      icon: <PieChart className="w-icon-base h-icon-base" />,
      onClick: () => { router.push(basePath + "/pie-chart"); setIsMenuOpen(false); },
    },
    {
      name: "Timer",
      icon: <Clock className="w-icon-base h-icon-base" />,
      onClick: () => { if (hasTasks) { router.push(basePath + "/timer"); setIsMenuOpen(false); } },
      disabled: !hasTasks,
      tooltip: "You need to create tasks first"
    },
    {
      name: "Settings",
      icon: <Settings className="w-icon-base h-icon-base" />,
      onClick: () => { setIsSettingsOpen(true); setIsMenuOpen(false); },
    },
  ];

  // --- renderMenuItems (existing logic - removed for brevity) ---

  return (
    // ***** Apply conditional transform and transition *****
    <header className={cn(
      "py-md pt-xl px-w-md bg-background border-b flex justify-between items-center sticky top-0 z-50 safe-top",
      "transition-transform duration-300 ease-in-out", // Add transition
      // Apply transform only when header should be hidden
      // Use md:translate-y-0 to disable the hiding effect on medium screens and up
      !isHeaderVisible ? "-translate-y-full" : "translate-y-0",
      "md:translate-y-0" // Always visible on md+ screens
    )}>
      {/* --- Header content (Logo, Title, Menu Button) --- */}
      <div className="flex items-center space-x-w-xs">
        {/* ... Logo Link ... */}
        <Link href={basePath + "/"} className="relative z-0">
           <Image
            src={basePath + "/icon-192x192.png"}
            alt="FocusPie Logo"
            width={48} height={48}
            className="w-logo-mobile h-logo-mobile sm:w-logo-desktop sm:h-logo-desktop mr-w-xs pointer-events-none"
            priority loading="eager" fetchPriority="high"
          />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">FocusPie</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">Your Daily Focus Plan</p>
        </div>
      </div>

      <div
        ref={menuRef}
        className="relative"
      >
        {/* ... Menu Button ... */}
        <button
          onClick={toggleMenu}
          className="flex flex-col justify-center items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></span>
          <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></span>
          <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></span>
        </button>


        {/* --- Menu Flyout (existing logic) --- */}
        {isMenuOpen && (
          <div
            className={cn(
              // Adjusted position: fixed top-[actual header height] might be better than rem
              // Or calculate dynamically if needed. For now, let's assume ~4rem is okay.
              "fixed top-[4.5rem] right-0 h-[calc(100vh-4.5rem)] w-64 bg-popover text-foreground border-l border-border overflow-y-auto z-40" // Lower z-index than header
            )}
            role="menu"
          >
             <div className="flex flex-col h-full">
               {menuItems.map((item, index) => (
                 <div
                   key={index}
                   className={cn(
                     "flex items-center gap-3 px-4 py-3 hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600 cursor-pointer relative",
                     item.disabled && "opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-slate-800"
                   )}
                   onClick={item.disabled ? undefined : item.onClick}
                   onMouseEnter={() => item.disabled && item.tooltip ? setShowTooltip(true) : null}
                   onMouseLeave={() => item.disabled && item.tooltip ? setShowTooltip(false) : null}
                 >
                   {item.icon}
                   <span className="font-medium">{item.name}</span>
                   {item.disabled && ( <AlertCircle className="w-icon-sm h-icon-sm text-amber-500 ml-auto" /> )}
                   {item.disabled && item.tooltip && showTooltip && (
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-md z-50 whitespace-nowrap">
                          {item.tooltip}
                        </div>
                    )}
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>

      {/* --- Settings Dialog (existing logic) --- */}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </header>
  );
}