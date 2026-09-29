import { BookingStatus } from "@/types/booking";
import type { AuthSession, AuthUser } from "@/types/auth";
import {
  ADVISOR_MILESTONES,
  VALET_MILESTONES,
  type AdminBooking,
  type AdvisorMilestone,
  type BookingListParams,
  type Invoice,
  type InvoiceLine,
  type Paginated,
  type StaffListParams,
  type StaffMember,
  type StaffRole,
  type ValetLeg,
  type ValetMilestone,
} from "@/types/admin";
import type { Dealership } from "@/types/dealership";
import type { ServiceId } from "@/types/service";
import { authStorage } from "@/services/authStorage";
import { shortName } from "@/libs/utils";
import { dealerships as seedDealerships } from "@/components/features/review/dealership.data";

// In-browser stand-in for the backend. Data is kept in localStorage so bookings
// placed from the user dashboard show up in the admin dashboard.

const DB_KEY = "taverna_mock_db";

type MockDb = {
  users: AuthUser[];
  bookings: AdminBooking[];
  valets: StaffMember[];
  relationshipManagers: StaffMember[];
  dealerships: Dealership[];
};

const staff = (id: string, name: string, phone: string, available: boolean): StaffMember => ({
  id,
  name,
  email: `${name.toLowerCase().replace(/\s+/g, ".")}@taverna.com`,
  phone,
  available,
});

const valets: StaffMember[] = [
  staff("valet-1", "Michael Rivera", "(954) 555-0141", true),
  staff("valet-2", "Daniel Brooks", "(954) 555-0178", true),
  staff("valet-3", "Sofia Martinez", "(954) 555-0192", false),
  staff("valet-4", "James Carter", "(954) 555-0115", true),
];

// Advisors; the API still calls them relationship managers
const relationshipManagers: StaffMember[] = [
  staff("rm-1", "Olivia Bennett", "(954) 555-0220", true),
  staff("rm-2", "Ethan Walker", "(954) 555-0236", true),
  staff("rm-3", "Priya Shah", "(954) 555-0251", false),
];

const seedUsers: AuthUser[] = [
  {
    id: "u-admin",
    name: "Taverna Admin",
    email: "admin@taverna.com",
    phone: "(954) 555-0100",
    role: "admin",
  },
  {
    id: "u-alex",
    name: "Alex",
    email: "alex@gmail.com",
    phone: "(218) 123-4567",
    role: "user",
  },
];

// Deterministic pseudo-random numbers so the seed is identical on every machine
function createRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function seedBookings(): AdminBooking[] {
  const random = createRandom(42);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];

  const customers = [
    ["Alex", "alex@gmail.com", "(218) 123-4567"],
    ["Maria Lopez", "maria.lopez@gmail.com", "(305) 555-0134"],
    ["John Smith", "john.smith@yahoo.com", "(786) 555-0162"],
    ["Emily Chen", "emily.chen@outlook.com", "(954) 555-0187"],
    ["David Kim", "david.kim@gmail.com", "(561) 555-0119"],
    ["Sarah Johnson", "sarah.j@gmail.com", "(954) 555-0156"],
    ["Carlos Diaz", "carlos.diaz@gmail.com", "(305) 555-0171"],
    ["Aisha Patel", "aisha.patel@gmail.com", "(786) 555-0128"],
  ];
  const vehicles = [
    ["JEEP", "Grand Cherokee", 2022],
    ["JEEP", "Wrangler", 2021],
    ["DODGE", "Durango", 2023],
    ["RAM", "1500", 2020],
    ["CHRYSLER", "Pacifica", 2022],
  ] as const;
  const pickups = [
    "1234 NE 13th Street, Fort Lauderdale, FL 33304",
    "5678 E Sunrise Blvd, Fort Lauderdale, FL 33304",
    "810 SE 17th Street, Fort Lauderdale, FL 33316",
    "2200 N Federal Hwy, Pompano Beach, FL 33062",
  ];
  const dealerships = ["Taverna CDJR Plantation", "Taverna Fort Lauderdale"];
  const concerns = [
    "",
    "Check engine light is on",
    "Brake pads feel worn",
    "Oil change and tire rotation",
    "AC is not cooling",
  ];
  const services: ServiceId[] = ["pickup-delivery", "loaner-only"];

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return Array.from({ length: 42 }, (_, index): AdminBooking => {
    const [name, email, phone] = pick(customers);
    const [brand, model, year] = pick(vehicles);
    const createdAt = new Date(now - Math.floor(random() * 30 * day)).toISOString();

    const booking: AdminBooking = {
      id: `PC-${String(482900 + index)}`,
      customer: {
        id: email === "alex@gmail.com" ? "u-alex" : `u-${index}`,
        name,
        email,
        phone,
      },
      serviceId: pick(services),
      vehicle: {
        brand,
        model,
        year,
        vin: `1C4RJF${String(10000000000 + Math.floor(random() * 89999999999))}`.slice(0, 17),
      },
      pickup: pick(pickups),
      dealershipName: pick(dealerships),
      driveable: random() > 0.2,
      concern: pick(concerns),
      scheduledAt:
        random() > 0.5 ? new Date(Date.parse(createdAt) + day).toISOString() : null,
      createdAt,
      status: BookingStatus.IN_QUEUE,
      confirmedAt: null,
      valet: null,
      relationshipManager: null,
      payment: null,
    };

    // Walk the booking some way through the workflow; 40% are finished history.
    // The demo customer's are all finished, so they can book right away.
    const finished = booking.customer.id === "u-alex" || random() < 0.4;
    const actions = finished ? WORKFLOW_ACTIONS : Math.floor(random() * WORKFLOW_ACTIONS);
    const pickStaff: StaffPicker = {
      valet: () => pick(valets),
      manager: () => pick(relationshipManagers),
    };

    // Each action happens 10-40 minutes after the previous one
    let time = Date.parse(createdAt);
    withClock(
      () => new Date((time += (10 + Math.floor(random() * 30)) * 60 * 1000)).toISOString(),
      () => {
        for (let count = 0; count < actions; count++) {
          // The seed pays bills itself instead of waiting for the customer
          const action = nextAction(booking, pickStaff) ?? payAction(booking);
          if (!action) break;
          action();
        }
      },
    );

    return booking;
  });
}

function loadDb(): MockDb {
  const seed: MockDb = {
    users: seedUsers,
    bookings: seedBookings(),
    valets,
    relationshipManagers,
    dealerships: seedDealerships,
  };

  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      // Seed collections added after the DB was first saved
      const saved: MockDb = { ...seed, ...(JSON.parse(raw) as Partial<MockDb>) };
      // Staff saved before they had an email
      const withEmail = (member: StaffMember) => ({ ...member, email: member.email ?? "" });
      saved.valets = saved.valets.map(withEmail);
      saved.relationshipManagers = saved.relationshipManagers.map(withEmail);
      // Older seeds left paid bookings at "Valet assigned" forever, which kept
      // every valet and advisor on an active booking (so none could be deleted)
      saved.bookings.forEach((booking) => {
        if (booking.payment?.status === "paid" && booking.status === BookingStatus.VALET_ASSIGNED) {
          booking.status = BookingStatus.SERVICE_COMPLETE;
        }
        // Bookings finished before valet and advisor milestones existed
        if (booking.status === BookingStatus.SERVICE_COMPLETE && !booking.completedAt) {
          const at = booking.payment?.updatedAt ?? booking.createdAt;
          const all = <T extends string>(keys: readonly T[]) =>
            Object.fromEntries(keys.map((key) => [key, at])) as Record<T, string>;
          booking.pickupProgress = all(VALET_MILESTONES);
          booking.advisorProgress = all(ADVISOR_MILESTONES);
          booking.deliveryValet ??= booking.valet;
          booking.deliveryProgress = all(VALET_MILESTONES);
          booking.completedAt = at;
        }
      });
      return saved;
    }
  } catch {
    // fall through to a fresh seed
  }
  return seed;
}

function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // ignore quota / private mode errors
  }
}

function findUserByEmail(email: string) {
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

function currentUser() {
  const session = authStorage.load();
  const user = session && db.users.find((item) => item.id === session.user.id);
  if (!user) throw new Error("Your session has expired. Please log in again.");
  return user;
}

function requireAdmin() {
  if (currentUser().role !== "admin") {
    throw new Error("You don't have permission to perform this action.");
  }
}

const staffIdPrefixes: Record<StaffRole, string> = { valet: "valet", manager: "rm" };
const staffLabels: Record<StaffRole, string> = {
  valet: "valet",
  manager: "advisor",
};

function staffList(role: StaffRole) {
  return role === "valet" ? db.valets : db.relationshipManagers;
}

function findStaff(role: StaffRole, id: string) {
  const member = staffList(role).find((item) => item.id === id);
  if (!member) throw new Error(`We couldn't find this ${staffLabels[role]}.`);
  return member;
}

const phoneDigits = (phone: string) => phone.replace(/\D/g, "");

type StaffFields = Pick<StaffMember, "name" | "email" | "phone" | "available">;

function assertContactFree(
  role: StaffRole,
  input: Pick<StaffMember, "email" | "phone">,
  exceptId?: string,
) {
  const others = staffList(role).filter((member) => member.id !== exceptId);
  if (others.some((member) => phoneDigits(member.phone) === phoneDigits(input.phone))) {
    throw new Error("Someone with this phone number already exists.");
  }
  const email = input.email.toLowerCase();
  if (others.some((member) => member.email.toLowerCase() === email)) {
    throw new Error("Someone with this email already exists.");
  }
}

// Unfinished bookings the member is assigned to
function activeAssignments(role: StaffRole, id: string) {
  return db.bookings.filter((booking) => {
    const assigned =
      role === "valet" ? [booking.valet, booking.deliveryValet] : [booking.relationshipManager];
    return (
      assigned.some((member) => member?.id === id) &&
      booking.status !== BookingStatus.SERVICE_COMPLETE
    );
  });
}

// A customer's booking that isn't complete yet; they can only have one at a time
function findOpenBooking(customerId: string) {
  return (
    db.bookings.find(
      (booking) =>
        booking.customer.id === customerId && booking.status !== BookingStatus.SERVICE_COMPLETE,
    ) ?? null
  );
}

function findBooking(id: string) {
  const booking = db.bookings.find((item) => item.id === id);
  if (!booking) throw new Error("We couldn't find this booking.");
  return booking;
}

// A booking the logged-in customer owns (admins can open any)
function findMyBooking(id: string) {
  const user = currentUser();
  const booking = findBooking(id);
  if (booking.customer.id !== user.id && user.role !== "admin") {
    throw new Error("We couldn't find this booking.");
  }
  return booking;
}

const TAX_RATE = 0.08;
const roundCents = (value: number) => Math.round(value * 100) / 100;

function serviceLine(booking: AdminBooking) {
  if (booking.serviceId === "loaner-only") return "Loaner Service";
  return booking.valet ? `Valet Service by ${shortName(booking.valet.name)}` : "Valet Service";
}

// Standard bill: service, fuel surcharge, convenience fee (+ tow) and tax
function createInvoice(booking: AdminBooking): Invoice {
  const items: InvoiceLine[] = [
    { label: serviceLine(booking), amount: booking.serviceId === "pickup-delivery" ? 340 : 180 },
    { label: "Fuel surcharge", amount: 12 },
    { label: "Convenience fee", amount: 4.48 },
  ];
  if (!booking.driveable) items.push({ label: "Tow truck", amount: 49 });

  const subtotal = roundCents(items.reduce((sum, item) => sum + item.amount, 0));
  const tax = roundCents(subtotal * TAX_RATE);

  return {
    issuedAt: new Date().toISOString(),
    items,
    subtotal,
    taxRate: TAX_RATE,
    tax,
    total: roundCents(subtotal + tax),
  };
}

function findDealership(id: string) {
  const dealership = db.dealerships.find((item) => item.id === id);
  if (!dealership) throw new Error("We couldn't find this dealership.");
  return dealership;
}

function assertDealershipNameFree(name: string, exceptId?: string) {
  const value = name.trim().toLowerCase();
  const taken = db.dealerships.some(
    (dealership) => dealership.id !== exceptId && dealership.name.toLowerCase() === value,
  );
  if (taken) throw new Error("A dealership with this name already exists.");
}

// Bookings store the dealership by name
function activeDealershipBookings(name: string) {
  return db.bookings.filter(
    (booking) =>
      booking.dealershipName === name && booking.status !== BookingStatus.SERVICE_COMPLETE,
  );
}

// Timestamps for workflow actions; the seed swaps in its own past times
let clock = () => new Date().toISOString();

function withClock(next: () => string, run: () => void) {
  const previous = clock;
  clock = next;
  try {
    run();
  } finally {
    clock = previous;
  }
}

const statusOrder = Object.values(BookingStatus);

// Moves the booking forward to `status`, never back
function advanceStatusTo(booking: AdminBooking, status: BookingStatus) {
  if (statusOrder.indexOf(booking.status) < statusOrder.indexOf(status)) {
    booking.status = status;
  }
}

// Who handled a finished booking is part of its history
function assertNotComplete(booking: AdminBooking) {
  if (booking.status === BookingStatus.SERVICE_COMPLETE) {
    throw new Error("This service is complete, so it can't be changed.");
  }
}

function legValet(booking: AdminBooking, leg: ValetLeg) {
  return (leg === "pickup" ? booking.valet : booking.deliveryValet) ?? null;
}

function legProgress(booking: AdminBooking, leg: ValetLeg) {
  return (leg === "pickup" ? booking.pickupProgress : booking.deliveryProgress) ?? {};
}

function nextMilestone<T extends string>(order: readonly T[], log: Partial<Record<T, string>>) {
  return order.find((key) => !log[key]) ?? null;
}

const legDone = (booking: AdminBooking, leg: ValetLeg) =>
  !!legValet(booking, leg) && !!legProgress(booking, leg).delivered;

// Status the customer sees once a pickup milestone is reached; the whole
// delivery trip reads as "Vehicle Return"
const pickupStatuses: Record<ValetMilestone, BookingStatus> = {
  dispatched: BookingStatus.VALET_ASSIGNED,
  arrived: BookingStatus.VALET_ASSIGNED,
  pickedUp: BookingStatus.VEHICLE_PICKED_UP,
  enRoute: BookingStatus.VEHICLE_PICKED_UP,
  reached: BookingStatus.VEHICLE_ARRIVED,
  delivered: BookingStatus.VEHICLE_ARRIVED,
};

const advisorStatuses: Record<AdvisorMilestone, BookingStatus> = {
  checkedIn: BookingStatus.VEHICLE_ARRIVED,
  inService: BookingStatus.IN_SERVICE,
  serviceDone: BookingStatus.IN_SERVICE,
};

// ---- Workflow actions, in order. Shared by the admin endpoints, the customer's
// demo button and the seed; each one checks that the earlier steps are done. ----

function confirm(booking: AdminBooking) {
  assertNotComplete(booking);
  booking.confirmedAt ??= clock();
  advanceStatusTo(booking, BookingStatus.BOOKED);
}

function assignValet(booking: AdminBooking, leg: ValetLeg, valet: StaffMember) {
  assertNotComplete(booking);
  if (!booking.confirmedAt) throw new Error("Confirm the booking before assigning a valet.");
  if (leg === "delivery" && booking.payment?.status !== "paid") {
    throw new Error("The bill has to be paid before assigning the delivery valet.");
  }
  if (legProgress(booking, leg).pickedUp) {
    throw new Error("This valet already has the vehicle, so they can't be changed.");
  }

  // A new valet starts the trip over
  if (leg === "pickup") {
    booking.valet = { ...valet };
    booking.pickupProgress = {};
    advanceStatusTo(booking, BookingStatus.VALET_ASSIGNED);
    booking.etaMinutes = 45;
  } else {
    booking.deliveryValet = { ...valet };
    booking.deliveryProgress = {};
  }
}

function markValetMilestone(booking: AdminBooking, leg: ValetLeg, milestone: ValetMilestone) {
  assertNotComplete(booking);
  if (!legValet(booking, leg)) throw new Error("Assign a valet first.");
  const log = legProgress(booking, leg);
  if (nextMilestone(VALET_MILESTONES, log) !== milestone) {
    throw new Error("Valet updates have to be made in order.");
  }

  const next = { ...log, [milestone]: clock() };
  if (leg === "pickup") {
    booking.pickupProgress = next;
    advanceStatusTo(booking, pickupStatuses[milestone]);
    // Countdown while the valet heads to the customer
    booking.etaMinutes = milestone === "dispatched" ? 30 : null;
  } else {
    booking.deliveryProgress = next;
    booking.etaMinutes = milestone === "enRoute" ? 30 : null;
  }
}

function assignAdvisor(booking: AdminBooking, advisor: StaffMember) {
  assertNotComplete(booking);
  if (!legDone(booking, "pickup")) {
    throw new Error("The vehicle has to reach the dealership before assigning an advisor.");
  }
  booking.relationshipManager = { ...advisor };
}

function markAdvisorMilestone(booking: AdminBooking, milestone: AdvisorMilestone) {
  assertNotComplete(booking);
  if (!booking.relationshipManager) throw new Error("Assign an advisor first.");
  const log = booking.advisorProgress ?? {};
  if (nextMilestone(ADVISOR_MILESTONES, log) !== milestone) {
    throw new Error("Service updates have to be made in order.");
  }
  booking.advisorProgress = { ...log, [milestone]: clock() };
  advanceStatusTo(booking, advisorStatuses[milestone]);
}

function generateBill(booking: AdminBooking) {
  assertNotComplete(booking);
  if (!booking.advisorProgress?.serviceDone) {
    throw new Error("Finish the service before generating the bill.");
  }
  booking.invoice ??= { ...createInvoice(booking), issuedAt: clock() };
  advanceStatusTo(booking, BookingStatus.BILL_GENERATED);
}

function markPaid(booking: AdminBooking) {
  if (booking.payment?.status === "paid") throw new Error("This bill is already paid.");
  if (!booking.invoice) throw new Error("There's no bill to pay yet.");
  booking.payment = {
    amount: booking.invoice.total,
    method: "card",
    status: "paid",
    transactionId: `TXN-${Date.now().toString().slice(-6)}`,
    updatedAt: clock(),
  };
  advanceStatusTo(booking, BookingStatus.VEHICLE_RETURN);
}

function complete(booking: AdminBooking) {
  assertNotComplete(booking);
  if (!legDone(booking, "delivery")) {
    throw new Error("The vehicle has to be delivered back to the customer first.");
  }
  booking.status = BookingStatus.SERVICE_COMPLETE;
  booking.etaMinutes = null;
  booking.completedAt = clock();
}

// How many actions take a booking from new to complete (payment included)
const WORKFLOW_ACTIONS =
  1 + 2 * (1 + VALET_MILESTONES.length) + 1 + ADVISOR_MILESTONES.length + 2 + 1;

type StaffPicker = Record<StaffRole, () => StaffMember>;

// The next thing the admin (or a valet) would do; null while it's the customer's
// turn to pay, and once the booking is complete
function nextAction(booking: AdminBooking, pickStaff: StaffPicker): (() => void) | null {
  if (booking.status === BookingStatus.SERVICE_COMPLETE) return null;
  if (!booking.confirmedAt) return () => confirm(booking);

  if (!booking.valet) return () => assignValet(booking, "pickup", pickStaff.valet());
  const pickupStep = nextMilestone(VALET_MILESTONES, legProgress(booking, "pickup"));
  if (pickupStep) return () => markValetMilestone(booking, "pickup", pickupStep);

  if (!booking.relationshipManager) return () => assignAdvisor(booking, pickStaff.manager());
  const advisorStep = nextMilestone(ADVISOR_MILESTONES, booking.advisorProgress ?? {});
  if (advisorStep) return () => markAdvisorMilestone(booking, advisorStep);
  if (!booking.invoice) return () => generateBill(booking);
  if (booking.payment?.status !== "paid") return null;

  if (!booking.deliveryValet) return () => assignValet(booking, "delivery", pickStaff.valet());
  const deliveryStep = nextMilestone(VALET_MILESTONES, legProgress(booking, "delivery"));
  if (deliveryStep) return () => markValetMilestone(booking, "delivery", deliveryStep);

  return () => complete(booking);
}

const payAction = (booking: AdminBooking) =>
  booking.invoice && booking.payment?.status !== "paid" ? () => markPaid(booking) : null;

const firstAvailable = (list: StaffMember[]) => list.find((item) => item.available) ?? list[0];

// Created after the workflow helpers above, which the seed uses
const db = loadDb();

export const mockServer = {
  // ---- Auth ----
  sendLoginOtp(email: string) {
    if (!findUserByEmail(email)) {
      throw new Error("No account found for this email. Please sign up.");
    }
    return { sent: true };
  },

  signup(data: { name: string; email: string; phone: string }) {
    if (findUserByEmail(data.email)) {
      throw new Error("An account with this email already exists. Please log in.");
    }
    db.users.push({ id: `u-${Date.now()}`, ...data, role: "user" });
    persist();
    return { sent: true };
  },

  // Any 6-digit code is accepted
  verifyOtp(email: string): AuthSession {
    const user = findUserByEmail(email);
    if (!user) throw new Error("No account found for this email. Please sign up.");
    return { token: `mock-token-${user.id}`, user };
  },

  updateMe(patch: Partial<Pick<AuthUser, "name" | "phone">>) {
    const user = currentUser();
    Object.assign(user, patch);
    persist();
    return user;
  },

  // ---- Customer bookings ----
  createBooking(
    input: Omit<
      AdminBooking,
      "id" | "customer" | "createdAt" | "status" | "confirmedAt" | "valet" | "relationshipManager" | "payment"
    >,
  ) {
    const user = currentUser();
    if (findOpenBooking(user.id)) {
      throw new Error(
        "You already have a service in progress. You can book again once it's complete.",
      );
    }
    const booking: AdminBooking = {
      ...input,
      id: `PC-${Date.now().toString().slice(-6)}`,
      customer: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      createdAt: new Date().toISOString(),
      status: BookingStatus.IN_QUEUE,
      confirmedAt: null,
      valet: null,
      relationshipManager: null,
      payment: null,
    };
    db.bookings.unshift(booking);
    persist();
    return booking;
  },

  getMyOpenBooking() {
    return findOpenBooking(currentUser().id);
  },

  getMyBooking(id: string) {
    return findMyBooking(id);
  },

  // Pays the generated bill; the delivery valet can then bring the vehicle back
  payInvoice(id: string) {
    const booking = findMyBooking(id);
    markPaid(booking);
    persist();
    return booking;
  },

  // Demo only: does what the admin and valets would do next, until the customer
  // can see a change (a new status, or a valet / advisor assigned)
  simulateNextStatus(id: string) {
    const booking = findMyBooking(id);
    if (booking.status === BookingStatus.SERVICE_COMPLETE) {
      throw new Error("This service is already complete.");
    }

    const pickStaff: StaffPicker = {
      valet: () => firstAvailable(db.valets),
      manager: () => firstAvailable(db.relationshipManagers),
    };
    const staffOf = () => [booking.valet, booking.relationshipManager, booking.deliveryValet];
    const statusBefore = booking.status;

    for (let count = 0; count < WORKFLOW_ACTIONS; count++) {
      const action = nextAction(booking, pickStaff);
      if (!action) {
        if (booking.status === statusBefore) {
          throw new Error("Pay the bill to get your vehicle back.");
        }
        break;
      }

      const staffBefore = staffOf();
      action();
      const staffChanged = staffOf().some((member, index) => member !== staffBefore[index]);
      if (booking.status !== statusBefore || staffChanged) break;
    }

    persist();
    return booking;
  },

  // ---- Admin ----
  listBookings(params: BookingListParams): Paginated<AdminBooking> {
    requireAdmin();
    const search = params.search.trim().toLowerCase();

    const filtered = db.bookings.filter((booking) => {
      if (params.status !== "all" && booking.status !== params.status) return false;
      if (params.serviceId !== "all" && booking.serviceId !== params.serviceId) return false;
      if (!search) return true;

      return [
        booking.id,
        booking.customer.name,
        booking.customer.email,
        booking.customer.phone,
        booking.vehicle.vin,
        `${booking.vehicle.brand} ${booking.vehicle.model}`,
      ].some((value) => value.toLowerCase().includes(search));
    });

    const sortValue = (booking: AdminBooking) => {
      switch (params.sortBy) {
        case "customer":
          return booking.customer.name.toLowerCase();
        case "scheduledAt":
          return booking.scheduledAt ?? "";
        case "status":
          return booking.status;
        case "id":
          return booking.id;
        default:
          return booking.createdAt;
      }
    };

    const direction = params.sortOrder === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((first, second) =>
      sortValue(first) < sortValue(second)
        ? -direction
        : sortValue(first) > sortValue(second)
          ? direction
          : 0,
    );

    const totalPages = Math.max(1, Math.ceil(sorted.length / params.pageSize));
    const page = Math.min(params.page, totalPages);
    const start = (page - 1) * params.pageSize;

    return {
      items: sorted.slice(start, start + params.pageSize),
      total: sorted.length,
      page,
      pageSize: params.pageSize,
      totalPages,
    };
  },

  getBooking(id: string) {
    requireAdmin();
    return findBooking(id);
  },

  confirmBooking(id: string) {
    requireAdmin();
    const booking = findBooking(id);
    confirm(booking);
    persist();
    return booking;
  },

  assignValet(id: string, leg: ValetLeg, valetId: string) {
    requireAdmin();
    const booking = findBooking(id);
    assignValet(booking, leg, findStaff("valet", valetId));
    persist();
    return booking;
  },

  // Normally posted by the valet from their link; the admin can post it too
  updateValetProgress(id: string, leg: ValetLeg, milestone: ValetMilestone) {
    requireAdmin();
    const booking = findBooking(id);
    markValetMilestone(booking, leg, milestone);
    persist();
    return booking;
  },

  assignRelationshipManager(id: string, managerId: string) {
    requireAdmin();
    const booking = findBooking(id);
    assignAdvisor(booking, findStaff("manager", managerId));
    persist();
    return booking;
  },

  // Service updates the advisor shares with the customer
  updateAdvisorProgress(id: string, milestone: AdvisorMilestone) {
    requireAdmin();
    const booking = findBooking(id);
    markAdvisorMilestone(booking, milestone);
    persist();
    return booking;
  },

  // Sends the customer the standard bill; the admin never enters an amount
  generateInvoice(id: string) {
    requireAdmin();
    const booking = findBooking(id);
    generateBill(booking);
    persist();
    return booking;
  },

  // The admin only confirms that the customer paid the bill
  confirmPayment(id: string) {
    requireAdmin();
    const booking = findBooking(id);
    markPaid(booking);
    persist();
    return booking;
  },

  completeBooking(id: string) {
    requireAdmin();
    const booking = findBooking(id);
    complete(booking);
    persist();
    return booking;
  },

  // ---- Staff (valets and advisors) ----
  listStaff(role: StaffRole, params: StaffListParams): Paginated<StaffMember> {
    requireAdmin();
    const search = params.search.trim().toLowerCase();
    const digits = phoneDigits(search);

    const filtered = staffList(role).filter((member) => {
      if (params.availability === "available" && !member.available) return false;
      if (params.availability === "busy" && member.available) return false;
      if (!search) return true;

      return (
        member.name.toLowerCase().includes(search) ||
        member.email.toLowerCase().includes(search) ||
        (digits !== "" && phoneDigits(member.phone).includes(digits))
      );
    });

    const sortValue = (member: StaffMember) => {
      switch (params.sortBy) {
        case "email":
          return member.email.toLowerCase();
        case "phone":
          return member.phone;
        case "available":
          return member.available ? 1 : 0;
        default:
          return member.name.toLowerCase();
      }
    };

    const direction = params.sortOrder === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((first, second) =>
      sortValue(first) < sortValue(second)
        ? -direction
        : sortValue(first) > sortValue(second)
          ? direction
          : 0,
    );

    const totalPages = Math.max(1, Math.ceil(sorted.length / params.pageSize));
    const page = Math.min(params.page, totalPages);
    const start = (page - 1) * params.pageSize;

    return {
      items: sorted.slice(start, start + params.pageSize).map((member) => ({
        ...member,
        activeBookings: activeAssignments(role, member.id).length,
      })),
      total: sorted.length,
      page,
      pageSize: params.pageSize,
      totalPages,
    };
  },

  createStaff(role: StaffRole, input: StaffFields) {
    requireAdmin();
    assertContactFree(role, input);
    const member: StaffMember = { id: `${staffIdPrefixes[role]}-${Date.now()}`, ...input };
    staffList(role).push(member);
    persist();
    return member;
  },

  updateStaff(
    role: StaffRole,
    id: string,
    input: StaffFields,
  ) {
    requireAdmin();
    const member = findStaff(role, id);
    assertContactFree(role, input, id);
    Object.assign(member, input);

    // Bookings keep a copy of the assigned member; keep their details current
    db.bookings.forEach((booking) => {
      if (role === "valet" && booking.valet?.id === id) booking.valet = { ...member };
      if (role === "valet" && booking.deliveryValet?.id === id) {
        booking.deliveryValet = { ...member };
      }
      if (role === "manager" && booking.relationshipManager?.id === id) {
        booking.relationshipManager = { ...member };
      }
    });

    persist();
    return member;
  },

  deleteStaff(role: StaffRole, id: string) {
    requireAdmin();
    const member = findStaff(role, id);
    const active = activeAssignments(role, id).length;
    if (active > 0) {
      throw new Error(
        `${member.name} is assigned to ${active} active booking${active === 1 ? "" : "s"} and can't be deleted.`,
      );
    }
    const list = staffList(role);
    list.splice(list.indexOf(member), 1);
    persist();
    return { id };
  },

  // ---- Dealerships ----
  listDealerships(search: string) {
    requireAdmin();
    const query = search.trim().toLowerCase();
    if (!query) return db.dealerships;

    return db.dealerships.filter((dealership) =>
      [dealership.name, dealership.address].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  },

  createDealership(input: Omit<Dealership, "id">) {
    requireAdmin();
    assertDealershipNameFree(input.name);
    const dealership: Dealership = { id: `dealership-${Date.now()}`, ...input };
    db.dealerships.push(dealership);
    persist();
    return dealership;
  },

  updateDealership(id: string, input: Omit<Dealership, "id">) {
    requireAdmin();
    const dealership = findDealership(id);
    assertDealershipNameFree(input.name, id);
    // Keep unfinished bookings pointing at the renamed dealership
    activeDealershipBookings(dealership.name).forEach((booking) => {
      booking.dealershipName = input.name;
    });
    Object.assign(dealership, input);
    persist();
    return dealership;
  },

  deleteDealership(id: string) {
    requireAdmin();
    const dealership = findDealership(id);
    const active = activeDealershipBookings(dealership.name).length;
    if (active > 0) {
      throw new Error(
        `${dealership.name} has ${active} active booking${active === 1 ? "" : "s"} and can't be deleted.`,
      );
    }
    db.dealerships.splice(db.dealerships.indexOf(dealership), 1);
    persist();
    return { id };
  },
};
