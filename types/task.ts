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
}
