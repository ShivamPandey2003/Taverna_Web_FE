export const siteConfig = {
  name: "Taverna",

  navigation: [
    {
      label: "Services",
      href: "#services",
    },
    {
      label: "About Us",
      href: "#about",
    },
    {
      label: "How It Works",
      href: "#process",
    },
  ],

  hero: {
    title: "Easy and quick car service booking at your fingertips",

    description:
      "Taverna picks up, services, and returns your vehicle. No waiting at the dealership. No disruption to your day. Clean, reliable, and completely contactless.",
  },

  contact: {
    email: "support@taverna.com",
    phone: "(918) 123-4567",
    address: "1200 Grand Avenue, Suite 400 New York, NY 10013",
  },
} as const;