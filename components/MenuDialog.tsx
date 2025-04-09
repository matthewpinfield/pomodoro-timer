"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Menu, Settings } from "lucide-react";
import Link from 'next/link';
import { SettingsDialog } from './SettingsDialog';

export function MenuDialog() {
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open Menu">
          <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Menu</DialogTitle>
        </DialogHeader>
        <nav className="mt-4 flex flex-col space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setOpen(false);
              setSettingsOpen(true);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          {/* Add more menu items here */}
        </nav>
      </DialogContent>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Dialog>
  );
} 