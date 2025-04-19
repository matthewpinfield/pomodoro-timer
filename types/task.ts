export interface Note {
  id: string
  text: string
  timestamp: string
}

export interface Task {
  id: string
  name: string
  goalTimeMinutes: number
  progressMinutes: number
  chartIndex: number
  isPriority?: boolean
  notes: Note[]
}

