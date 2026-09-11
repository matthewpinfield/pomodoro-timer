// Small "Premium" pill shown next to Calendar import and Push Reminders -
// kept as one shared component so the label/styling can't drift between the
// two places it's used.
export function PremiumBadge() {
  return (
    <span className="inline-flex items-center text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
      Premium
    </span>
  )
}
