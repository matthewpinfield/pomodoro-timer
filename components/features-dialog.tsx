import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FeaturesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeaturesDialog({ open, onOpenChange }: FeaturesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>About FocusPie</DialogTitle>
          <DialogDescription>
            Key features and how to use the app effectively.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-sm text-muted-foreground">
          <p>
            <strong>Visual Planning:</strong> See your day's tasks laid out on the interactive pie chart.
          </p>
          <p>
            <strong>Focused Work:</strong> Use the built-in Pomodoro timer (or custom intervals via Settings) to concentrate on the current task.
          </p>
          <p>
            <strong>Task Management:</strong> Add, edit, prioritize, and delete tasks using the 'Plan My Day' button.
          </p>
           <p>
            <strong>Timer Integration:</strong> Start a task's timer directly from the pie chart slice or the task list's play button.
          </p>
           <p>
            <strong>Progress Tracking:</strong> Notes can be added to tasks during a timer session (feature coming soon).
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 