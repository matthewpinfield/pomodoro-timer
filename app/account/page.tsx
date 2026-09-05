import type { Metadata } from "next"
import { AccountView } from "@/components/account-view"

export const metadata: Metadata = {
  title: "Account - FocusPie",
  description: "Sign in to sync your tasks and settings across devices",
}

export default function AccountPage() {
  return <AccountView />
}
