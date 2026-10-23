// Shows Taverna's push notifications (Firebase Cloud Messaging, delivered as Web
// Push). Registered by src/libs/push.ts. While the app is open and in front the
// message goes to the page instead, which shows it as a toast.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function readPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    return { notification: { body: event.data.text() } };
  }
}

// Where a click goes: the link the message names, else the booking's tracking page
function linkOf(payload) {
  const notification = payload.notification || {};
  const data = payload.data || {};
  const link =
    (payload.fcmOptions && payload.fcmOptions.link) ||
    notification.click_action ||
    data.link ||
    data.url;
  if (link) return link;
  const bookingId = data.bmsId || data.bookingId;
  return bookingId ? `/dashboard/book-service/tracking/${bookingId}` : "/dashboard";
}

self.addEventListener("push", (event) => {
  const payload = readPayload(event);
  // Seen in DevTools > Application > Service workers > push-sw.js (inspect)
  console.log("[push-sw] push received", payload);
  const notification = payload.notification || {};
  const data = payload.data || {};
  const title = notification.title || data.title || "Taverna";
  const body = notification.body || data.body || data.message || "";
  const link = linkOf(payload);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const front = windows.find((client) => client.focused && client.visibilityState === "visible");
      if (front) {
        front.postMessage({ type: "taverna-push", title, body, link });
        return;
      }
      await self.registration.showNotification(title, {
        body,
        icon: notification.icon || data.icon,
        tag: data.notificationId || payload.fcmMessageId,
        data: { link },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.link) || "/", self.location.origin);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === url.origin);
      if (open) {
        await open.focus();
        if (url.origin === self.location.origin) await open.navigate(url.href).catch(() => undefined);
        return;
      }
      await self.clients.openWindow(url.href);
    })(),
  );
});
