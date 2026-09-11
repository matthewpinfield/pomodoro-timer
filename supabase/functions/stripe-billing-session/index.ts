// Browser-callable (via supabase.functions.invoke), so unlike stripe-webhook
// this needs CORS handling and verifies the caller's own JWT - same pattern
// as fetch-calendar/index.ts (forward the Authorization header to Auth's
// own /user endpoint rather than decoding the JWT ourselves).
//
// Handles two closely-related things behind one `mode` field rather than two
// separate functions, since they share almost all their logic (verify the
// caller, find-or-create their Stripe Customer): "checkout" starts a new
// subscription, "portal" opens Stripe's own hosted billing management page
// (cancel, update payment method, view invoices) - no custom UI needed for
// any of that on our side.
//
// Uses the official npm:stripe SDK, same as stripe-webhook - validated under
// Deno before either function was written.

import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_PRICE_ID = Deno.env.get("STRIPE_PRICE_ID")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://focuspie.app";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

// public.subscriptions has no insert/update policy for `authenticated` at
// all (see schema.sql) - seeding/reading the stripe_customer_id mapping
// needs the service role, same reasoning as every other cross-user write in
// this codebase, just scoped here to one already-identified user's own row.
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
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" },
    });
    if (!userResp.ok) return json({ error: "Not authenticated" }, 401);
    const { id: userId, email } = await userResp.json();

    const { mode } = await req.json();
    if (mode !== "checkout" && mode !== "portal") {
      return json({ error: "mode must be 'checkout' or 'portal'" }, 400);
    }

    // Find (or, for a first-time checkout, create) this user's Stripe
    // Customer - reused across repeat checkouts so we never create
    // duplicate customers for the same account.
    const existingResp = await restRequest(`subscriptions?select=stripe_customer_id&user_id=eq.${userId}`);
    const existingRows = existingResp.ok ? await existingResp.json() : [];
    let customerId: string | undefined = existingRows?.[0]?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: typeof email === "string" ? email : undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      const seedResp = await restRequest("subscriptions?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({ user_id: userId, stripe_customer_id: customerId }),
      });
      if (!seedResp.ok) {
        // Don't let checkout proceed with no way for the webhook to ever
        // find this user again - surface the failure instead of silently
        // creating an orphaned Stripe customer/session.
        console.error(`Failed to seed subscriptions row for user ${userId}: ${await seedResp.text()}`);
        return json({ error: "Couldn't set up billing for your account. Please try again shortly." }, 500);
      }
    }

    if (mode === "checkout") {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        success_url: `${APP_URL}/account?checkout=success`,
        cancel_url: `${APP_URL}/account?checkout=cancel`,
      });
      return json({ url: session.url });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/account`,
    });
    return json({ url: portalSession.url });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
