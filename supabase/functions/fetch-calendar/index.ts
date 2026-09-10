// Fetches a user's ICS calendar feed and returns events in an upcoming
// window (today through WINDOW_DAYS_AHEAD days). Runs server-side (not in
// the browser) because calendar providers generally don't send CORS headers
// that would let a browser fetch an ICS URL directly. Parsing logic lives in
// ics-parser.ts, kept Deno-free so it can be unit tested under Jest - this
// file is just the HTTP glue.

import { parseIcs, windowEndDigits, dateDigitsToIso } from "./ics-parser.ts";
import { isSafeIcsUrl } from "./url-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimum time between syncs for a given account, enforced server-side (not
// just in the UI) - protects the shared Supabase Free-tier invocation quota
// from a signed-in user (or a script using their token directly) hammering
// this function in a loop. Checked and set using the same calendar_last_
// synced_at column the Calendar page already shows "Last imported X ago"
// from, so there's one source of truth, not a second hidden timestamp.
const MIN_SECONDS_BETWEEN_SYNCS = 120;

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

    // Verify the caller is a real signed-in Supabase user via their JWT -
    // plain fetch against Auth's own /user endpoint, no supabase-js needed.
    const userResp = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: {
        Authorization: authHeader,
        apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      },
    });
    if (!userResp.ok) return json({ error: "Not authenticated" }, 401);
    const { id: userId } = await userResp.json();

    const { icsUrl, todayDigits } = await req.json();
    if (!icsUrl || typeof icsUrl !== "string") return json({ error: "icsUrl is required" }, 400);
    if (!todayDigits || typeof todayDigits !== "string") return json({ error: "todayDigits is required" }, 400);
    if (!isSafeIcsUrl(icsUrl)) return json({ error: "That calendar URL isn't allowed" }, 400);

    // Rate limit, enforced server-side using this same account's own last-
    // synced timestamp (RLS lets a user read/write only their own row, so
    // this authenticates as the caller, not the service role).
    const restHeaders = { Authorization: authHeader, apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "" };
    const settingsResp = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/user_settings?select=calendar_last_synced_at&user_id=eq.${userId}`,
      { headers: restHeaders },
    );
    if (settingsResp.ok) {
      const rows = await settingsResp.json();
      const lastSynced = rows?.[0]?.calendar_last_synced_at;
      if (lastSynced) {
        const secondsSince = (Date.now() - new Date(lastSynced).getTime()) / 1000;
        if (secondsSince < MIN_SECONDS_BETWEEN_SYNCS) {
          return json(
            { error: `Please wait ${Math.ceil(MIN_SECONDS_BETWEEN_SYNCS - secondsSince)}s before syncing again` },
            429,
          );
        }
      }
    }
    // Claim this sync slot before doing the slow external fetch, so a rapid
    // burst of requests can't all pass the check before any of them finish.
    await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/user_settings?user_id=eq.${userId}`, {
      method: "PATCH",
      headers: { ...restHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ calendar_last_synced_at: new Date().toISOString() }),
    });

    let icsResponse: Response;
    try {
      icsResponse = await fetch(icsUrl);
    } catch {
      return json({ error: "Could not reach that calendar URL" }, 400);
    }
    if (!icsResponse.ok) {
      return json({ error: `Calendar feed returned an error (status ${icsResponse.status})` }, 400);
    }

    const icsText = await icsResponse.text();
    const allEvents = parseIcs(icsText);
    const endDigits = windowEndDigits(todayDigits);
    const windowEvents = allEvents
      .filter((e) => e.dateDigits >= todayDigits && e.dateDigits <= endDigits)
      .map((e) => ({
        uid: e.uid,
        summary: e.summary,
        durationMinutes: e.durationMinutes,
        date: dateDigitsToIso(e.dateDigits),
      }));

    return json({ events: windowEvents });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
