export interface TaskNote {
  id: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  name: string;
  goalTimeMinutes: number;
  progressMinutes: number;
  chartIndex: number | string;
  isPriority: boolean;
  notes: TaskNote[];
  // Set only for tasks created from a calendar import - the ICS event's own
  // UID, so re-syncing updates this same task instead of duplicating it.
  // Absent for ordinary, manually-created tasks.
  sourceUid?: string;
  // YYYY-MM-DD, local date this task belongs to. Manually-created tasks
  // always get today's date; calendar imports get the event's own date -
  // this is what lets the pie chart show a specific day's plan instead of
  // one flat undated list.
  date: string;
}
