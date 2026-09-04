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
}
