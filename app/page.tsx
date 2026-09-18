import type { Metadata } from "next"
import Link from "next/link"
import { PieChart, Timer, TrendingUp, PlusCircle, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReturningVisitorRedirect } from "@/components/returning-visitor-redirect"

export const metadata: Metadata = {
  title: { absolute: "FocusPie – Visualise. Focus. Achieve." },
  description:
    "FocusPie turns chaos into achievement through visual time management. Plan your day as a pie chart, then run ADHD-friendly Pomodoro sessions against it — free, no sign-up required.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "FocusPie – Visualise. Focus. Achieve.",
    description:
      "FocusPie turns chaos into achievement through visual time management — a pie-chart day planner paired with an ADHD-friendly Pomodoro timer.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FocusPie – Visualise. Focus. Achieve.",
    description: "Turn chaos into achievement through visual time management.",
  },
}

const benefits = [
  {
    icon: PieChart,
    title: "See Your Day Unfold",
    body: "Drop tasks onto a pie chart sized to your real workday, so you can see at a glance what actually fits — before you overcommit.",
  },
  {
    icon: Timer,
    title: "Enter the Deep Work Zone",
    body: "Run focused Pomodoro sessions against whichever task you pick, with built-in breaks that keep burnout away.",
  },
  {
    icon: Trophy,
    title: "Celebrate Every Win",
    body: "Watch each slice fill in as you work it, so a scattered day turns into a visible, satisfying record of what you got done.",
  },
]

const steps = [
  {
    icon: PlusCircle,
    title: "Plan your slices",
    body: "Add today's tasks and give each one a time budget — FocusPie lays them out as a pie chart against your workday.",
  },
  {
    icon: Timer,
    title: "Focus one slice at a time",
    body: "Pick a task and start a session. The circular timer keeps the one thing you're doing front and center.",
  },
  {
    icon: TrendingUp,
    title: "Watch progress add up",
    body: "Completed time fills in visually, so momentum is something you can see, not just remember.",
  },
]

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FocusPie",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Any (Web)",
  description:
    "A visual, ADHD-friendly focus timer: a pie chart for planning the day's tasks against a workday budget, and a circular timer for running Pomodoro sessions.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
}

export default function LandingPage() {
  return (
    <>
      <ReturningVisitorRedirect />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center gap-10 sm:gap-12 py-2 sm:py-4">
        {/* Hero */}
        <section className="flex flex-col items-center gap-5">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
            <span className="block text-primary">Visualise.</span>
            <span className="block text-foreground">Focus.</span>
            <span className="block text-foreground">Achieve.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
            FocusPie turns chaos into achievement through visual time management — free, no sign-up required.
          </p>
          <Button asChild size="lg">
            <Link href="/pie-chart">Start Planning</Link>
          </Button>
          <p className="text-xs text-muted-foreground">No account. Nothing leaves your device.</p>
        </section>

        {/* Benefits */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
          {benefits.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col items-center gap-2 text-center p-5 rounded-xl bg-card border border-border">
              <Icon className="w-7 h-7 text-primary" aria-hidden="true" />
              <h2 className="font-semibold text-base text-card-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <section className="flex flex-col items-center gap-5 w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full">
            {steps.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="flex flex-col items-center gap-2 text-center p-5 rounded-xl bg-muted">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {i + 1}
                </div>
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
