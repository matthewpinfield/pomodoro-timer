import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Focus Timer",
  description: "Run a Pomodoro-style focus session against your selected task.",
}

export default function TimerLayout({ children }: { children: React.ReactNode }) {
  return children
}
