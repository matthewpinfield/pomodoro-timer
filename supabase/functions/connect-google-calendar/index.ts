// Browser-callable (via supabase.functions.invoke), so like fetch-calendar
// this needs CORS handling and verifies the caller's own JWT (forward the
// Authorization header to Auth's own /user endpoint, same pattern).
//
// Exchanges a Google OAuth authorization code (the browser gets this back
// after redirecting through Google's consent screen) for access/refresh
// tokens, and stores them in calendar_connections. No Google SDK used -
// this is a single documented REST call (Google's token endpoint), same
// "plain fetch over a heavy dependency" convention as every other function
// in this codebase.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

// calendar_connections has no insert/update policy for `authenticated` at
// all (see schema.sql) - OAuth tokens are as sensitive as a Stripe secret
// key, so writes only ever happen via the service role.
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
    const { id: userId } = await userResp.json();

    const { code, redirectUri } = await req.json();
    if (!code || typeof code !== "string") return json({ error: "code is required" }, 400);
    if (!redirectUri || typeof redirectUri !== "string") {
      return json({ error: "redirectUri is required" }, 400);
    }

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      return json({ error: `Google token exchange failed: ${errText}` }, 400);
    }

    const tokens = await tokenResp.json();
    const accessToken: string | undefined = tokens.access_token;
    const refreshToken: string | undefined = tokens.refresh_token;
    const expiresInSeconds: number = tokens.expires_in ?? 3600;

    if (!accessToken) return json({ error: "No access token returned by Google" }, 500);

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    // Google only returns a refresh_token on first consent (or when the
    // authorization request explicitly forces re-consent) - if this
    // exchange didn't include one, don't overwrite whatever's already
    // stored with null. The client is expected to always request with
    // prompt=consent specifically to avoid this case, but this stays
    // defensive regardless.
    const row: Record<string, unknown> = {
      user_id: userId,
      provider: "google",
      access_token: accessToken,
      expires_at: expiresAt,
    };
    if (refreshToken) row.refresh_token = refreshToken;

    if (!refreshToken) {
      // Merge rather than a plain upsert, so an omitted refresh_token
      // doesn't violate the not-null constraint on a fresh row, and
      // doesn't clobber an existing one on a reconnect.
      const existingResp = await restRequest(
        `calendar_connections?select=refresh_token&user_id=eq.${userId}&provider=eq.google`,
      );
      const existingRows = existingResp.ok ? await existingResp.json() : [];
      const existingRefreshToken = existingRows?.[0]?.refresh_token;
      if (!existingRefreshToken) {
        return json(
          { error: "Google didn't return a refresh token and none is on file - try disconnecting and reconnecting." },
          500,
        );
      }
      row.refresh_token = existingRefreshToken;
    }

    const upsertResp = await restRequest("calendar_connections?on_conflict=user_id,provider", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(row),
    });
    if (!upsertResp.ok) {
      return json({ error: `Failed to store connection: ${await upsertResp.text()}` }, 500);
    }

    return json({ connected: true });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
