import { request } from "./apiClient";

// This browser's FCM token, saved on the signed-in account. The API sends the
// account's pushes to every active token it has (web, Android, iOS).
export const pushApi = {
  // Saves a new token or refreshes a known one
  saveToken: (fcmToken: string, deviceId: string) =>
    request<unknown>("post", "user/device-token", { fcmToken, platform: "WEB", deviceId }),

  deleteToken: (fcmToken: string) => request<unknown>("delete", "user/device-token", { fcmToken }),

  // Sends a push to every active token of the account
  sendTest: () =>
    request<unknown>("post", "user/device-token/test-push", {
      title: "Test notification",
      message: "Push notifications are working on this device.",
    }),
};
