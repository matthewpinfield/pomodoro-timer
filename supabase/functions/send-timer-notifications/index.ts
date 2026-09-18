// Runs every minute via the same pg_cron + pg_net job pattern as
// send-task-reminders (see schema.sql) - sends the one pending "your
// pomodoro/break just ended" push per user, if any is due. One row per user
// rather than a queue (see scheduled_notifications' comment in schema.sql),
// so there's no grouping step here the way send-task-reminders needs for
// per-task fan-out to multiple devices.
//
// See send-task-reminders/index.ts for why jsr:@negrel/webpush over
// npm:web-push (same reasoning, same VAPID setup, same project secrets).

import { ApplicationServer, PushMessageError, importVapidKeys } from "jsr:@negrel/webpush";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DueRow {
  user_id: string;
  title: string;
  body: string;
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
}

// due_timer_notifications() is locked down to the service_role (see
// schema.sql's revoke/grant) - same bypass-RLS mechanism as send-task-reminders.
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
    const cronSecret = req.headers.get("x-cron-secret");
    if (!cronSecret || cronSecret !== Deno.env.get("CRON_SECRET")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const dueResp = await restRequest("rpc/due_timer_notifications", { method: "POST", body: JSON.stringify({}) });
    if (!dueResp.ok) {
      return json({ error: `due_timer_notifications query failed: ${await dueResp.text()}` }, 500);
    }
    const rows = (await dueResp.json()) as DueRow[];

    const vapidKeys = await importVapidKeys(
      {
        publicKey: JSON.parse(Deno.env.get("VAPID_PUBLIC_KEY_JWK")!),
        privateKey: JSON.parse(Deno.env.get("VAPID_PRIVATE_KEY_JWK")!),
      },
      { extractable: false },
    );
    const appServer = await ApplicationServer.new({
      contactInformation: Deno.env.get("VAPID_SUBJECT") ?? "mailto:support@focuspie.app",
      vapidKeys,
    });

    let sent = 0;
    let failed = 0;

    for (const row of rows) {
      if (row.endpoint && row.p256dh && row.auth) {
        try {
          const subscriber = appServer.subscribe({
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          });
          await subscriber.pushTextMessage(JSON.stringify({ title: row.title, body: row.body, url: "/timer/" }), {});
          sent++;
        } catch (err) {
          failed++;
          if (err instanceof PushMessageError && err.isGone()) {
            // Dead subscription - remove it so future runs (this one and
            // send-task-reminders) stop retrying a lost cause.
            await restRequest(`push_subscriptions?endpoint=eq.${encodeURIComponent(row.endpoint)}`, {
              method: "DELETE",
            });
          } else {
            console.error(`Push failed for user ${row.user_id}:`, err);
          }
        }
      }

      // One-shot: delete regardless of outcome, mirroring send-task-reminders'
      // "mark handled either way" policy - simpler than a retry queue for
      // what's meant to be a best-effort nudge, not a guaranteed delivery.
      await restRequest(`scheduled_notifications?user_id=eq.${row.user_id}`, { method: "DELETE" });
    }

    return json({ due: rows.length, sent, failed });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
