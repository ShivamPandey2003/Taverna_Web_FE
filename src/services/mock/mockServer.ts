import type { Offer, OfferInput, OfferList, OfferListParams } from "@/types/offer";
import type { OfferCsvRow } from "@/components/features/offers/offerCsv";
import { BookingStatus } from "@/types/booking";
import {
  ADVISOR_HANDOVER,
  ADVISOR_MILESTONES,
  INVOICE_TAX_RATE,
  LEG_MILESTONES,
  LEG_METHODS,
  TRIP_END,
  type AdminBooking,
  type AdvisorMilestone,
  type Invoice,
  type InvoiceLine,
  type StaffAuth,
  type StaffBooking,
  type StaffLinkRole,
  type StaffMember,
  type StaffRole,
  type StaffType,
  type IntakeMethod,
  type ValetLeg,
  type ValetMilestone,
} from "@/types/admin";
import type { Dealership } from "@/types/dealership";
import type { ServiceId } from "@/types/service";
import { authStorage } from "@/services/authStorage";
import { shortName } from "@/libs/utils";
import { dealerships as seedDealerships } from "@/components/features/review/dealership.data";

// In-browser stand-in for the parts of the backend that aren't wired up yet. Data is
// kept in localStorage so bookings placed from the user dashboard show up in the
// admin dashboard. Auth (login, signup, OTP, logout) is the real API: see authApi.ts.

const DB_KEY = "taverna_mock_db";

type MockDb = {
  bookings: AdminBooking[];
  valets: StaffMember[];
  relationshipManagers: StaffMember[];
  dealerships: Dealership[];
  offers: Offer[];
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

// Deterministic pseudo-random numbers so the seed is identical on every machine
function createRandom(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

// Seed bookings 42 and up: never touched by the workflow, so the admin always
// has some In-queue ones to confirm
const SEED_HISTORY = 42;
const SEED_IN_QUEUE = 10;
const seedBookingId = (index: number) => `PC-${String(482900 + index)}`;

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

  return Array.from({ length: SEED_HISTORY + SEED_IN_QUEUE }, (_, index): AdminBooking => {
    const inQueue = index >= SEED_HISTORY;
    // Not the demo customer, who has to be free to book
    const [name, email, phone] = pick(inQueue ? customers.slice(1) : customers);
    const [brand, model, year] = pick(vehicles);
    // In-queue bookings are fresh: placed within the last two days
    const createdAt = new Date(
      now - Math.floor(random() * (inQueue ? 2 : 30) * day),
    ).toISOString();

    const booking: AdminBooking = {
      id: seedBookingId(index),
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
      staffTokens: mockStaffTokens(seedBookingId(index)),
    };
    if (inQueue) return booking;

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

// How much of an upload the mock keeps: localStorage is small
const MOCK_OFFERS_LIMIT = 2000;

const toNumber = (value: string) => Number(value.replace(/[^0-9.-]/g, "")) || 0;

function toOffer(row: OfferCsvRow, index: number): Offer {
  return {
    id: `offer-${index + 1}`,
    vin: row.VIN.toUpperCase(),
    stockNumber: row["Stock Number"],
    brand: row["Brand Name"],
    year: toNumber(row.Year),
    model: row.Model,
    trim: row.Trim,
    condition: row.Condition,
    offerType: row["Offer Type"],
    payment: toNumber(row.Payment),
    paymentNoTax: toNumber(row["Payment No Tax"]),
    totalRebate: toNumber(row["Total Rebate"]),
    term: toNumber(row.Term),
    downPayment: toNumber(row["Down Payment"]),
    dueAtSigning: toNumber(row["Due At Signing"]),
    apr: toNumber(row.APR),
    lender: row.Lender,
    description: row.Description,
    disclaimer: row.Disclaimer,
  };
}

// Offers the admin sees before uploading a file of their own
function seedOffers(): Offer[] {
  const random = createRandom(7);
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)];
  const models = [
    ["Ram", "1500", "Big Horn"],
    ["Ram", "2500", "Tradesman"],
    ["Jeep", "Grand Cherokee", "Limited"],
    ["Jeep", "Wrangler", "Sahara"],
    ["Jeep", "Compass", "Latitude"],
    ["Dodge", "Durango", "GT"],
    ["Dodge", "Hornet", "R/T"],
    ["Chrysler", "Pacifica", "Touring L"],
  ] as const;
  const deals = [
    ["First and Fees", "CAL", "Cal Automotive Closed End Lease"],
    ["Zero Down Lease", "CAL", "Cal Automotive Closed End Lease"],
    ["Low APR Finance Deal", "SFS", "Stellantis Financial Services Stand-Alone APR Program"],
    ["Cash Rebate Deal", "SFS", "Stellantis Financial Services Retail Bonus Cash"],
  ] as const;

  return Array.from({ length: 34 }, (_, index) => {
    const [brand, model, trim] = pick(models);
    const [offerType, lender, description] = pick(deals);
    const finance = offerType === "Low APR Finance Deal" || offerType === "Cash Rebate Deal";
    const used = random() < 0.2;
    const payment = (finance ? 520 : 229) + Math.floor(random() * 40) * 10;
    const term = finance ? pick([48, 60, 72]) : pick([24, 36, 39]);
    const dueAtSigning = finance || offerType === "Zero Down Lease" ? 0 : 2500 + Math.floor(random() * 30) * 100;
    const stock = `${brand.charAt(0)}${200000 + Math.floor(random() * 9999)}`;

    return {
      id: `offer-${index + 1}`,
      vin: `3C6RR${String(10000000000000 + Math.floor(random() * 89999999999999)).slice(0, 12)}`,
      stockNumber: stock,
      brand,
      year: used ? 2023 + Math.floor(random() * 2) : 2026,
      model,
      trim,
      condition: used ? "Used" : "New",
      offerType,
      payment,
      paymentNoTax: Math.round(payment / 1.07),
      totalRebate: finance ? Math.floor(random() * 6) * 500 : 13000 - Math.floor(random() * 10) * 500,
      term,
      downPayment: 0,
      dueAtSigning,
      apr: finance ? pick([0, 1.9, 2.9, 3.9]) : Math.round((5 + random() * 3) * 1000) / 1000,
      lender,
      description,
      disclaimer: `*Stock#: ${stock}. $${payment}/Mo. for ${term} Months. $${dueAtSigning.toLocaleString("en-US")} total due at signing. See dealer for details.`,
    };
  });
}

function loadDb(): MockDb {
  const seed: MockDb = {
    bookings: seedBookings(),
    valets,
    relationshipManagers,
    dealerships: seedDealerships,
    offers: seedOffers(),
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
        // Bookings saved before staff links carried a token
        // Always rebuilt: they were plain strings before the staff sign-in
        booking.staffTokens = mockStaffTokens(booking.id);
        // Saved while the status was still spelled "Service complete"
        if ((booking.status as string) === "Service complete") {
          booking.status = BookingStatus.SERVICE_COMPLETE;
        }
        // Dispatched before "Valet On Road" existed
        if (booking.status === BookingStatus.VALET_ASSIGNED && booking.pickupProgress?.dispatched) {
          booking.status = BookingStatus.VALET_ON_ROAD;
        }
        if (
          booking.status === BookingStatus.VEHICLE_RETURN &&
          booking.deliveryProgress?.dispatched &&
          !booking.deliveryProgress.reached
        ) {
          booking.status = BookingStatus.VALET_ON_ROAD;
        }
        if (booking.payment?.status === "paid" && booking.status === BookingStatus.VALET_ASSIGNED) {
          booking.status = BookingStatus.SERVICE_COMPLETE;
        }
        // Bookings finished before valet and advisor milestones existed
        if (booking.status === BookingStatus.SERVICE_COMPLETE && !booking.completedAt) {
          const at = booking.payment?.updatedAt ?? booking.createdAt;
          const all = <T extends string>(keys: readonly T[]) =>
            Object.fromEntries(keys.map((key) => [key, at])) as Record<T, string>;
          booking.pickupProgress = all(LEG_MILESTONES.pickup);
          booking.advisorProgress = all([...ADVISOR_MILESTONES, ADVISOR_HANDOVER]);
          booking.deliveryValet ??= booking.valet;
          booking.deliveryProgress = all(LEG_MILESTONES.delivery);
          booking.completedAt = at;
        }
        // The advisor's single "checked in" update became "inspecting", and they
        // now hand the vehicle over before the delivery valet takes it
        const advisorLog = booking.advisorProgress as Record<string, string> | undefined;
        if (advisorLog?.checkedIn) {
          advisorLog.inspecting ??= advisorLog.checkedIn;
          delete advisorLog.checkedIn;
        }
        if (advisorLog && !advisorLog.readyForDispatch && booking.deliveryValet) {
          advisorLog.readyForDispatch = booking.payment?.updatedAt ?? booking.createdAt;
        }
      });
      // Saved before assignment times were recorded: the nearest known time stands in
      saved.bookings.forEach((booking) => {
        const at = booking.assignedAt ?? {};
        if (booking.valet) {
          at.pickup ??= booking.pickupProgress?.dispatched ?? booking.confirmedAt ?? booking.createdAt;
        }
        if (booking.relationshipManager) {
          at.advisor ??=
            booking.advisorProgress?.inspecting ?? booking.pickupProgress?.reached ?? booking.createdAt;
        }
        if (booking.deliveryValet) {
          at.delivery ??=
            booking.deliveryProgress?.dispatched ??
            booking.advisorProgress?.readyForDispatch ??
            booking.createdAt;
        }
        booking.assignedAt = at;
      });
      // DBs saved before the seed had its In-queue bookings
      const savedIds = new Set(saved.bookings.map((booking) => booking.id));
      saved.bookings.unshift(
        ...seed.bookings.slice(SEED_HISTORY).filter((booking) => !savedIds.has(booking.id)),
      );
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

// Accounts live in the real API now; the mock trusts whoever is logged in
function currentUser() {
  const user = authStorage.load()?.user;
  if (!user) throw new Error("Your session has expired. Please log in again.");
  return user;
}

function requireAdmin() {
  if (currentUser().role !== "admin") {
    throw new Error("You don't have permission to perform this action.");
  }
}

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

// A customer's bookings that aren't complete yet, newest first: one per vehicle
// at most
function findOpenBookings(customerId: string) {
  return db.bookings.filter(
    (booking) =>
      booking.customer.id === customerId && booking.status !== BookingStatus.SERVICE_COMPLETE,
  );
}

function findBooking(id: string) {
  const booking = db.bookings.find((item) => item.id === id);
  if (!booking) throw new Error("We couldn't find this booking.");
  return booking;
}

const STAFF_TYPES: StaffType[] = ["valet", "advisor"];
const STAFF_LINK_ROLES: StaffLinkRole[] = ["pickup", "advisor", "delivery"];

const linkRoleType = (role: StaffLinkRole): StaffType => (role === "advisor" ? "advisor" : "valet");

// Stand-in for the encrypted staff type (the `token` search param); the real API
// encrypts it so it can't be read or changed in the browser
const mockStaffTypeToken = (type: StaffType) => `mock-enc-${type}`;

// The auth token (`gear`) of someone who signed in with email + OTP
const mockStaffGear = (member: StaffMember) => `mock-staff-${member.id}`;

// What goes in each staff link. The real API issues signed tokens; these only have
// to be the same on every load, so a copied link keeps working.
function mockStaffTokens(bookingId: string): Record<StaffLinkRole, StaffAuth> {
  const auth = (role: StaffLinkRole): StaffAuth => ({
    gear: `mock-${role}-${bookingId.toLowerCase()}`,
    token: mockStaffTypeToken(linkRoleType(role)),
  });
  return { pickup: auth("pickup"), advisor: auth("advisor"), delivery: auth("delivery") };
}

function findStaffByEmail(email: string) {
  const match = (member: StaffMember) => member.email.toLowerCase() === email.trim().toLowerCase();
  const valet = db.valets.find(match);
  if (valet) return { member: valet, type: "valet" as StaffType };
  const advisor = db.relationshipManagers.find(match);
  return advisor ? { member: advisor, type: "advisor" as StaffType } : null;
}

// The booking a staff page opens, and which of its pages the caller may use.
// `gear` is either a link's token (good for that one page of that booking) or a
// signed-in staff member's (good for whatever they're assigned to on it).
function findStaffBooking(auth: StaffAuth, id: string) {
  const type = STAFF_TYPES.find((item) => mockStaffTypeToken(item) === auth.token);
  if (!type) throw new Error("This link isn't valid. Sign in again to continue.");
  const booking = findBooking(id);
  const ofType = STAFF_LINK_ROLES.filter((role) => linkRoleType(role) === type);

  const linked = ofType.filter((role) => booking.staffTokens?.[role]?.gear === auth.gear);
  if (linked.length) return { booking, roles: linked };

  const member = (type === "valet" ? db.valets : db.relationshipManagers).find(
    (item) => mockStaffGear(item) === auth.gear,
  );
  if (!member) throw new Error("Your sign-in has expired. Sign in again to continue.");
  const assigned: Record<StaffLinkRole, StaffMember | null | undefined> = {
    pickup: booking.valet,
    advisor: booking.relationshipManager,
    delivery: booking.deliveryValet,
  };
  const roles = ofType.filter((role) => assigned[role]?.id === member.id);
  if (!roles.length) throw new Error("You're not assigned to this booking.");
  return { booking, roles };
}

// Every booking the caller has a task on, with the pages of it they may use: a
// signed-in member gets all they're assigned to, a link's token just its booking
function findStaffBookings(auth: StaffAuth) {
  const type = STAFF_TYPES.find((item) => mockStaffTypeToken(item) === auth.token);
  if (!type) throw new Error("This link isn't valid. Sign in again to continue.");
  const ofType = STAFF_LINK_ROLES.filter((role) => linkRoleType(role) === type);
  const member = (type === "valet" ? db.valets : db.relationshipManagers).find(
    (item) => mockStaffGear(item) === auth.gear,
  );

  const found = db.bookings.flatMap((booking) => {
    const assigned: Record<StaffLinkRole, StaffMember | null | undefined> = {
      pickup: booking.valet,
      advisor: booking.relationshipManager,
      delivery: booking.deliveryValet,
    };
    const roles = ofType.filter((role) =>
      member
        ? assigned[role]?.id === member.id
        : booking.staffTokens?.[role]?.gear === auth.gear,
    );
    return roles.length ? [{ booking, roles }] : [];
  });

  if (!member && !found.length) {
    throw new Error("Your sign-in has expired. Sign in again to continue.");
  }
  return found;
}

function assertStaffRole(roles: StaffLinkRole[], expected: StaffLinkRole) {
  if (!roles.includes(expected)) {
    throw new Error("You can't make that update on this booking.");
  }
}

// What staff get back: the booking with the dealership's address for directions,
// and without the links' tokens
function staffView(booking: AdminBooking, linkRoles: StaffLinkRole[]): StaffBooking {
  return {
    ...booking,
    linkRoles,
    staffTokens: undefined,
    dealershipAddress: db.dealerships.find((item) => item.name === booking.dealershipName)
      ?.address,
  };
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

const roundCents = (value: number) => Math.round(value * 100) / 100;

function serviceLine(booking: AdminBooking) {
  if (booking.serviceId === "loaner-only") return "Loaner Service";
  return booking.valet ? `Valet Service by ${shortName(booking.valet.name)}` : "Valet Service";
}

// Standard bill: service, fuel surcharge, convenience fee (+ tow). Used when the
// admin generates the bill; an advisor types their own rows from their link.
function standardItems(booking: AdminBooking): InvoiceLine[] {
  const items: InvoiceLine[] = [
    { label: serviceLine(booking), amount: booking.serviceId === "pickup-delivery" ? 340 : 180 },
    { label: "Fuel surcharge", amount: 12 },
    { label: "Convenience fee", amount: 4.48 },
  ];
  if (!booking.driveable) items.push({ label: "Tow truck", amount: 49 });
  return items;
}

// Adds tax and totals the rows
function createInvoice(lines: InvoiceLine[]): Invoice {
  const items = lines.map((line) => ({ label: line.label.trim(), amount: roundCents(line.amount) }));
  if (!items.length || items.some((item) => !item.label || !(item.amount > 0))) {
    throw new Error("Every row of the bill needs an item and a price.");
  }

  const subtotal = roundCents(items.reduce((sum, item) => sum + item.amount, 0));
  const tax = roundCents(subtotal * INVOICE_TAX_RATE);

  return {
    issuedAt: clock(),
    items,
    subtotal,
    taxRate: INVOICE_TAX_RATE,
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

// How the vehicle makes this trip. A booking that already has the trip's valet
// counts as "valet"; the choices depend on the booked service.
function legMethod(booking: AdminBooking, leg: ValetLeg): IntakeMethod | null {
  const saved = leg === "pickup" ? booking.intakeMethod : booking.handoverMethod;
  if (saved) return saved;
  if (legValet(booking, leg)) return "valet";
  // The only choice for the booked service needs no picking
  const options = LEG_METHODS[booking.serviceId][leg];
  return options.length === 1 ? options[0] : null;
}

// The vehicle is at the other end: taken by the valet, a tow truck or the customer
const legDone = (booking: AdminBooking, leg: ValetLeg) => {
  const method = legMethod(booking, leg);
  if (!method || (method === "valet" && !legValet(booking, leg))) return false;
  return !!legProgress(booking, leg)[TRIP_END[leg]];
};

// Status the customer sees once a pickup milestone is reached. The delivery
// trip reads as "Vehicle Return", except while its valet is on the road.
const pickupStatuses: Record<ValetMilestone, BookingStatus> = {
  dispatched: BookingStatus.VALET_ON_ROAD,
  arrived: BookingStatus.VALET_ON_ROAD,
  pickedUp: BookingStatus.VEHICLE_PICKED_UP,
  enRoute: BookingStatus.VEHICLE_PICKED_UP,
  reached: BookingStatus.VEHICLE_ARRIVED,
  delivered: BookingStatus.VEHICLE_ARRIVED,
};

const advisorStatuses: Record<AdvisorMilestone, BookingStatus> = {
  inspecting: BookingStatus.VEHICLE_ARRIVED,
  inService: BookingStatus.IN_SERVICE,
  readyForDispatch: BookingStatus.VEHICLE_RETURN,
};

// ---- Workflow actions, in order. Shared by the admin endpoints, the customer's
// demo button and the seed; each one checks that the earlier steps are done. ----

function confirm(booking: AdminBooking) {
  assertNotComplete(booking);
  booking.confirmedAt ??= clock();
  advanceStatusTo(booking, BookingStatus.BOOKED);
}

// What has to be true before a trip can be set up
function assertLegOpen(booking: AdminBooking, leg: ValetLeg) {
  assertNotComplete(booking);
  if (!booking.confirmedAt) throw new Error("Confirm the booking first.");
  if (leg === "delivery" && !booking.advisorProgress?.[ADVISOR_HANDOVER]) {
    throw new Error("The advisor has to mark the vehicle ready to dispatch first.");
  }
}

// Valet, tow truck (intake only) or the customer themselves
function setLegMethod(booking: AdminBooking, leg: ValetLeg, method: IntakeMethod) {
  assertLegOpen(booking, leg);
  if (!LEG_METHODS[booking.serviceId][leg].includes(method)) throw new Error("That isn't an option for this step.");
  if (legMethod(booking, leg) === method) return;
  const log = legProgress(booking, leg);
  if (log.pickedUp) {
    throw new Error("The valet already has the vehicle, so this can't be changed.");
  }
  if (log[TRIP_END[leg]]) {
    throw new Error("The vehicle has already been handed over, so this can't be changed.");
  }

  // Whoever was on the way is off the booking, and their trip with them
  delete booking.assignedAt?.[leg];
  booking.etaMinutes = null;
  if (leg === "pickup") {
    booking.intakeMethod = method;
    booking.valet = null;
    booking.pickupProgress = {};
    // Back from "Valet Assigned" / "Valet On Road"
    booking.status = BookingStatus.BOOKED;
  } else {
    booking.handoverMethod = method;
    booking.deliveryValet = null;
    booking.deliveryProgress = {};
    // Back from "Valet On Road"
    booking.status = BookingStatus.VEHICLE_RETURN;
  }
}

// No valet, so nobody to follow: the admin just says the vehicle is at the
// dealership (intake) or back with the customer (handover)
function confirmLegDone(booking: AdminBooking, leg: ValetLeg) {
  assertLegOpen(booking, leg);
  const method = legMethod(booking, leg);
  if (!method) throw new Error("Choose how the vehicle makes this trip first.");
  if (method === "valet") throw new Error("The valet's trip shows when the vehicle gets there.");
  if (legProgress(booking, leg)[TRIP_END[leg]]) {
    throw new Error("This is already confirmed.");
  }

  const log = { [TRIP_END[leg]]: clock() };
  if (leg === "pickup") {
    booking.pickupProgress = log;
    advanceStatusTo(booking, BookingStatus.VEHICLE_ARRIVED);
  } else {
    booking.deliveryProgress = log;
  }
}

function assignValet(booking: AdminBooking, leg: ValetLeg, valet: StaffMember) {
  assertLegOpen(booking, leg);
  const method = legMethod(booking, leg);
  if (method && method !== "valet") throw new Error("This trip isn't made by a valet.");
  if (legProgress(booking, leg).pickedUp) {
    throw new Error("This valet already has the vehicle, so they can't be changed.");
  }
  if (leg === "pickup") booking.intakeMethod = "valet";
  else booking.handoverMethod = "valet";

  booking.assignedAt = { ...booking.assignedAt, [leg]: clock() };
  // A new valet starts the trip over
  if (leg === "pickup") {
    booking.valet = { ...valet };
    booking.pickupProgress = {};
    advanceStatusTo(booking, BookingStatus.VALET_ASSIGNED);
    booking.etaMinutes = 45;
  } else {
    booking.deliveryValet = { ...valet };
    booking.deliveryProgress = {};
    // Back from "Valet On Road" if the valet who was replaced had set off
    booking.status = BookingStatus.VEHICLE_RETURN;
  }
}

function markValetMilestone(booking: AdminBooking, leg: ValetLeg, milestone: ValetMilestone) {
  assertNotComplete(booking);
  if (!legValet(booking, leg)) throw new Error("Assign a valet first.");
  const log = legProgress(booking, leg);
  if (nextMilestone(LEG_MILESTONES[leg], log) !== milestone) {
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
    // "Valet On Road" from setting off until they reach the customer, then
    // "Vehicle Return" again. Set directly: it sits earlier in the status order.
    booking.status =
      milestone === "reached" || milestone === "delivered"
        ? BookingStatus.VEHICLE_RETURN
        : BookingStatus.VALET_ON_ROAD;
    // Countdown while the valet drives the vehicle back to the customer
    booking.etaMinutes = milestone === "pickedUp" ? 30 : null;
  }
}

function assignAdvisor(booking: AdminBooking, advisor: StaffMember) {
  assertNotComplete(booking);
  if (!legDone(booking, "pickup")) {
    throw new Error("The vehicle has to reach the dealership before assigning an advisor.");
  }
  booking.relationshipManager = { ...advisor };
  booking.assignedAt = { ...booking.assignedAt, advisor: clock() };
}

function markAdvisorMilestone(booking: AdminBooking, milestone: AdvisorMilestone) {
  assertNotComplete(booking);
  if (!booking.relationshipManager) throw new Error("Assign an advisor first.");
  const log = booking.advisorProgress ?? {};
  if (milestone === ADVISOR_HANDOVER) {
    // Handing the vehicle over is the advisor's last update, once the bill is paid
    if (booking.payment?.status !== "paid") {
      throw new Error("The bill has to be paid before the vehicle is ready to dispatch.");
    }
    if (log[ADVISOR_HANDOVER]) throw new Error("The vehicle is already ready to dispatch.");
  } else if (nextMilestone(ADVISOR_MILESTONES, log) !== milestone) {
    throw new Error("Service updates have to be made in order.");
  }
  booking.advisorProgress = { ...log, [milestone]: clock() };
  advanceStatusTo(booking, advisorStatuses[milestone]);
}

function generateBill(booking: AdminBooking, items = standardItems(booking)) {
  assertNotComplete(booking);
  if (!booking.advisorProgress?.inService) {
    throw new Error("Start the service before generating the bill.");
  }
  booking.invoice ??= createInvoice(items);
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

// How many actions take a booking from new to complete (bill, payment and handover included)
const WORKFLOW_ACTIONS =
  1 + (1 + LEG_MILESTONES.pickup.length) + (1 + LEG_MILESTONES.delivery.length) + 1 + ADVISOR_MILESTONES.length + 3 + 1;

type StaffPicker = Record<StaffRole, () => StaffMember>;

// The next thing the admin (or a valet) would do; null while it's the customer's
// turn to pay, and once the booking is complete
function nextAction(booking: AdminBooking, pickStaff: StaffPicker): (() => void) | null {
  if (booking.status === BookingStatus.SERVICE_COMPLETE) return null;
  if (!booking.confirmedAt) return () => confirm(booking);

  // A valet unless the admin picked something else for the trip
  const nextOnLeg = (leg: ValetLeg) => {
    const method = legMethod(booking, leg);
    if (method && method !== "valet") {
      return legDone(booking, leg) ? null : () => confirmLegDone(booking, leg);
    }
    if (!legValet(booking, leg)) return () => assignValet(booking, leg, pickStaff.valet());
    const step = nextMilestone(LEG_MILESTONES[leg], legProgress(booking, leg));
    return step ? () => markValetMilestone(booking, leg, step) : null;
  };

  const pickupAction = nextOnLeg("pickup");
  if (pickupAction) return pickupAction;

  if (!booking.relationshipManager) return () => assignAdvisor(booking, pickStaff.manager());
  const advisorStep = nextMilestone(ADVISOR_MILESTONES, booking.advisorProgress ?? {});
  if (advisorStep) return () => markAdvisorMilestone(booking, advisorStep);
  if (!booking.invoice) return () => generateBill(booking);
  if (booking.payment?.status !== "paid") return null;
  if (!booking.advisorProgress?.[ADVISOR_HANDOVER]) {
    return () => markAdvisorMilestone(booking, ADVISOR_HANDOVER);
  }

  return nextOnLeg("delivery") ?? (() => complete(booking));
}

const payAction = (booking: AdminBooking) =>
  booking.invoice && booking.payment?.status !== "paid" ? () => markPaid(booking) : null;

const firstAvailable = (list: StaffMember[]) => list.find((item) => item.available) ?? list[0];

// Created after the workflow helpers above, which the seed uses
let db = loadDb();

// A staff link is usually open in another tab than the admin dashboard; pick up
// what that tab saved so neither works on (or saves back) stale data
window.addEventListener("storage", (event) => {
  if (event.key === DB_KEY || event.key === null) db = loadDb();
});

export const mockServer = {
  // ---- Customer bookings ----
  createBooking(
    input: Omit<
      AdminBooking,
      | "id"
      | "customer"
      | "createdAt"
      | "status"
      | "confirmedAt"
      | "valet"
      | "relationshipManager"
      | "payment"
      | "staffTokens"
    >,
    // The id the real API gave the booking: it has already accepted it, so the
    // copy kept here is never refused
    savedId?: string,
  ) {
    const user = currentUser();
    // One service per vehicle at a time; other vehicles can be booked alongside
    if (
      !savedId &&
      findOpenBookings(user.id).some((booking) => booking.vehicle.vin === input.vehicle.vin)
    ) {
      throw new Error(
        "This vehicle already has a service in progress. You can book it again once that's complete.",
      );
    }
    const id = savedId ?? `PC-${Date.now().toString().slice(-6)}`;
    const booking: AdminBooking = {
      ...input,
      id,
      customer: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      createdAt: new Date().toISOString(),
      status: BookingStatus.IN_QUEUE,
      confirmedAt: null,
      valet: null,
      relationshipManager: null,
      payment: null,
      staffTokens: mockStaffTokens(id),
    };
    db.bookings.unshift(booking);
    persist();
    return booking;
  },

  getMyOpenBookings() {
    return findOpenBookings(currentUser().id);
  },

  getMyBooking(id: string) {
    return findMyBooking(id);
  },

  // The customer withdraws a booking the dealership hasn't confirmed yet; it's removed
  cancelBooking(id: string) {
    const booking = findMyBooking(id);
    if (booking.status !== BookingStatus.IN_QUEUE) {
      throw new Error("The dealership has confirmed this booking, so it can't be cancelled here.");
    }
    db.bookings.splice(db.bookings.indexOf(booking), 1);
    persist();
    return { id };
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
  // A booking's details from the real API, while the workflow is still answered
  // here: keeps a copy (so the workflow steps have a booking to act on) and
  // returns it. What the booking is comes from the API; how far its workflow has
  // got comes from the copy.
  syncBooking(real: AdminBooking) {
    requireAdmin();
    const copy = db.bookings.find((item) => item.id === real.id);
    if (!copy) {
      const booking = { ...real, staffTokens: mockStaffTokens(real.id) };
      db.bookings.unshift(booking);
      persist();
      return booking;
    }

    Object.assign(copy, {
      // The customer's own bookings are found by the id the copy was made with
      customer: { ...real.customer, id: copy.customer.id },
      serviceId: real.serviceId,
      vehicle: real.vehicle,
      pickup: real.pickup,
      dealershipName: real.dealershipName,
      driveable: real.driveable,
      towTruck: real.towTruck,
      concern: real.concern,
      scheduledAt: real.scheduledAt,
    });
    // Confirming is done with the API: a booking it has confirmed is confirmed here
    if (real.confirmedAt && !copy.confirmedAt) {
      copy.confirmedAt = real.confirmedAt;
      confirm(copy);
    }
    persist();
    return copy;
  },

  setLegMethod(id: string, leg: ValetLeg, method: IntakeMethod) {
    requireAdmin();
    const booking = findBooking(id);
    setLegMethod(booking, leg, method);
    persist();
    return booking;
  },

  confirmLegDone(id: string, leg: ValetLeg) {
    requireAdmin();
    const booking = findBooking(id);
    confirmLegDone(booking, leg);
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

  listOffers(params: OfferListParams): OfferList {
    requireAdmin();
    const search = params.search.trim().toLowerCase();
    const vehicle = (offer: Offer) => `${offer.year} ${offer.brand} ${offer.model} ${offer.trim}`;

    const filtered = db.offers.filter((offer) => {
      if (params.condition !== "all" && offer.condition !== params.condition) return false;
      if (params.offerType !== "all" && offer.offerType !== params.offerType) return false;
      if (!search) return true;

      return [offer.vin, offer.stockNumber, vehicle(offer), offer.lender].some((value) =>
        value.toLowerCase().includes(search),
      );
    });

    const sortValue = (offer: Offer) => {
      switch (params.sortBy) {
        case "vin":
          return offer.vin;
        case "stockNumber":
          return offer.stockNumber;
        case "offerType":
          return offer.offerType.toLowerCase();
        case "payment":
          return offer.payment;
        case "term":
          return offer.term;
        case "apr":
          return offer.apr;
        default:
          return vehicle(offer).toLowerCase();
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
    const distinct = (values: string[]) => [...new Set(values.filter(Boolean))].sort();

    return {
      items: sorted.slice(start, start + params.pageSize),
      total: sorted.length,
      page,
      pageSize: params.pageSize,
      totalPages,
      conditions: distinct(db.offers.map((offer) => offer.condition)),
      offerTypes: distinct(db.offers.map((offer) => offer.offerType)),
    };
  },

  updateOffer(id: string, input: OfferInput) {
    requireAdmin();
    const offer = db.offers.find((item) => item.id === id);
    if (!offer) throw new Error("We couldn't find this offer.");
    Object.assign(offer, input);
    persist();
    return offer;
  },

  deleteOffer(id: string) {
    requireAdmin();
    const index = db.offers.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("We couldn't find this offer.");
    db.offers.splice(index, 1);
    persist();
    return { id };
  },

  // A new file replaces the offers there were. The mock keeps the first
  // MOCK_OFFERS_LIMIT of them but reports them all as imported.
  uploadOffers(rows: OfferCsvRow[]) {
    requireAdmin();
    db.offers = rows.slice(0, MOCK_OFFERS_LIMIT).map(toOffer);
    persist();
    return { imported: rows.length };
  },

  // ---- Staff pages (valet / advisor; signed in by the link's search params or
  // by email + OTP, never by the app's session) ----
  sendStaffOtp(email: string) {
    if (!findStaffByEmail(email)) {
      throw new Error("No valet or advisor account found for this email.");
    }
    return { sent: true };
  },

  // Like the app's login, the mock accepts any 6-digit code
  verifyStaffOtp(email: string): StaffAuth {
    const found = findStaffByEmail(email);
    if (!found) throw new Error("No valet or advisor account found for this email.");
    return { gear: mockStaffGear(found.member), token: mockStaffTypeToken(found.type) };
  },

  listStaffBookings(auth: StaffAuth) {
    return findStaffBookings(auth).map(({ booking, roles }) => staffView(booking, roles));
  },

  getStaffBooking(auth: StaffAuth, id: string) {
    const { booking, roles } = findStaffBooking(auth, id);
    return staffView(booking, roles);
  },

  staffUpdateValetProgress(auth: StaffAuth, id: string, leg: ValetLeg, milestone: ValetMilestone) {
    const { booking, roles } = findStaffBooking(auth, id);
    assertStaffRole(roles, leg);
    markValetMilestone(booking, leg, milestone);
    persist();
    return staffView(booking, roles);
  },

  staffUpdateAdvisorProgress(auth: StaffAuth, id: string, milestone: AdvisorMilestone) {
    const { booking, roles } = findStaffBooking(auth, id);
    assertStaffRole(roles, "advisor");
    markAdvisorMilestone(booking, milestone);
    persist();
    return staffView(booking, roles);
  },

  // The advisor types the bill's rows; tax and totals are added here
  staffGenerateInvoice(auth: StaffAuth, id: string, items: InvoiceLine[]) {
    const { booking, roles } = findStaffBooking(auth, id);
    assertStaffRole(roles, "advisor");
    generateBill(booking, items);
    persist();
    return staffView(booking, roles);
  },

  // The advisor has checked that the customer paid another way
  staffConfirmPayment(auth: StaffAuth, id: string) {
    const { booking, roles } = findStaffBooking(auth, id);
    assertStaffRole(roles, "advisor");
    markPaid(booking);
    persist();
    return staffView(booking, roles);
  },

  // ---- Staff (valets and advisors) ----
  // The staff list from the real API, while adding, editing and deleting staff
  // and the workflow's assign steps are still answered here: keeps a copy of each
  // person under the API's id, so they can be assigned to a booking.
  syncStaff(role: StaffRole, staff: StaffMember[]) {
    const list = staffList(role);
    staff.forEach((member) => {
      const fields = { ...member };
      // Counted here from the bookings, not stored
      delete fields.activeBookings;
      const copy = list.find((item) => item.id === member.id);
      if (copy) Object.assign(copy, fields);
      else list.push(fields);

      // Bookings keep a copy of the assigned member; keep their details current
      db.bookings.forEach((booking) => {
        if (role === "valet" && booking.valet?.id === member.id) booking.valet = { ...fields };
        if (role === "valet" && booking.deliveryValet?.id === member.id) {
          booking.deliveryValet = { ...fields };
        }
        if (role === "manager" && booking.relationshipManager?.id === member.id) {
          booking.relationshipManager = { ...fields };
        }
      });
    });
    persist();
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
