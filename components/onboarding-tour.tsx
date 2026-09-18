"use client"

import { useCallback, useEffect, useState, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TourStep {
  selector: string
  title: string
  body: string
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="pie-chart"]',
    title: "Your day, at a glance",
    body: "This pie fills up as you plan tasks against today's workday budget.",
  },
  {
    selector: '[data-tour="plan-task-button"]',
    title: "Add a task",
    body: "Tap here to add a task and give it a time budget — it shows up as a new slice.",
  },
  {
    selector: '[data-tour="task-list"]',
    title: "Start a focus session",
    body: "Click any task in this list to start a Pomodoro session against it.",
  },
]

interface OnboardingTourProps {
  active: boolean
  onFinish: () => void
}

export function OnboardingTour({ active, onFinish }: OnboardingTourProps) {
  const [mounted, setMounted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => setMounted(true), [])

  const measure = useCallback(() => {
    const step = STEPS[stepIndex]
    const el = step ? document.querySelector<HTMLElement>(step.selector) : null
    if (!el) {
      setRect(null)
      return
    }
    el.scrollIntoView({ block: "center" })
    setRect(el.getBoundingClientRect())
  }, [stepIndex])

  useEffect(() => {
    if (!active) return
    const raf = requestAnimationFrame(measure)
    const mainEl = document.getElementById("main-content-area")
    window.addEventListener("resize", measure)
    mainEl?.addEventListener("scroll", measure)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish()
    }
    window.addEventListener("keydown", handleKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", measure)
      mainEl?.removeEventListener("scroll", measure)
      window.removeEventListener("keydown", handleKey)
    }
  }, [active, measure, onFinish])

  if (!active || !mounted) return null

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  const handleNext = () => {
    if (isLast) onFinish()
    else setStepIndex((i) => i + 1)
  }

  // Target element isn't on screen (unexpected layout) - end rather than show a floating tooltip pointing at nothing.
  if (!rect) return null

  const padding = 8
  const spotlightStyle: CSSProperties = {
    position: "fixed",
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    borderRadius: 16,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)",
    pointerEvents: "none",
  }

  const tooltipWidth = 320
  const spaceBelow = window.innerHeight - rect.bottom
  const placeBelow = spaceBelow > 200
  const tooltipStyle: CSSProperties = {
    position: "fixed",
    left: Math.min(Math.max(rect.left, 16), window.innerWidth - tooltipWidth - 16),
    top: placeBelow ? rect.bottom + padding + 12 : undefined,
    bottom: placeBelow ? undefined : window.innerHeight - (rect.top - padding) + 12,
  }

  return createPortal(
    <>
      {/* Blocks interaction with the rest of the app while the tour is active */}
      <div className="fixed inset-0 z-[99]" aria-hidden="true" />
      <div style={spotlightStyle} className="z-[100] ring-2 ring-primary" aria-hidden="true" />
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: placeBelow ? -8 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          style={{ ...tooltipStyle, width: tooltipWidth }}
          className="z-[101] max-w-[calc(100vw-2rem)] bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl p-4 flex flex-col gap-3"
          role="dialog"
          aria-label={step.title}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm">{step.title}</h3>
            <button
              onClick={onFinish}
              aria-label="Skip tour"
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{step.body}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-muted-foreground">
              {stepIndex + 1} of {STEPS.length}
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onFinish}>
                Skip
              </Button>
              <Button size="sm" onClick={handleNext}>
                {isLast ? "Got it" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>,
    document.body
  )
}
