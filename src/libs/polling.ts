import type { Query } from "@tanstack/react-query";

// How often the real-time queries load again: where a booking stands, for the
// customer, the admin and the staff. Polls only while the tab is visible
// (TanStack Query's default).
export const LIVE_REFRESH_MS = 5_000;

// `refetchInterval` for those queries. Stops after a failed load: the API layer
// toasts every failure, and a poll would repeat the toast every 5s. A successful
// load (a manual refresh, a mutation's invalidation, coming back to the page)
// starts it again.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const liveRefetch = <TData>(query: Query<TData, Error, TData, any>) =>
  query.state.status === "error" ? false : LIVE_REFRESH_MS;
