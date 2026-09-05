import { redirect } from "next/navigation"

export default function Home() {
  // redirect() already applies next.config.mjs's basePath automatically -
  // prefixing it here too doubled it up in production (e.g. /pomodoro-timer/pomodoro-timer/pie-chart).
  redirect("/pie-chart")
}

