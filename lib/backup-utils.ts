import type { Task } from "@/types/task"

/**
 * Get backup data for a specific date
 * @param date Date string in YYYY-MM-DD format
 * @returns Task array from backup or null if not found
 */
export function getBackupForDate(date: string): Task[] | null {
  if (typeof window === 'undefined') return null
  
  const backupKey = `focuspie-backup-${date}`
  const backupData = localStorage.getItem(backupKey)
  
  if (!backupData) return null
  
  try {
    return JSON.parse(backupData) as Task[]
  } catch (error) {
    console.error('Error parsing backup data:', error)
    return null
  }
}

/**
 * Get all available backup dates
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getAvailableBackupDates(): string[] {
  if (typeof window === 'undefined') return []
  
  const dates: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('focuspie-backup-')) {
      const date = key.replace('focuspie-backup-', '')
      dates.push(date)
    }
  }
  
  return dates.sort().reverse() // Most recent first
}

/**
 * Calculate total time spent on tasks for a specific date
 * @param date Date string in YYYY-MM-DD format
 * @returns Total minutes spent or 0 if no backup found
 */
export function getTotalTimeForDate(date: string): number {
  const backup = getBackupForDate(date)
  if (!backup) return 0
  
  return backup.reduce((total, task) => total + task.progressMinutes, 0)
}

/**
 * Get task completion statistics for a specific date
 * @param date Date string in YYYY-MM-DD format
 * @returns Object with completion statistics
 */
export function getCompletionStatsForDate(date: string) {
  const backup = getBackupForDate(date)
  if (!backup) return { completed: 0, total: 0, percentage: 0 }
  
  const completed = backup.filter(task => task.progressMinutes >= task.goalTimeMinutes).length
  const total = backup.length
  
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
} 