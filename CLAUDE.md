# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Taverna web app: a car-service booking frontend with a customer dashboard (vehicle pickup/delivery, service booking, tracking, specials, account) and an admin dashboard (booking management). React 19 + TypeScript + Vite 8, Tailwind CSS v4. There is no backend yet: API calls are answered by an in-browser mock server (see API layer).

## Commands

```bash
npm run dev       # Vite dev server with HMR
npm run build     # tsc -b (type-check) then vite build
npm run lint      # eslint .
npm run preview   # serve the production build
```

There is no test runner configured. `npm run build` is the type-check gate: `tsconfig.app.json` sets `noUnusedLocals` / `noUnusedParameters`, so unused imports or variables fail the build.

## Architecture

- **Entry / providers**: [src/main.tsx](src/main.tsx) wraps the app in `TanstackProvider` → `ReduxProvider`, plus a global `sonner` `<Toaster>`. [src/App.tsx](src/App.tsx) only mounts the router.
- **Routing** ([src/routes/index.tsx](src/routes/index.tsx)): `react-router` v8 `createBrowserRouter`. `/` is the public landing page (`Home`). `/dashboard/*` (customer) and `/admin` (admin bookings) both render inside [DashboardLayout](src/layouts/DashboardLayout.tsx) (global `Navbar` + `Sidebar` + `<Outlet/>`) and are wrapped in [RequireAuth](src/components/auth/RequireAuth.tsx). Booking flow is `/dashboard/book-service` → `/book-service/review` (`PickupDelivery` page) → `/book-service/tracking`.
- **Auth & roles**: customers and admins log in through the same email + OTP `AuthModal`; the `role` in the OTP-verify response (`AuthSession` in `src/types/auth.ts`) routes admins to `/admin`, users to `/dashboard`. `RequireAuth` sends logged-out visitors to `/` with the login modal open; `role="admin"` routes redirect non-admins to `/dashboard`. Admins can use every customer page with their own profile. The session is persisted to `localStorage` by a `store.subscribe` in `store.ts` ([authStorage.ts](src/services/authStorage.ts)); `logout` resets the user-owned slices (vehicle, address, booking, tracking, account) so each account sees only its own data. Log out via `useLogout` (also clears the TanStack Query cache).
- **Pages vs. features**: `src/pages/*` are thin route components that compose pieces from `src/components/features/<domain>/` (landing, dashboard, booking, review, tracking, specials, account, addresses, auth). `src/components/global/` holds layout chrome (Navbar, Sidebar, notifications); `src/components/ui/` holds generic primitives.
- **Types & static data**: shared domain types live in `src/types/` (`Vehicle`, `Address`, `Dealership`, `Service`, `Booking`, `Notification`). Feature `*.data.ts` files hold static catalog data (services, dealerships, default notifications) and mock API stand-ins (e.g. `lookupVehicleByVin`); user-owned data (vehicles, addresses) is *not* mocked and lives only in Redux.
- **Static site content** (brand name, nav links, hero copy, contact info) lives in [src/config/site.config.ts](src/config/site.config.ts).
- **State — Redux Toolkit is the single source of app state** ([src/redux/store.ts](src/redux/store.ts)), one folder per reducer:
  - Domain slices: `vehicle` (user's vehicle list), `address` (saved addresses + default), `booking` (booking in progress: selected vehicle/service/pickup/dealership, driveable, concern), `tracking` (active booking snapshot + status), `notification`, `account` (logged-in profile + active Account section), `auth` (session + login/signup/OTP step), `location` (geolocation thunk; `useLocation` hook wraps it), `adminBookings` (admin table query: page, pageSize, sort, search, status/service filters).
  - Modal visibility gets its own reducer per page under `redux/modals/<page>Modal/` (`homeModal`, `dashboardModal`, `bookServiceModal`, `reviewModal`, `accountModal`, `adminModal` — the admin one also holds the active workflow step). Don't put modal flags in domain slices.
  - Store IDs, not copies: `booking` holds `selectedVehicleId`/`pickupLocation`/`selectedDealershipId` and selectors (`selectBookingVehicle`, `selectBookingAddress`, …) resolve them, falling back to the default address. `confirmBooking` thunk ([bookingThunks.ts](src/redux/booking/bookingThunks.ts)) snapshots the booking into `tracking`; other slices react to its `bookingCreated` action via `extraReducers`.
  - Components read/dispatch directly with `useAppSelector`/`useAppDispatch` from [src/redux/hooks.ts](src/redux/hooks.ts) instead of receiving data through props. Reusable modals used on several pages (`SelectVehicleModal`, `AddAddressModal`) take only `open`/`onClose` from the page's modal slice and read/write data via Redux.
  - Modals render their inner content only while open so transient `useState` (highlighted option, form values) re-initialises from Redux on each open. Keep state serializable (dates as ISO strings).
  - Server data (admin bookings list/detail, staff lists, customer booking status) is fetched with TanStack Query hooks in `src/services/queries/`; their query keys are built from Redux state (e.g. `useAdminBookings(params)` with `selectBookingListParams`), so changing a filter in Redux refetches. Mutations update the detail cache and invalidate `adminKeys.bookings`.
- **API layer**: feature API modules (`authApi`, `bookingApi`, `adminApi` in `src/services/`) wrap each call in `callApi(mock, real)` ([apiClient.ts](src/services/apiClient.ts)). While `VITE_USE_MOCK_API` is not `"false"`, the mock handler in [mockServer.ts](src/services/mock/mockServer.ts) answers (adds latency, enforces admin-only and workflow-order rules, persists its DB in `localStorage` key `taverna_mock_db`; clear it to reseed). Mock logins: `admin@taverna.com` (admin), `alex@gmail.com` (user); any 6-digit OTP. The real path goes through `apiRequest` ([apiService.ts](src/services/apiService.ts)): axios with base URL `VITE_REACT_APP_API_URL`, `Bearer` token from `localStorage.token`, automatic error toasts via [apiError.ts](src/libs/apiError.ts), 401 → clear storage and redirect to `/`. `request()` assumes responses are `{ code, message, data }`. Admin list sorting/filtering/search/pagination are query params handled server-side. Either way, errors are toasted by the API layer — callers should not toast errors themselves.
- **Admin booking workflow**: clicking a row opens `BookingWorkflowModal`, a stepper whose steps must be completed in order (confirm → assign valet → assign relationship manager → payment). Step completion is derived from booking fields (`confirmedAt`, `valet`, `relationshipManager`, `payment`) in [admin.utils.ts](src/components/features/admin/admin.utils.ts).
- **Forms**: `react-hook-form` + `zod` via `@hookform/resolvers`; schemas and inferred types live in `src/schema/` (see `auth.schema.ts` for login/signup/OTP).

## Conventions

- Import via the `@/` alias (maps to `src/`).
- `verbatimModuleSyntax` is on: type-only imports must use `import type` / `type` specifiers.
- React Compiler is enabled (babel preset in [vite.config.ts](vite.config.ts)), so manual `useMemo`/`useCallback` is usually unnecessary.
- Styling is Tailwind v4 with theme tokens defined in `@theme` in [src/index.css](src/index.css) (e.g. `bg-primary`, `text-text-secondary`, `rounded-card`, `rounded-button`) plus a `.form-input` component class. Use `cn()` from [src/libs/utils.ts](src/libs/utils.ts) to merge class names.
- Icons come from `reicon-react`; toasts from `sonner`.
