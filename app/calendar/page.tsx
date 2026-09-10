import type { Metadata } from "next"
import { CalendarView } from "@/components/calendar-view"

export const metadata: Metadata = {
  title: "Calendar - FocusPie",
  description: "Import the next month of events from your calendar as tasks",
}

export default function CalendarPage() {
  return <CalendarView />
}
