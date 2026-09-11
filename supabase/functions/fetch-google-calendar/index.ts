// Browser-callable, same CORS + forwarded-JWT pattern as fetch-calendar.
// Reads a signed-in user's Google Calendar events using their stored OAuth
// tokens (calendar_connections), refreshing the access token first if it's
// expired, and normalizes into the exact same {uid, summary,
// durationMinutes, date} shape fetch-calendar already returns - so
// calendar-view.tsx's review/select UI and importCalendarTasks need no
// changes regardless of which provider supplied the events.
//
// Window matches the existing ICS sync: today through ~30 days ahead.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

const WINDOW_DAYS_AHEAD = 30;

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

interface GoogleEventTime {
  date?: string; // all-day event, YYYY-MM-DD
  dateTime?: string; // timed event, RFC3339 with offset e.g. 2026-09-15T09:00:00+01:00
}

interface GoogleEvent {
  id: string;
  status?: string;
  summary?: string;
  start?: GoogleEventTime;
  end?: GoogleEventTime;
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
    const { id: userId } = await userResp.json();

    const connResp = await restRequest(
      `calendar_connections?select=access_token,refresh_token,expires_at&user_id=eq.${userId}&provider=eq.google`,
    );
    const connRows = connResp.ok ? await connResp.json() : [];
    const connection = connRows?.[0];
    if (!connection) return json({ error: "Google Calendar isn't connected" }, 400);

    let accessToken: string = connection.access_token;

    // Refresh if expired (or about to be, small buffer) - lazily, at fetch
    // time, rather than a scheduled job (see schema.sql's calendar_
    // connections comment for the reasoning).
    if (new Date(connection.expires_at).getTime() < Date.now() + 60_000) {
      const refreshResp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: connection.refresh_token,
          grant_type: "refresh_token",
        }),
      });
      if (!refreshResp.ok) {
        return json({ error: `Failed to refresh Google token: ${await refreshResp.text()}` }, 400);
      }
      const refreshed = await refreshResp.json();
      accessToken = refreshed.access_token;
      const newExpiresAt = new Date(Date.now() + (refreshed.expires_in ?? 3600) * 1000).toISOString();
      await restRequest(`calendar_connections?user_id=eq.${userId}&provider=eq.google`, {
        method: "PATCH",
        body: JSON.stringify({ access_token: accessToken, expires_at: newExpiresAt }),
      });
    }

    const now = new Date();
    const windowEnd = new Date(now.getTime() + WINDOW_DAYS_AHEAD * 24 * 60 * 60 * 1000);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: windowEnd.toISOString(),
      singleEvents: "true", // expands recurring events into individual occurrences
      orderBy: "startTime",
      maxResults: "250",
    });

    const eventsResp = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!eventsResp.ok) {
      return json({ error: `Google Calendar API error: ${await eventsResp.text()}` }, 400);
    }
    const data = await eventsResp.json();
    const rawEvents: GoogleEvent[] = data.items ?? [];

    const events = rawEvents
      .filter((e) => e.status !== "cancelled")
      // All-day events (start.date, no start.dateTime) skipped - a 24h
      // "duration" isn't a meaningful task, same call already made for the
      // ICS import path.
      .filter((e) => e.start?.dateTime && e.end?.dateTime)
      .map((e) => {
        const startMs = new Date(e.start!.dateTime!).getTime();
        const endMs = new Date(e.end!.dateTime!).getTime();
        return {
          uid: e.id,
          summary: e.summary || "Untitled event",
          durationMinutes: Math.round((endMs - startMs) / 60000),
          // The dateTime string already carries its own UTC offset, so its
          // first 10 characters are the correct local calendar date for
          // that event - no separate timezone conversion needed.
          date: e.start!.dateTime!.slice(0, 10),
        };
      })
      .filter((e) => e.durationMinutes > 0);

    return json({ events });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
