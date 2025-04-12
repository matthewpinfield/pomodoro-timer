"use client";

import { useState, useRef, useEffect } from 'react';
import { Menu, Settings, PieChart, Clock, AlertCircle, XCircle, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsDialog } from './SettingsDialog';
import { useTasks } from "@/context/task-context";
import Image from 'next/image';
import Link from "next/link";
import { useRouter } from 'next/navigation';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { tasks } = useTasks();
  const hasTasks = tasks && tasks.length > 0;
  const [showTooltip, setShowTooltip] = useState(false);
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

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

  const menuItems = [
    {
      name: "Task Planning",
      icon: <PieChart className="w-icon-base h-icon-base" />,
      onClick: () => {
        router.push(basePath + "/pie-chart");
        setIsMenuOpen(false);
      },
    },
    {
      name: "Timer",
      icon: <Clock className="w-icon-base h-icon-base" />,
      onClick: () => {
        if (hasTasks) {
          router.push(basePath + "/timer");
          setIsMenuOpen(false);
        }
      },
      disabled: !hasTasks,
      tooltip: "You need to create tasks first"
    },
    {
      name: "Design Token Test",
      icon: <Palette className="w-icon-base h-icon-base" />,
      onClick: () => {
        router.push(basePath + "/design-token-test");
        setIsMenuOpen(false);
      },
    },
    {
      name: "Settings",
      icon: <Settings className="w-icon-base h-icon-base" />,
      onClick: () => {
        setIsSettingsOpen(true);
        setIsMenuOpen(false);
      },
    },
  ];

  const renderMenuItems = () => {
    return menuItems.map((item, index) => {
      const menuItem = (
        <div
          key={index}
          className={cn(
            "flex items-center gap-2 px-w-lg py-lg sm:py-md hover:bg-slate-100 active:bg-slate-200 dark:hover:bg-slate-700 dark:active:bg-slate-600 cursor-pointer relative",
            item.disabled ? "opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-slate-800" : ""
          )}
          onClick={item.disabled ? undefined : item.onClick}
          onMouseEnter={() => item.disabled && item.tooltip ? setShowTooltip(true) : null}
          onMouseLeave={() => item.disabled && item.tooltip ? setShowTooltip(false) : null}
        >
          {item.icon}
          <span>{item.name}</span>
          {item.disabled ? (
            <AlertCircle className="w-icon-sm h-icon-sm text-amber-500 ml-xs" />
          ) : null}
          {item.disabled && item.tooltip && showTooltip ? (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 ml-md bg-slate-800 text-white text-xs px-sm py-xs rounded shadow-md z-50 whitespace-nowrap max-w-dialog-sm">
              {item.tooltip}
            </div>
          ) : null}
        </div>
      );

      return menuItem;
    });
  };

  return (
    <header className="py-md pt-xl px-w-md bg-background border-b flex justify-between items-center sticky top-0 z-50 safe-top">
      <div className="flex items-center space-x-w-xs">
        <Link href={basePath + "/"}>
          <Image
            src={basePath + "/icon-192x192.png"}
            alt="FocusPie Logo"
            width={48}
            height={48}
            className="w-logo-mobile h-logo-mobile sm:w-logo-desktop sm:h-logo-desktop mr-w-xs"
            priority
            loading="eager"
            fetchPriority="high"
          />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">FocusPie</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Your Daily Focus Plan</p>
        </div>
      </div>

      <div 
        ref={menuRef} 
        className="relative"
      >
        <button
          onClick={toggleMenu}
          className="flex flex-col justify-center items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700"
          aria-label="Menu"
        >
          <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></span>
          <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></span>
          <span className="block w-5 h-0.5 bg-gray-600 dark:bg-gray-300"></span>
        </button>

        {isMenuOpen && (
          <div
            className={cn(
              "fixed top-[4rem] right-0 h-[calc(100vh-4rem)] w-64 bg-popover text-foreground border-l border-border overflow-hidden z-50"
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
                  {item.disabled && (
                    <AlertCircle className="w-icon-sm h-icon-sm text-amber-500 ml-auto" />
                  )}
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

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </header>
  );
}