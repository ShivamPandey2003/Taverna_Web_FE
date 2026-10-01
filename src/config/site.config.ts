export const siteConfig = {
  name: "Taverna",

  navigation: [
    {
      label: "Services",
      href: "#services",
    },
    // {
    //   label: "About Us",
    //   href: "#about",
    // },
    {
      label: "How It Works",
      href: "#process",
    },
  ],

  hero: {
    title: "Easy and quick car service booking at your fingertips",

    description:
      "Taverna collects your vehicle, takes care of the service, and delivers it back to your doorstep. No dealership visits. No wasted time. Just convenient, reliable, and hassle-free vehicle care.",
  },

  contact: {
    email: "support@tavernaservice.com",
    phone: "754-432-6093",
    address: "777 N State Road 7Plantation, FL 33317-2157",
  },
} as const;