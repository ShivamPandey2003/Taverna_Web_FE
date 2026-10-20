import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { refreshPush } from "@/services/pushDevice";
import { notificationKeys } from "@/services/queries/notificationQueries";
import { useNotificationPreferences } from "@/services/queries/profileQueries";

interface PushMessage {
  type: "taverna-push";
  title: string;
  body: string;
  link: string;
}

// Push notifications on the dashboard: saves this browser's token again once a
// visit while the customer has push on and the browser allows it (the
// permission itself is asked from the Account page's switch), and shows a push
// that arrives while the app is in front as a toast (public/push-sw.js hands it
// over instead of showing it)
export function usePushNotifications(enabled: boolean) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: preferences } = useNotificationPreferences(enabled);
  const pushOn = enabled && preferences?.pushEnabled === true;

  useEffect(() => {
    if (pushOn) refreshPush().catch(() => undefined);
  }, [pushOn]);

  useEffect(() => {
    if (!enabled || !("serviceWorker" in navigator)) return;

    const onMessage = (event: MessageEvent<PushMessage>) => {
      if (event.data?.type !== "taverna-push") return;
      const { title, body, link } = event.data;
      toast(title, {
        description: body || undefined,
        action: { label: "View", onClick: () => navigate(link) },
      });
      // The bell's list has the new notification
      queryClient.invalidateQueries({ queryKey: notificationKeys.list });
    };

    navigator.serviceWorker.addEventListener("message", onMessage);
    // addEventListener alone may leave the worker's messages queued
    navigator.serviceWorker.startMessages();
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [enabled, navigate, queryClient]);
}
