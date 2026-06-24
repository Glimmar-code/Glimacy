/**
 * pushNotifications.js
 * ---------------------------------------------------------------------------
 * Client-side half of "WhatsApp-style active notifications" for people who
 * aren't currently looking at the app. Pairs with sw.js (service worker)
 * and the `push_subscriptions` table in schema.sql.
 *
 * SETUP YOU STILL NEED TO DO (this file can't do it for you):
 *   1. Generate a VAPID key pair once:  npx web-push generate-vapid-keys
 *   2. Put the PUBLIC key below (or load it from an env var at build time).
 *   3. Store the PRIVATE key as a secret in a Supabase Edge Function that
 *      actually sends pushes (this file only SUBSCRIBES — sending requires
 *      a server, because the private key must never reach the browser).
 *   4. Deploy an Edge Function (e.g. `send-push`) that, given a user_id,
 *      reads their rows from `push_subscriptions` and calls the Web Push
 *      protocol (the `web-push` npm package handles this server-side).
 *      Trigger it from a Postgres webhook on `notifications` inserts, or
 *      call it directly after inserting a message/notification.
 *
 * Drop this file anywhere in your src tree, e.g. ./services/pushNotifications.js
 * ---------------------------------------------------------------------------
 */

const VAPID_PUBLIC_KEY = "REPLACE_WITH_YOUR_VAPID_PUBLIC_KEY";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function registerServiceWorker() {
  if (!isPushSupported()) return null;
  return navigator.serviceWorker.register("/sw.js");
}

/**
 * Call this from a user action (e.g. a "Turn on notifications" toggle in
 * Settings) — browsers require a permission prompt to be triggered by a
 * real user gesture, not on page load.
 */
export async function enablePushNotifications(supabase, userId) {
  if (!isPushSupported()) return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: "denied" };

  const registration = await registerServiceWorker();
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const sub = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) return { ok: false, reason: error.message };
  return { ok: true };
}

export async function disablePushNotifications(supabase) {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
    await subscription.unsubscribe();
  }
}