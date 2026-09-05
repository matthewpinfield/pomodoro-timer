import type { Metadata } from "next"
import { AlarmsView } from "@/components/alarms-view"

export const metadata: Metadata = {
  title: "Alarms - FocusPie",
  description: "Set quick reminder timers without leaving your focus session",
}

export default function AlarmsPage() {
  return <AlarmsView />
}
