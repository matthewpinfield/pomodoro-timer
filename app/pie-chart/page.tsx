import type { Metadata } from "next"
import PieChartView from "@/components/pie-chart-view"

export const metadata: Metadata = {
  title: "Task Planning - FocusPie",
  description: "Plan your day with FocusPie's visual task management system"
}

export default function PieChartPage() {
  return <PieChartView />
}

