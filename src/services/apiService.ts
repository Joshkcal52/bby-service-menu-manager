// API service for communicating with the backend
import { NetworkUtils } from "../utils/networkUtils";

// Dynamic API base URL that adapts to your current network
let API_BASE_URL: string | null = null;

// Get the API base URL dynamically
async function getAPIBaseURL(): Promise<string> {
  if (!API_BASE_URL) {
    API_BASE_URL = await NetworkUtils.getAPIBaseURL();
  }
  return API_BASE_URL;
}

// Reset the cached URL (useful when switching networks)
export function resetAPICache(): void {
  API_BASE_URL = null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface MenuUpdateRequest {
  sections: Array<{
    id: string;
    order: number;
    services: Array<{
      id: string;
      order: number;
    }>;
    packages?: Array<{
      id: string;
      order: number;
    }>;
  }>;
}

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const baseURL = await getAPIBaseURL();
    const response = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);

    // If it's a network error, try to reset the cache and retry once
    if (
      error instanceof TypeError &&
      error.message.includes("Network request failed")
    ) {
      console.log(
        "Network error detected, resetting API cache and retrying..."
      );
      resetAPICache();

      try {
        const baseURL = await getAPIBaseURL();
        const response = await fetch(`${baseURL}${endpoint}`, {
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
          ...options,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { success: true, data };
      } catch (retryError) {
        console.error(`API retry failed for ${endpoint}:`, retryError);
        return {
          success: false,
          error:
            retryError instanceof Error ? retryError.message : "Unknown error",
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get menu data for a user
export async function getMenuData(userId: string) {
  return apiCall(`/menu/${userId}`);
}

// Update section order
export async function updateSectionOrder(
  userId: string,
  sections: Array<{ id: string; order: number }>
) {
  return apiCall(`/menu/${userId}/sections/order`, {
    method: "PUT",
    body: JSON.stringify({ sections }),
  });
}

// Update service order within a section
export async function updateServiceOrder(
  userId: string,
  sectionId: string,
  services: Array<{ id: string; order: number }>
) {
  return apiCall(`/menu/${userId}/sections/${sectionId}/services/order`, {
    method: "PUT",
    body: JSON.stringify({ services }),
  });
}

// Update package order within a section
export async function updatePackageOrder(
  userId: string,
  sectionId: string,
  packages: Array<{ id: string; order: number }>
) {
  return apiCall(`/menu/${userId}/sections/${sectionId}/packages/order`, {
    method: "PUT",
    body: JSON.stringify({ packages }),
  });
}

// Create or get user
export async function createOrGetUser(email: string, businessName: string) {
  return apiCall("/users", {
    method: "POST",
    body: JSON.stringify({ email, businessName }),
  });
}

// Create a new section
export async function createSection(
  userId: string,
  sectionData: {
    name: string;
    description?: string;
    order: number;
  }
) {
  return apiCall(`/menu/${userId}/sections`, {
    method: "POST",
    body: JSON.stringify(sectionData),
  });
}

export async function createService(
  userId: string,
  sectionId: string,
  serviceData: {
    name: string;
    description?: string;
    duration: number;
    price: number;
    order: number;
  }
) {
  return apiCall(`/menu/${userId}/sections/${sectionId}/services`, {
    method: "POST",
    body: JSON.stringify(serviceData),
  });
}

export async function deleteService(
  userId: string,
  sectionId: string,
  serviceId: string
) {
  return apiCall(
    `/menu/${userId}/sections/${sectionId}/services/${serviceId}`,
    {
      method: "DELETE",
    }
  );
}

export async function deletePackage(
  userId: string,
  sectionId: string,
  packageId: string
) {
  return apiCall(
    `/menu/${userId}/sections/${sectionId}/packages/${packageId}`,
    {
      method: "DELETE",
    }
  );
}

export async function deleteSection(userId: string, sectionId: string) {
  return apiCall(`/menu/${userId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

// Health check
export async function checkApiHealth() {
  return apiCall("/health");
}
