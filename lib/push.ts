// Client-side Web Push subscribe/unsubscribe flow. "Enabled" is deliberately
// not tracked anywhere in app state (see context/settings-context.tsx's
// timezone comment for the same reasoning) - it's inherently per-device, so
// the source of truth is always whatever the browser's own Push API reports
// right now via getExistingSubscription().

import { supabase } from "@/lib/supabase";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(`${basePath}/`);
  if (!registration) return null;
  return registration.pushManager.getSubscription();
}

// Web Push's applicationServerKey wants raw bytes, not the base64url string
// the VAPID public key is stored/transmitted as.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export async function enablePushReminders(userId: string): Promise<void> {
  if (!isPushSupported()) {
    throw new Error("Push notifications aren't supported in this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission wasn't granted.");
  }

  const registration = await navigator.serviceWorker.register(`${basePath}/sw.js`);
  await navigator.serviceWorker.ready;

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error("Push isn't configured yet.");
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
  });

  const subJson = subscription.toJSON();
  if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
    throw new Error("Push subscription is missing required fields.");
  }

  if (!supabase) {
    throw new Error("Not signed in.");
  }
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
}

export async function disablePushReminders(): Promise<void> {
  const subscription = await getExistingSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  if (supabase) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  }
}
