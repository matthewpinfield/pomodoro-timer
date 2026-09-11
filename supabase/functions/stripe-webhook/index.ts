// Redeployed to force a fresh instance after updating STRIPE_WEBHOOK_SECRET.
// Stripe calls this directly whenever a subscription's lifecycle changes -
// no browser ever calls it, so unlike fetch-calendar/index.ts there's no
// CORS handling here. Auth is Stripe's own webhook signature (verified via
// the SDK's constructEventAsync, NOT the sync constructEvent - the async
// variant is what Stripe recommends for edge/Deno runtimes, since the sync
// version depends on Node's synchronous crypto APIs that aren't available
// here; confirmed working under Deno, including correctly rejecting a bad
// signature, before this file was written), not a forwarded user JWT -
// structurally the same shape as send-task-reminders' shared-secret cron
// auth, just using Stripe's own verification instead of a custom header.
//
// Uses the official npm:stripe SDK - validated in isolation first (same
// rigor as jsr:@negrel/webpush before it) rather than assumed to work or
// assumed broken by analogy to a different library's real Deno-compat issue.

import Stripe from "npm:stripe@17.7.0";
import { mapStripeEventToSubscriptionUpdate } from "./event-mapper.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

// public.subscriptions is locked down to the service_role (no insert/update
// policy exists for `authenticated` at all - see schema.sql) - this key is
// what lets these plain REST calls write to it, same bypass-RLS mechanism
// send-task-reminders already relies on for its own service-role writes.
async function restRequest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async (req: Request) => {
  try {
    const signature = req.headers.get("Stripe-Signature");
    if (!signature) return json({ error: "Missing Stripe-Signature header" }, 400);

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return json({ error: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}` }, 400);
    }

    const update = mapStripeEventToSubscriptionUpdate(event);
    if (!update) {
      // An event type we don't act on - acknowledge it anyway so Stripe
      // doesn't keep retrying delivery of something we're deliberately
      // ignoring.
      return json({ received: true, handled: false });
    }

    // The row already exists by this point - stripe-billing-session seeds
    // stripe_customer_id the first time this user ever started a checkout,
    // before Stripe could have sent any subscription event about them at
    // all. If no row matches, there's nothing safe to do but log it.
    const resp = await restRequest(
      `subscriptions?stripe_customer_id=eq.${encodeURIComponent(update.stripeCustomerId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          stripe_subscription_id: update.stripeSubscriptionId,
          status: update.status,
          current_period_end: update.currentPeriodEnd,
          updated_at: new Date().toISOString(),
        }),
        headers: { Prefer: "return=representation" },
      },
    );
    const updatedRows = resp.ok ? await resp.json() : [];
    if (!resp.ok || (Array.isArray(updatedRows) && updatedRows.length === 0)) {
      console.error(`No subscriptions row found for stripe_customer_id ${update.stripeCustomerId}`);
    }

    return json({ received: true, handled: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
