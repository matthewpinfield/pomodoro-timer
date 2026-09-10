// Runs every minute via the pg_cron + pg_net job declared in schema.sql, to
// check for tasks whose reminder start_time has just arrived (in the user's
// own stored timezone) and send a real Web Push notification for each. No
// browser ever calls this directly, so unlike fetch-calendar/index.ts there's
// no CORS handling here - auth is a shared secret header instead of a user
// JWT, since a cron trigger has no signed-in user to forward one from.
//
// Uses jsr:@negrel/webpush rather than npm:web-push - the latter depends on
// Node's crypto.ECDH/crypto.Sign, which Deno's Node-compat layer doesn't
// fully implement (see denoland/deno#23693, #18416). @negrel/webpush is
// Web-Crypto-native and built specifically for Deno/Supabase Edge Functions;
// validated in isolation before this file was written (VAPID signing + ECDH
// + AES-128-GCM payload encryption all confirmed working under Deno, request
// reached a real push service and failed only with a genuine HTTP 404 from a
// deliberately-fake endpoint, not a crypto error).

import { ApplicationServer, PushMessageError, importVapidKeys } from "jsr:@negrel/webpush";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface DueRow {
  task_id: string;
  user_id: string;
  task_name: string;
  task_start_time: string;
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
}

// due_task_reminders() is locked down to the service_role (see schema.sql's
// revoke/grant) - this key is what lets these plain REST calls read/write
// across all users' rows, same bypass-RLS mechanism the service role always
// has, not anything special about the requests themselves.
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

    const dueResp = await restRequest("rpc/due_task_reminders", { method: "POST", body: JSON.stringify({}) });
    if (!dueResp.ok) {
      return json({ error: `due_task_reminders query failed: ${await dueResp.text()}` }, 500);
    }
    const rows = (await dueResp.json()) as DueRow[];

    // due_task_reminders()'s left join means a task with zero subscribed
    // devices still appears once, with endpoint/p256dh/auth all null - group
    // by task so it's still marked handled even with nothing to actually send.
    const byTask = new Map<string, { taskName: string; startTime: string; subs: DueRow[] }>();
    for (const row of rows) {
      const existing = byTask.get(row.task_id);
      if (existing) existing.subs.push(row);
      else byTask.set(row.task_id, { taskName: row.task_name, startTime: row.task_start_time, subs: [row] });
    }

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
    let goneRemoved = 0;

    for (const [taskId, { taskName, startTime, subs }] of byTask) {
      for (const sub of subs) {
        if (!sub.endpoint || !sub.p256dh || !sub.auth) continue; // no device subscribed yet
        try {
          const subscriber = appServer.subscribe({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          });
          await subscriber.pushTextMessage(
            JSON.stringify({ title: taskName, body: "Starting now", url: "/pie-chart/" }),
            {},
          );
          sent++;
        } catch (err) {
          failed++;
          if (err instanceof PushMessageError && err.isGone()) {
            // Dead subscription (unsubscribed, or the push service expired
            // it) - remove it so future runs stop retrying a lost cause.
            await restRequest(`push_subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}`, {
              method: "DELETE",
            });
            goneRemoved++;
          } else {
            console.error(`Push failed for task ${taskId}:`, err);
          }
        }
      }

      // Mark handled regardless of outcome (including zero subscribed
      // devices) - reminder_last_sent_for is what the due-query guards on,
      // so this is what stops the same start_time being retried every minute.
      await restRequest(`tasks?id=eq.${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ reminder_sent_at: new Date().toISOString(), reminder_last_sent_for: startTime }),
      });
    }

    return json({ tasksProcessed: byTask.size, sent, failed, goneRemoved });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
