"use client"; // Required for onClick event

import { useState } from 'react';
import { Menu, Settings, X } from "lucide-react";
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuDialog } from './MenuDialog';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="flex justify-end p-4 bg-white shadow-md dark:bg-gray-800 relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Toggle Menu"
      >
        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>
      {isOpen && (
        <div className="absolute right-4 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md">
          <nav className="flex flex-col p-2">
            <Link href="/settings" passHref>
              <span className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                Settings
              </span>
            </Link>
            {/* Add more links here */}
          </nav>
        </div>
      )}
    </header>
  );
} 