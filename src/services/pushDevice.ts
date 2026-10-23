import { toast } from "sonner";
import { deletePushToken, getPushToken, pushPermission, pushSupported } from "@/libs/push";
import { pushApi } from "./pushApi";

// Push in this browser, apart from the account's pushEnabled preference (which
// covers every device): "on" once its token is saved on the account.
export type PushDeviceState = "unavailable" | "blocked" | "off" | "on";

const TOKEN_KEY = "taverna_push_token";
const DEVICE_KEY = "taverna_device_id";

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode): the token is then saved again next visit
  }
}

// Stays the same for this browser across accounts and tokens
function deviceId() {
  let id = readStorage(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    writeStorage(DEVICE_KEY, id);
  }
  return id;
}

async function saveToken() {
  let token: string;
  try {
    token = await getPushToken();
  } catch {
    toast.error("We couldn't turn on push notifications in this browser.");
    throw new Error("No push token");
  }
  // The API layer toasts a failed save
  await pushApi.saveToken(token, deviceId());
  writeStorage(TOKEN_KEY, token);
  // To compare with the token the backend sends to
  if (import.meta.env.DEV) console.info("[push] FCM token saved", token);
}

export async function pushDeviceState(): Promise<PushDeviceState> {
  if (!(await pushSupported())) return "unavailable";
  const permission = pushPermission();
  if (permission === "denied") return "blocked";
  return permission === "granted" && readStorage(TOKEN_KEY) ? "on" : "off";
}

// Asks for the permission (call it from a click: some browsers only ask then)
// and saves this browser's token on the account
export async function enablePush(): Promise<PushDeviceState> {
  if (!(await pushSupported())) return "unavailable";
  const permission = await Notification.requestPermission();
  if (permission === "denied") return "blocked";
  if (permission !== "granted") return "off";
  await saveToken();
  return "on";
}

// Saves the token again once a visit (tokens change), without asking anything
export async function refreshPush() {
  if (!(await pushSupported()) || pushPermission() !== "granted") return;
  await saveToken();
}

// Takes this browser's token off the account and unsubscribes it
export async function disablePush() {
  const token = readStorage(TOKEN_KEY);
  writeStorage(TOKEN_KEY, null);
  if (token) await pushApi.deleteToken(token).catch(() => undefined);
  await deletePushToken().catch(() => undefined);
}

// On logout: the token stops going to this account. The browser stays
// subscribed, so the next account to sign in here saves the same token.
export async function forgetPushToken() {
  const token = readStorage(TOKEN_KEY);
  if (!token) return;
  writeStorage(TOKEN_KEY, null);
  await pushApi.deleteToken(token).catch(() => undefined);
}
