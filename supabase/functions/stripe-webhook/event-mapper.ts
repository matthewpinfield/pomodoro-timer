// Pure, Deno-free so it's Jest-testable, same split as ics-parser.ts and
// url-guard.ts.
//
// Maps a parsed, already-signature-verified Stripe event (index.ts calls
// stripe.webhooks.constructEventAsync before this ever runs) to the update
// this function's caller should apply to public.subscriptions. Returns null
// for any event type we don't care about, so index.ts can just skip those.

export interface SubscriptionUpdate {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: string;
  currentPeriodEnd: string | null; // ISO 8601, or null if unavailable
}

const HANDLED_EVENT_TYPES = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export function mapStripeEventToSubscriptionUpdate(event: {
  type: string;
  data: { object: unknown };
}): SubscriptionUpdate | null {
  if (!HANDLED_EVENT_TYPES.has(event.type)) return null;

  const sub = event.data.object as Record<string, unknown>;
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : (sub.customer as { id?: string } | undefined)?.id;
  const stripeSubscriptionId = typeof sub.id === "string" ? sub.id : undefined;
  const status = typeof sub.status === "string" ? sub.status : "unknown";

  if (!stripeCustomerId || !stripeSubscriptionId) return null;

  // current_period_end has moved between a top-level field and a per-line-
  // item field across Stripe API versions - check both defensively rather
  // than assume one. Null (not a crash) if neither is present.
  const topLevelPeriodEnd = sub.current_period_end;
  const itemPeriodEnd = (sub.items as { data?: Array<{ current_period_end?: number }> } | undefined)?.data?.[0]
    ?.current_period_end;
  const periodEndSeconds =
    typeof topLevelPeriodEnd === "number" ? topLevelPeriodEnd : typeof itemPeriodEnd === "number" ? itemPeriodEnd : null;

  return {
    stripeCustomerId,
    stripeSubscriptionId,
    // Stripe's "deleted" event still carries whatever status the
    // subscription had at cancellation (often "canceled" already, but not
    // guaranteed) - force it explicitly so a canceled subscription can never
    // be misread as still active.
    status: event.type === "customer.subscription.deleted" ? "canceled" : status,
    currentPeriodEnd: periodEndSeconds !== null ? new Date(periodEndSeconds * 1000).toISOString() : null,
  };
}
