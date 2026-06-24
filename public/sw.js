/**
 * sw.js — Service Worker
 * ---------------------------------------------------------------------------
 * This is what lets someone receive a notification even when this site/app
 * is fully closed — the same mechanism WhatsApp Web, Twitter, etc. use in a
 * browser. It is registered once (see pushNotifications.js) and then lives
 * in the background, woken up by the browser when a push arrives.
 *
 * IMPORTANT, please read: this can only notify a device that has, at some
 * point, opened this site and tapped "Allow" on the notification prompt.
 * There is no way — on the web OR in any native app — to push a notification
 * to a device that has never installed/visited and granted permission.
 * "Outside the app" here means "tab/app closed, or not currently looking at
 * it" — not "someone who has never used the product."
 *
 * Place this file at your site's ROOT (e.g. /public/sw.js so it serves at
 * https://yourapp.com/sw.js — service workers only control paths at or below
 * where they're served from).
 * ---------------------------------------------------------------------------
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "New activity", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Glimmacy";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-badge.png",
    tag: data.tag || undefined,       // collapses repeats of the same conversation
    renotify: !!data.tag,
    data: { url: data.url || "/" },
    vibrate: [80, 40, 80],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an existing tab if one is open, or opens a
// new one — exactly like WhatsApp's "tap to open the chat" behavior.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (clients.length > 0 && "focus" in clients[0]) {
        clients[0].navigate(targetUrl);
        return clients[0].focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});