// Define the structure for individual services
export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number; // in dollars
  description?: string;
}

// Define the structure for service packages
export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  totalPrice: number; // discounted price for the package
  services: string[]; // array of service IDs included in the package
  duration: number; // total duration in minutes
}

// Define the structure for menu sections
export interface ServiceSection {
  id: string;
  name: string;
  description?: string;
  services: Service[];
  packages?: ServicePackage[];
  order: number; // for maintaining section order
}

// Define the complete menu structure
export interface ServiceMenu {
  sections: ServiceSection[];
  lastUpdated: string;
  version: string;
}

// Define drag and drop event types
export interface DragEndEvent<T> {
  data: T[];
  from: number;
  to: number;
}

// Define the structure for backend API responses
export interface MenuUpdateResponse {
  success: boolean;
  message: string;
  updatedMenu?: ServiceMenu;
  error?: string;
}
