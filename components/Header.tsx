"use client";
import { useState, useRef, useEffect } from 'react';
import { Menu, Settings, PieChart, Clock, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SettingsDialog } from './SettingsDialog';
import { useTasks } from "@/context/task-context";
import Image from 'next/image';
import Link from "next/link";

export function Header() {
  const [isHovered, setIsHovered] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  let leaveTimeout: NodeJS.Timeout;

  const { tasks } = useTasks();
  const hasTasks = tasks && tasks.length > 0;
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = () => {
    clearTimeout(leaveTimeout);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeout = setTimeout(() => {
      setIsHovered(false);
    }, 200); // Adjust delay as needed
  };

  const toggleMenu = () => {
    setIsHovered(prev => !prev);
  };

  const menuItems = [
    {
      name: "Task Planning",
      icon: <PieChart size={20} />,
      onClick: () => {
        window.location.href = "/pie-chart";
      },
    },
    {
      name: "Timer",
      icon: <Clock size={20} />,
      onClick: () => {
        if (hasTasks) {
          window.location.href = "/timer";
        }
      },
      disabled: !hasTasks,
      tooltip: "You need to create tasks first"
    },
    {
      name: "Settings",
      icon: <Settings size={20} />,
      onClick: () => {
        setIsSettingsOpen(true);
        setIsHovered(false);
      },
    },
  ];

  const renderMenuItems = () => {
    return menuItems.map((item, index) => {
      const menuItem = (
        <div
          key={index}
          className={`flex items-center gap-2 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer relative ${
            item.disabled ? "opacity-50 cursor-not-allowed hover:bg-white dark:hover:bg-slate-800" : ""
          }`}
          onClick={item.disabled ? undefined : item.onClick}
          onMouseEnter={() => item.disabled && item.tooltip ? setShowTooltip(true) : null}
          onMouseLeave={() => item.disabled && item.tooltip ? setShowTooltip(false) : null}
        >
          {item.icon}
          <span>{item.name}</span>
          {item.disabled && (
            <AlertCircle size={16} className="text-amber-500 ml-1" />
          )}
          {item.disabled && item.tooltip && showTooltip && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 ml-2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-md z-50 whitespace-nowrap max-w-[200px]">
              {item.tooltip}
            </div>
          )}
        </div>
      );

      return menuItem;
    });
  };

  return (
    <header className="py-4 px-4 bg-background border-b flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center space-x-2">
        <Image
          src="/icon-192x192.png"
          alt="FocusPie Logo"
          width={40}
          height={40}
          className="mr-3"
          priority
          fetchPriority="high"
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">FocusPie</h1>
          <p className="text-xs text-gray-600 dark:text-gray-400">Your Daily Focus Plan</p>
        </div>
      </div>

      <div 
        ref={buttonRef} 
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          onClick={toggleMenu}
          className="flex items-center space-x-1 rounded-md p-2 transition-all hover:bg-accent"
          aria-haspopup="true"
          aria-expanded={isHovered}
        >
          <div className="w-5 flex flex-col space-y-1">
            <span className="w-full h-0.5 bg-foreground rounded-full"></span>
            <span className="w-full h-0.5 bg-foreground rounded-full"></span>
            <span className="w-full h-0.5 bg-foreground rounded-full"></span>
          </div>
        </button>

        {isHovered && (
          <div
            ref={dropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
              "absolute right-0 mt-1 w-48 bg-popover text-foreground rounded-md shadow-md border border-border overflow-hidden z-10"
            )}
            role="menu"
          >
            <div className="p-1">
              {renderMenuItems()}
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