// Fetches a user's ICS calendar feed and returns just today's events.
// Runs server-side (not in the browser) because calendar providers
// generally don't send CORS headers that would let a browser fetch an ICS
// URL directly. Parsing logic lives in ics-parser.ts, kept Deno-free so it
// can be unit tested under Jest - this file is just the HTTP glue.

import { parseIcs } from "./ics-parser.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { icsUrl, todayDigits } = await req.json();
    if (!icsUrl || typeof icsUrl !== "string") return json({ error: "icsUrl is required" }, 400);
    if (!todayDigits || typeof todayDigits !== "string") return json({ error: "todayDigits is required" }, 400);

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
    const todaysEvents = allEvents.filter((e) => e.dateDigits === todayDigits);

    return json({ events: todaysEvents });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
