import { BookingStatus } from "@/types/booking";
import type { AuthSession, AuthUser } from "@/types/auth";
import type {
  AdminBooking,
  BookingListParams,
  Paginated,
  PaymentInfo,
  StaffMember,
} from "@/types/admin";
import type { ServiceId } from "@/types/service";
import { authStorage } from "@/services/authStorage";

// In-browser stand-in for the backend. Data is kept in localStorage so bookings
// placed from the user dashboard show up in the admin dashboard.

const DB_KEY = "taverna_mock_db";

type MockDb = {
  users: AuthUser[];
  bookings: AdminBooking[];
  valets: StaffMember[];
  relationshipManagers: StaffMember[];
};

const valets: StaffMember[] = [
  { id: "valet-1", name: "Michael Rivera", phone: "(954) 555-0141", available: true },
  { id: "valet-2", name: "Daniel Brooks", phone: "(954) 555-0178", available: true },
  { id: "valet-3", name: "Sofia Martinez", phone: "(954) 555-0192", available: false },
  { id: "valet-4", name: "James Carter", phone: "(954) 555-0115", available: true },
];

const relationshipManagers: StaffMember[] = [
  { id: "rm-1", name: "Olivia Bennett", phone: "(954) 555-0220", available: true },
  { id: "rm-2", name: "Ethan Walker", phone: "(954) 555-0236", available: true },
  { id: "rm-3", name: "Priya Shah", phone: "(954) 555-0251", available: false },
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

  return Array.from({ length: 42 }, (_, index) => {
    const [name, email, phone] = pick(customers);
    const [brand, model, year] = pick(vehicles);
    const createdAt = new Date(now - Math.floor(random() * 30 * day)).toISOString();
    // 0 = new, 1 = confirmed, 2 = valet, 3 = manager, 4 = paid
    const stage = Math.floor(random() * 5);
    const valet = stage >= 2 ? pick(valets) : null;
    const payment: PaymentInfo | null =
      stage >= 4
        ? {
            amount: 80 + Math.floor(random() * 400),
            method: pick(["card", "cash", "insurance", "warranty"] as const),
            status: "paid",
            transactionId: `TXN-${100000 + index}`,
            updatedAt: createdAt,
          }
        : null;

    return {
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
      status:
        stage === 0
          ? BookingStatus.IN_QUEUE
          : stage === 1
            ? BookingStatus.BOOKED
            : BookingStatus.VALET_ASSIGNED,
      confirmedAt: stage >= 1 ? createdAt : null,
      valet,
      relationshipManager: stage >= 3 ? pick(relationshipManagers) : null,
      payment,
    };
  });
}

function loadDb(): MockDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw) as MockDb;
  } catch {
    // fall through to a fresh seed
  }
  return {
    users: seedUsers,
    bookings: seedBookings(),
    valets,
    relationshipManagers,
  };
}

const db = loadDb();

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

function findBooking(id: string) {
  const booking = db.bookings.find((item) => item.id === id);
  if (!booking) throw new Error("We couldn't find this booking.");
  return booking;
}

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

  getMyBooking(id: string) {
    const user = currentUser();
    const booking = findBooking(id);
    if (booking.customer.id !== user.id && user.role !== "admin") {
      throw new Error("We couldn't find this booking.");
    }
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
    booking.status = BookingStatus.BOOKED;
    booking.confirmedAt = new Date().toISOString();
    persist();
    return booking;
  },

  assignValet(id: string, valetId: string) {
    requireAdmin();
    const booking = findBooking(id);
    if (!booking.confirmedAt) throw new Error("Confirm the booking before assigning a valet.");
    const valet = db.valets.find((item) => item.id === valetId);
    if (!valet) throw new Error("We couldn't find this valet.");
    booking.valet = valet;
    booking.status = BookingStatus.VALET_ASSIGNED;
    persist();
    return booking;
  },

  assignRelationshipManager(id: string, managerId: string) {
    requireAdmin();
    const booking = findBooking(id);
    if (!booking.valet) throw new Error("Assign a valet before the relationship manager.");
    const manager = db.relationshipManagers.find((item) => item.id === managerId);
    if (!manager) throw new Error("We couldn't find this relationship manager.");
    booking.relationshipManager = manager;
    persist();
    return booking;
  },

  updatePayment(id: string, payment: Omit<PaymentInfo, "updatedAt">) {
    requireAdmin();
    const booking = findBooking(id);
    if (!booking.relationshipManager) {
      throw new Error("Assign a relationship manager before updating payment.");
    }
    booking.payment = { ...payment, updatedAt: new Date().toISOString() };
    persist();
    return booking;
  },

  listValets() {
    requireAdmin();
    return db.valets;
  },

  listRelationshipManagers() {
    requireAdmin();
    return db.relationshipManagers;
  },
};
