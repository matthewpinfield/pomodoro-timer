"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
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
      onClick: () => { router.push(basePath + "/pie-chart"); setIsMenuOpen(false); },
    },
    {
      name: "Timer",
      // REMOVED text-popover-foreground from here
      icon: <Clock className="w-icon-base h-icon-base" />,
      onClick: () => { if (hasRealTasks && currentTaskId) { router.push(basePath + "/timer"); setIsMenuOpen(false); } },
      disabled: !hasRealTasks,
      tooltip: "You need to create tasks first"
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
  ];

  return (
    <header className={cn(
      "py-2 pt-8 px-4 bg-background border-b flex justify-between items-center sticky top-0 z-50 safe-top",
      "transition-transform duration-300 ease-in-out",
      !isHeaderVisible ? "-translate-y-full" : "translate-y-0",
      "md:translate-y-0"
    )}>
      {/* --- Header content (Logo, Title, Menu Button) --- */}
      <div className="flex items-center space-x-3">
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
          <h1 className="text-2xl font-bold text-foreground">FocusPie</h1>
          <p className="text-xs text-muted-foreground -mt-1">Your Daily Focus Plan</p>
        </div>
      </div>

      {/* --- Hamburger menu container --- */}
      <div
        ref={menuRef}
        className="relative"
      >
        {/* Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="group flex flex-col justify-center items-center gap-1 p-2 rounded-md transition-colors"
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 bg-foreground group-hover:bg-muted-foreground transition-colors"></span>
          <span className="block w-4 h-0.5 bg-foreground group-hover:bg-muted-foreground transition-colors"></span>
          <span className="block w-5 h-0.5 bg-foreground group-hover:bg-muted-foreground transition-colors"></span>
        </button>

        {/* Dropdown Menu Panel */}
        {isMenuOpen && (
          <div
            className={cn(
              "fixed top-[4.5rem] right-0 h-[calc(100vh-4.5rem)] w-64 bg-background text-popover-foreground border-l border-border overflow-y-auto z-40 shadow-md pt-3"
            )}
            role="menu"
          >
             <div className="flex flex-col h-full">
               {menuItems.map((item, index) => (
                 <div
                   key={index}
                   className={cn(
                     "group flex items-center gap-3 px-4 py-2 active:bg-accent/80 cursor-pointer relative",
                     item.disabled && "opacity-50 cursor-not-allowed hover:bg-background"
                   )}
                   onClick={item.disabled ? undefined : item.onClick}
                   onMouseEnter={() => item.disabled && item.tooltip ? setShowTooltip(true) : null}
                   onMouseLeave={() => item.disabled && item.tooltip ? setShowTooltip(false) : null}
                 >
                   {/* *** Icon Rendering Logic: Wrap in Span and Apply Colors Here *** */}
                   <span className={cn(
                      // Apply the base text color here
                      "text-popover-foreground",
                      // Add transition for smoother color change
                      "transition-colors duration-150 ease-in-out",
                      // Apply hover color only if NOT disabled
                      !item.disabled && 'group-hover:text-primary'
                    )}>
                       {item.icon} {/* Render the original icon directly */}
                   </span>
                   {/* *** End Icon Rendering Change *** */}

                   <span className="font-medium">{item.name}</span>
                   {item.disabled && ( <AlertCircle className="w-icon-sm h-icon-sm text-amber-500 ml-auto" /> )}
                   {item.disabled && item.tooltip && showTooltip && (
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