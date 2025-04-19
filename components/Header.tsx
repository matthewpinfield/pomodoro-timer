"use client";

import { useState, useRef, useEffect, useCallback } from 'react'; // Added useCallback
import { Menu, Settings, PieChart, Clock, AlertCircle, XCircle, Palette, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const { tasks, currentTaskId, hasRealTasks } = useTasks();
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
      icon: <PieChart className="w-icon-base h-icon-base text-popover-foreground" />,
      onClick: () => { router.push(basePath + "/pie-chart"); setIsMenuOpen(false); },
    },
    {
      name: "Timer",
      icon: <Clock className="w-icon-base h-icon-base text-popover-foreground" />,
      onClick: () => { if (hasRealTasks && currentTaskId) { router.push(basePath + "/timer"); setIsMenuOpen(false); } },
      disabled: !hasRealTasks,
      tooltip: "You need to create tasks first"
    },
    {
      name: "Settings",
      icon: <Settings className="w-icon-base h-icon-base text-popover-foreground" />,
      onClick: () => { setIsSettingsOpen(true); setIsMenuOpen(false); },
    },
    {
      name: "About",
      icon: <Info className="w-icon-base h-icon-base text-popover-foreground" />,
      onClick: () => { setIsFeaturesOpen(true); setIsMenuOpen(false); },
    },
  ];

  // --- renderMenuItems (existing logic - removed for brevity) ---

  return (
    // ***** Apply conditional transform and transition *****
    <header className={cn(
      // Use background and border theme variables
      "py-2 pt-8 px-4 bg-background border-b flex justify-between items-center sticky top-0 z-50 safe-top",
      "transition-transform duration-300 ease-in-out",
      !isHeaderVisible ? "-translate-y-full" : "translate-y-0",
      "md:translate-y-0"
    )}>
      {/* --- Header content (Logo, Title, Menu Button) --- */}
      <div className="flex items-center space-x-3">
        {/* ... Logo Link ... */}
        <Link href={basePath + "/"} className="relative z-0">
           <Image
            src={basePath + "/icon-192x192.png"}
            alt="FocusPie Logo"
            width={47} height={47}
            className="w-logo-mobile h-logo-mobile sm:w-logo-desktop sm:h-logo-desktop mr-w-xs pointer-events-none"
            priority loading="eager" fetchPriority="high"
          />
        </Link>
        <div>
          {/* Use theme text colors */}
          <h1 className="text-2xl font-bold text-foreground">FocusPie</h1>
          <p className="text-xs text-muted-foreground -mt-1">Your Daily Focus Plan</p>
        </div>
      </div>

      <div
        ref={menuRef}
        className="relative"
      >
        {/* Use theme colors for menu button */}
        <button
          onClick={toggleMenu}
          className="flex flex-col justify-center items-center gap-1 p-2 rounded-md hover:bg-accent"
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 bg-foreground"></span>
          <span className="block w-5 h-0.5 bg-foreground"></span>
          <span className="block w-5 h-0.5 bg-foreground"></span>
        </button>

        {isMenuOpen && (
          <div
            className={cn(
              // Use theme colors
              "fixed top-[4.5rem] right-0 h-[calc(100vh-4.5rem)] w-64 bg-popover text-popover-foreground border-l border-border overflow-y-auto z-40 shadow-md"
            )}
            role="menu"
          >
             <div className="flex flex-col h-full">
               {menuItems.map((item, index) => (
                 <div
                   key={index}
                   className={cn(
                     // Use theme hover/active colors
                     "flex items-center gap-3 px-4 py-2 hover:bg-accent active:bg-accent/80 cursor-pointer relative",
                     // Use theme background for disabled hover
                     item.disabled && "opacity-50 cursor-not-allowed hover:bg-background"
                   )}
                   onClick={item.disabled ? undefined : item.onClick}
                   onMouseEnter={() => item.disabled && item.tooltip ? setShowTooltip(true) : null}
                   onMouseLeave={() => item.disabled && item.tooltip ? setShowTooltip(false) : null}
                 >
                   {item.icon}
                   <span className="font-medium">{item.name}</span>
                   {item.disabled && ( <AlertCircle className="w-icon-sm h-icon-sm text-amber-500 ml-auto" /> )} {/* Keep amber warning icon for now */}
                   {item.disabled && item.tooltip && showTooltip && (
                        // Use theme popover colors for tooltip
                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md z-50 whitespace-nowrap">
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
      <FeaturesDialog 
        open={isFeaturesOpen}
        onOpenChange={setIsFeaturesOpen}
      />
    </header>
  );
}