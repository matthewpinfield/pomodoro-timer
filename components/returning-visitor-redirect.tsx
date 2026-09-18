"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Same key the old welcome-dialog used ("seen" == "onboarded") - keeping the
// name/value means anyone who already dismissed that dialog is treated as a
// returning visitor here too, instead of getting sent back through onboarding.
const VISITED_KEY = "focuspie-welcome-seen"

export function ReturningVisitorRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (localStorage.getItem(VISITED_KEY) === "true") {
      router.replace("/pie-chart")
    }
  }, [router])

  return null
}
