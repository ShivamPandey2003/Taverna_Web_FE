import { initializeApp, type FirebaseApp } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported } from "firebase/messaging";

// Push notifications come through Firebase Cloud Messaging: the browser gets an
// FCM token here and the API (user/device-token) sends to it. The project's web
// app settings and Web Push key come from .env; without them push is off.
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};
const VAPID_KEY: string | undefined = env.VITE_FIREBASE_VAPID_KEY;

export const pushConfigured = Object.values(firebaseConfig).every(Boolean) && !!VAPID_KEY;

// Shows the notifications while the app isn't in front (public/push-sw.js)
const SERVICE_WORKER_URL = "/push-sw.js";

let app: FirebaseApp | null = null;
const messaging = () => getMessaging((app ??= initializeApp(firebaseConfig)));

let supported: Promise<boolean> | null = null;

// False with no Firebase settings, or in a browser without Web Push (iOS Safari
// outside an installed home-screen app, private windows in some browsers)
export function pushSupported() {
  supported ??=
    pushConfigured && "Notification" in window && "serviceWorker" in navigator
      ? isSupported().catch(() => false)
      : Promise.resolve(false);
  return supported;
}

export const pushPermission = (): NotificationPermission =>
  "Notification" in window ? Notification.permission : "denied";

async function serviceWorker() {
  await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  return navigator.serviceWorker.ready;
}

// Needs the permission already granted
export async function getPushToken() {
  return getToken(messaging(), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: await serviceWorker(),
  });
}

// Unsubscribes this browser, so the old token stops working
export async function deletePushToken() {
  await serviceWorker();
  await deleteToken(messaging());
}
