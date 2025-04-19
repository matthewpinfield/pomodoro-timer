"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // Import DialogClose for convenience
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react"; // Example icon

interface WelcomeDialogProps {
  open: boolean;
  onDismiss: () => void; // Renamed from onOpenChange for clarity
}

export function WelcomeDialog({ open, onDismiss }: WelcomeDialogProps) {
  // Handler for the "Don't Show Again" button or any close action
  const handleDismiss = () => {
    onDismiss(); // Call the callback which will set localStorage and close state
  };

  return (
    // Use onOpenChange to trigger dismiss on X or overlay click
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleDismiss()}>
      {/* Increase max-width and add transparent background */}
      <DialogContent 
        className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl bg-[var(--popover)/0.9] backdrop-blur-xs p-8 sm:p-12 md:p-16"
        >
        {/* Add back Header for accessibility, but hide elements visually */}
        <DialogHeader className="sr-only"> {/* Hide the header container */}
          <DialogTitle>Welcome to FocusPie</DialogTitle>
          <DialogDescription>Introduction and key benefits of the application.</DialogDescription>
        </DialogHeader>

        {/* Custom Layout - Reduce vertical spacing */}
        <div className="flex flex-col items-center text-center space-y-4 md:space-y-8">  {/* Reduced vertical spacing */}
          
          {/* Large Headline Section */}
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-primary leading-tight">
              Visualise.
            </h1>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mt-1">
              Focus.
            </h1>
             <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mt-1">
              Achieve.
            </h1>
          </div>

          {/* Subtitle/Intro - Use primary color */}
          <p className="text-lg md:text-xl text-primary max-w-xl">
            FocusPie turns chaos into achievement through visual time management.
          </p>

          {/* Benefit Blocks - Style like Primary Button */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-4 md:pt-6 w-full max-w-4xl">
            <div className="text-center p-4 border border-transparent rounded-lg bg-primary"> {/* Match button bg */}
              <h3 className="font-semibold text-lg mb-2 text-primary-foreground">See Your Day Unfold</h3> {/* Match button text */}
              <p className="text-sm text-primary-foreground/90"> {/* Match button text (slightly muted) */}
                Dynamic time visualization at a glance.
              </p>
            </div>
             <div className="text-center p-4 border border-transparent rounded-lg bg-primary"> {/* Match button bg */}
              <h3 className="font-semibold text-lg mb-2 text-primary-foreground">Enter the Deep Work Zone</h3> {/* Match button text */}
              <p className="text-sm text-primary-foreground/90"> {/* Match button text (slightly muted) */}
                Flow-state timers prevent daily burnout.
              </p>
            </div>
             <div className="text-center p-4 border border-transparent rounded-lg bg-primary"> {/* Match button bg */}
              <h3 className="font-semibold text-lg mb-2 text-primary-foreground">Celebrate Every Win</h3> {/* Match button text */}
              <p className="text-sm text-primary-foreground/90"> {/* Match button text (slightly muted) */}
                Watch your accomplishments grow daily.
              </p>
            </div>
          </div>

        </div>

        {/* Footer with centered button - Reduce top padding */}
        <DialogFooter className="sm:justify-center pt-4 md:pt-8">
          <DialogClose asChild>
            <Button type="button" size="lg">
              Let's Plan!
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 