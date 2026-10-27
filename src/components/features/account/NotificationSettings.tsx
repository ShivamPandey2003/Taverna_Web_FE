import { useEffect, useState } from "react";
import { Envelope, MessageText, NotificationBing } from "reicon-react";
import { toast } from "sonner";
import { pushApi } from "@/services/pushApi";
import {
  disablePush,
  enablePush,
  pushDeviceState,
  type PushDeviceState,
} from "@/services/pushDevice";
import { Spinner } from "@/components/ui/Spinner";
import { Switch } from "@/components/ui/Switch";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/services/queries/profileQueries";
import type { NotificationPreferences } from "@/types/profile";

const channels: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: typeof Envelope;
}[] = [
  {
    key: "emailEnabled",
    label: "Email",
    description: "Booking confirmations, bills and receipts in your inbox.",
    icon: Envelope,
  },
  {
    key: "smsEnabled",
    label: "SMS",
    description: "Text messages when your valet is on the way or your vehicle is ready.",
    icon: MessageText,
  },
  {
    key: "pushEnabled",
    label: "Push Notifications",
    description: "Live updates on your service while you use the app.",
    icon: NotificationBing,
  },
];

// The Account page's Notifications section: one switch per channel, each saved
// as soon as it's flipped
export function NotificationSettings() {
  const { data: preferences, isPending, isError, isFetching, refetch } =
    useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const saving = updatePreferences.isPending;
  const push = usePushDevice();

  const handleToggle = (key: keyof NotificationPreferences, enabled: boolean) => {
    if (!preferences) return;
    const label = key === "pushEnabled" ? "Push" : channels.find((channel) => channel.key === key)?.label;
    updatePreferences.mutate(
      { ...preferences, [key]: enabled },
      { onSuccess: () => toast.success(`${label} notifications ${enabled ? "on" : "off"}`) },
    );
    // The preference covers every device; this browser is set up (or let go) beside it
    if (key === "pushEnabled") void (enabled ? push.enable() : push.disable());
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Notifications</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose how we keep you posted about your bookings.
          </p>
        </div>

        {saving && (
          <span className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Spinner className="h-3.5 w-3.5" />
            Saving...
          </span>
        )}
      </div>

      {isPending && <PreferencesSkeleton />}

      {isError && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-900">We couldn't load your notification settings.</p>

          <button
            data-test-id="notification-settings-retry"
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-900 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetching && <Spinner className="h-3 w-3" />}
            {isFetching ? "Retrying..." : "Try Again"}
          </button>
        </div>
      )}

      {preferences && (
        <ul className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-200">
          {channels.map(({ key, label, description, icon: Icon }) => (
            <li key={key} className="flex items-center gap-4 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                <Icon size={19} strokeWidth={1.8} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="mt-0.5 text-xs text-gray-500">{description}</p>
                {key === "pushEnabled" && preferences.pushEnabled && <PushDeviceStatus push={push} />}
              </div>

              <Switch
                testId={`notification-switch-${key}`}
                checked={preferences[key]}
                onChange={(enabled) => handleToggle(key, enabled)}
                // One save at a time, so each sends the latest of all three
                disabled={saving || push.busy}
                label={`${label} notifications`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Push in this browser: its state, and the actions it allows
function usePushDevice() {
  const [state, setState] = useState<PushDeviceState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pushDeviceState().then(setState);
  }, []);

  const run = async (action: () => Promise<PushDeviceState | void>) => {
    setBusy(true);
    try {
      const next = await action();
      setState(next ?? (await pushDeviceState()));
    } catch {
      // Toasted where it failed
      setState(await pushDeviceState());
    } finally {
      setBusy(false);
    }
  };

  return {
    state,
    busy,
    enable: () => run(enablePush),
    disable: () => run(disablePush),
    sendTest: () =>
      run(async () => {
        await pushApi.sendTest();
        toast.success("Test notification sent");
      }),
  };
}

const pushStateText: Record<PushDeviceState, string> = {
  on: "On in this browser.",
  off: "Not on in this browser yet.",
  blocked: "Blocked by this browser. Allow notifications for this site in its settings.",
  unavailable: "This browser can't receive push notifications.",
};

function PushDeviceStatus({ push }: { push: ReturnType<typeof usePushDevice> }) {
  if (!push.state) return null;
  const action =
    push.state === "on"
      ? { label: "Send Test", onClick: push.sendTest }
      : push.state === "off"
        ? { label: "Turn On Here", onClick: push.enable }
        : null;

  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className={push.state === "on" ? "text-green-700" : "text-amber-700"}>
        {pushStateText[push.state]}
      </span>
      {action && (
        <button
          data-test-id={`push-${action.label.toLowerCase().replace(/\s+/g, "-")}`}
          type="button"
          onClick={action.onClick}
          disabled={push.busy}
          className="inline-flex items-center gap-1.5 font-semibold text-gray-900 underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {push.busy && <Spinner className="h-3 w-3" />}
          {action.label}
        </button>
      )}
    </p>
  );
}

function PreferencesSkeleton() {
  return (
    <div
      className="mt-6 animate-pulse divide-y divide-gray-100 rounded-xl border border-gray-200"
      role="status"
      aria-label="Loading your notification settings"
    >
      {channels.map((channel) => (
        <div key={channel.key} className="flex items-center gap-4 px-4 py-4">
          <div className="h-10 w-10 rounded-full bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded bg-gray-200" />
            <div className="h-3 w-2/3 rounded bg-gray-100" />
          </div>
          <div className="h-6 w-11 rounded-full bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
