// Plain static file, no build step - Next's static export copies public/*
// verbatim, and this needs to be plain JS anyway since it runs outside the
// app's module bundle. Deliberately minimal for v1: show the notification,
// and on tap either focus an existing tab or open a new one to today's plan.
// No in-notification action buttons (snooze/mark done) - a bare service
// worker has no access to the main page's Supabase session, so acting on a
// click without opening the app first needs real extra plumbing. Flagged as
// a fast-follow in FUTURE_FEATURES.md.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "FocusPie";
  const url = data.url || "/pie-chart/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/pie-chart/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((client) => client.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
