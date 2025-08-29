import { ServiceSection, Service, ServicePackage } from "../types";

// Generate unique IDs for our mock data
const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create mock services for different categories
const createHairServices = (): Service[] => [
  {
    id: generateId("hair"),
    name: "Haircut & Style",
    duration: 60,
    price: 75,
    description: "Professional haircut with styling and blowout",
  },
  {
    id: generateId("hair"),
    name: "Hair Color",
    duration: 120,
    price: 150,
    description: "Full hair coloring service",
  },
  {
    id: generateId("hair"),
    name: "Highlights",
    duration: 90,
    price: 120,
    description: "Partial or full highlights",
  },
  {
    id: generateId("hair"),
    name: "Hair Treatment",
    duration: 45,
    price: 65,
    description: "Deep conditioning and repair treatment",
  },
];

const createFacialServices = (): Service[] => [
  {
    id: generateId("facial"),
    name: "Classic Facial",
    duration: 60,
    price: 85,
    description: "Deep cleansing and moisturizing facial",
  },
  {
    id: generateId("facial"),
    name: "Anti-Aging Facial",
    duration: 75,
    price: 110,
    description: "Advanced anti-aging treatment",
  },
  {
    id: generateId("facial"),
    name: "Acne Treatment",
    duration: 45,
    price: 70,
    description: "Specialized acne clearing facial",
  },
  {
    id: generateId("facial"),
    name: "Hydrating Facial",
    duration: 60,
    price: 90,
    description: "Intensive hydration treatment",
  },
];

const createNailServices = (): Service[] => [
  {
    id: generateId("nail"),
    name: "Manicure",
    duration: 45,
    price: 35,
    description: "Classic manicure with polish",
  },
  {
    id: generateId("nail"),
    name: "Pedicure",
    duration: 60,
    price: 45,
    description: "Relaxing pedicure treatment",
  },
  {
    id: generateId("nail"),
    name: "Gel Manicure",
    duration: 60,
    price: 50,
    description: "Long-lasting gel polish",
  },
  {
    id: generateId("nail"),
    name: "Nail Art",
    duration: 30,
    price: 25,
    description: "Creative nail design",
  },
];

// Create mock packages with safety checks
const createHairPackages = (hairServices: Service[]): ServicePackage[] => {
  // Ensure we have the required services before creating packages
  if (hairServices.length < 4) {
    console.warn("Not enough hair services to create packages");
    return [];
  }

  return [
    {
      id: generateId("package"),
      name: "Bridal Glam Package",
      description: "Complete bridal hair styling package",
      totalPrice: 200,
      services: [hairServices[0]!.id, hairServices[3]!.id], // Haircut & Style + Treatment
      duration: 105,
    },
    {
      id: generateId("package"),
      name: "Color & Style Combo",
      description: "Hair coloring with styling service",
      totalPrice: 190,
      services: [hairServices[1]!.id, hairServices[0]!.id], // Color + Haircut & Style
      duration: 180,
    },
  ];
};

const createFacialPackages = (facialServices: Service[]): ServicePackage[] => {
  // Ensure we have the required services before creating packages
  if (facialServices.length < 4) {
    console.warn("Not enough facial services to create packages");
    return [];
  }

  return [
    {
      id: generateId("package"),
      name: "Glow & Hydrate Package",
      description: "Facial treatment with hydration boost",
      totalPrice: 150,
      services: [facialServices[0]!.id, facialServices[3]!.id], // Classic + Hydrating
      duration: 120,
    },
  ];
};

const createNailPackages = (nailServices: Service[]): ServicePackage[] => {
  // Ensure we have the required services before creating packages
  if (nailServices.length < 2) {
    console.warn("Not enough nail services to create packages");
    return [];
  }

  return [
    {
      id: generateId("package"),
      name: "Hand & Foot Combo",
      description: "Manicure and pedicure together",
      totalPrice: 70,
      services: [nailServices[0]!.id, nailServices[1]!.id], // Manicure + Pedicure
      duration: 105,
    },
  ];
};

// Generate the complete mock menu data
export const generateMockData = (): ServiceSection[] => {
  const hairServices = createHairServices();
  const facialServices = createFacialServices();
  const nailServices = createNailServices();

  return [
    {
      id: generateId("section"),
      name: "Hair Services",
      description: "Professional hair styling and treatments",
      services: hairServices,
      packages: createHairPackages(hairServices),
      order: 1,
    },
    {
      id: generateId("section"),
      name: "Facial Treatments",
      description: "Rejuvenating facial care services",
      services: facialServices,
      packages: createFacialPackages(facialServices),
      order: 2,
    },
    {
      id: generateId("section"),
      name: "Nail Care",
      description: "Beautiful nails with professional care",
      services: nailServices,
      packages: createNailPackages(nailServices),
      order: 3,
    },
  ];
};

// Export individual service arrays for testing
export const mockHairServices = createHairServices;
export const mockFacialServices = createFacialServices;
export const mockNailServices = createNailServices;
