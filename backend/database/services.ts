import { query } from "./connection";
import { ServiceSection, Service, ServicePackage } from "../types";

// Database service functions for the service menu

export class DatabaseService {
  // Get all sections with their services and packages for a user
  static async getMenuData(userId: string): Promise<ServiceSection[]> {
    try {
      // Get sections
      const sectionsResult = await query(
        `SELECT id, name, description, display_order as "order" 
         FROM service_sections 
         WHERE user_id = $1 AND is_active = true 
         ORDER BY display_order`,
        [userId]
      );

      const sections: ServiceSection[] = [];

      for (const sectionRow of sectionsResult.rows) {
        // Get services for this section
        const servicesResult = await query(
          `SELECT id, name, description, duration_minutes as duration, 
                  ROUND(price_cents/100.0, 2) as price, display_order as "order"
           FROM services 
           WHERE section_id = $1 AND is_active = true 
           ORDER BY display_order`,
          [sectionRow.id]
        );

        // Get packages for this section
        const packagesResult = await query(
          `SELECT sp.id, sp.name, sp.description, 
                  ROUND(sp.total_price_cents/100.0, 2) as totalPrice,
                  sp.total_duration_minutes as duration,
                  sp.display_order as "order"
           FROM service_packages sp
           WHERE sp.section_id = $1 AND sp.is_active = true 
           ORDER BY sp.display_order`,
          [sectionRow.id]
        );

        // For packages, get the included service IDs
        const packagesWithServices: ServicePackage[] = [];
        for (const packageRow of packagesResult.rows) {
          const serviceIdsResult = await query(
            `SELECT service_id FROM package_services WHERE package_id = $1`,
            [packageRow.id]
          );

          packagesWithServices.push({
            ...packageRow,
            services: serviceIdsResult.rows.map((row) => row.service_id),
          });
        }

        sections.push({
          ...sectionRow,
          services: servicesResult.rows,
          packages: packagesWithServices,
        });
      }

      return sections;
    } catch (error) {
      console.error("Error fetching menu data:", error);
      throw new Error("Failed to fetch menu data");
    }
  }

  // Update section order
  static async updateSectionOrder(
    userId: string,
    sections: ServiceSection[]
  ): Promise<void> {
    try {
      console.log(
        `Updating section order for user ${userId} with ${sections.length} sections`
      );

      // First, set all sections to temporary high order numbers to avoid constraint violations
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (section && section.id) {
          console.log(`Setting temporary order for section ${section.id}`);

          const result = await query(
            `UPDATE service_sections 
             SET display_order = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND user_id = $3`,
            [1000 + i, section.id, userId]
          );

          if (result.rowCount === 0) {
            console.warn(
              `No rows updated for section ${section.id} with user ${userId}`
            );
          }
        }
      }

      // Now set the final order
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (section && section.id) {
          console.log(`Setting final order ${i + 1} for section ${section.id}`);

          const result = await query(
            `UPDATE service_sections 
             SET display_order = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND user_id = $3`,
            [i + 1, section.id, userId]
          );

          if (result.rowCount === 0) {
            console.warn(
              `No rows updated for section ${section.id} with user ${userId}`
            );
          } else {
            console.log(
              `Successfully updated section ${section.id} to order ${i + 1}`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error updating section order:", error);
      throw new Error("Failed to update section order");
    }
  }

  // Update service order within a section
  static async updateServiceOrder(
    sectionId: string,
    services: Service[]
  ): Promise<void> {
    try {
      console.log(
        `Updating service order for section ${sectionId} with ${services.length} services`
      );

      // First, set all services to temporary high order numbers to avoid constraint violations
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        if (service && service.id) {
          console.log(`Setting temporary order for service ${service.id}`);

          await query(
            `UPDATE services 
             SET display_order = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND section_id = $3`,
            [1000 + i, service.id, sectionId]
          );
        }
      }

      // Then, set the final order numbers
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        if (service && service.id) {
          console.log(`Setting final order ${i + 1} for service ${service.id}`);

          await query(
            `UPDATE services 
             SET display_order = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND section_id = $3`,
            [i + 1, service.id, sectionId]
          );

          console.log(
            `Successfully updated service ${service.id} to order ${i + 1}`
          );
        }
      }
    } catch (error) {
      console.error("Error updating service order:", error);
      throw new Error("Failed to update service order");
    }
  }

  // Update package order within a section
  static async updatePackageOrder(
    sectionId: string,
    packages: ServicePackage[]
  ): Promise<void> {
    try {
      console.log(
        `Updating package order for section ${sectionId} with ${packages.length} packages`
      );

      // First, set all packages to temporary high order numbers to avoid constraint violations
      for (let i = 0; i < packages.length; i++) {
        const packageItem = packages[i];
        if (packageItem && packageItem.id) {
          console.log(`Setting temporary order for package ${packageItem.id}`);

          await query(
            `UPDATE service_packages 
             SET display_order = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND section_id = $3`,
            [1000 + i, packageItem.id, sectionId]
          );
        }
      }

      // Then, set the final order numbers
      for (let i = 0; i < packages.length; i++) {
        const packageItem = packages[i];
        if (packageItem && packageItem.id) {
          console.log(
            `Setting final order ${i + 1} for package ${packageItem.id}`
          );

          await query(
            `UPDATE service_packages 
             SET display_order = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2 AND section_id = $3`,
            [i + 1, packageItem.id, sectionId]
          );

          console.log(
            `Successfully updated package ${packageItem.id} to order ${i + 1}`
          );
        }
      }
    } catch (error) {
      console.error("Error updating package order:", error);
      throw new Error("Failed to update package order");
    }
  }

  // Create a new section
  static async createSection(
    userId: string,
    section: Omit<ServiceSection, "id" | "services" | "packages">
  ): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO service_sections (user_id, name, description, display_order) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [userId, section.name, section.description, section.order]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error("Error creating section:", error);
      throw new Error("Failed to create section");
    }
  }

  // Create a new service
  static async createService(
    sectionId: string,
    service: Omit<Service, "id"> & { order: number }
  ): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO services (section_id, name, description, duration_minutes, price_cents, display_order) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          sectionId,
          service.name,
          service.description,
          service.duration,
          Math.round(service.price * 100),
          service.order,
        ]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error("Error creating service:", error);
      throw new Error("Failed to create service");
    }
  }

  // Create a new package
  static async createPackage(
    sectionId: string,
    packageData: Omit<ServicePackage, "id"> & { order: number },
    serviceIds: string[]
  ): Promise<string> {
    try {
      const client = await query("BEGIN");

      try {
        // Create the package
        const packageResult = await query(
          `INSERT INTO service_packages (section_id, name, description, total_price_cents, total_duration_minutes, display_order) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [
            sectionId,
            packageData.name,
            packageData.description,
            Math.round(packageData.totalPrice * 100),
            packageData.duration,
            packageData.order,
          ]
        );

        const packageId = packageResult.rows[0].id;

        // Link services to the package
        for (const serviceId of serviceIds) {
          await query(
            `INSERT INTO package_services (package_id, service_id) VALUES ($1, $2)`,
            [packageId, serviceId]
          );
        }

        await query("COMMIT");
        return packageId;
      } catch (error) {
        await query("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Error creating package:", error);
      throw new Error("Failed to create package");
    }
  }

  // Get user by email (for authentication)
  static async getUserByEmail(email: string) {
    try {
      const result = await query(
        `SELECT id, email, business_name FROM users WHERE email = $1 AND is_active = true`,
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new Error("Failed to fetch user");
    }
  }

  // Create a new user
  static async createUser(
    email: string,
    businessName: string
  ): Promise<string> {
    try {
      const result = await query(
        `INSERT INTO users (email, business_name) VALUES ($1, $2) RETURNING id`,
        [email, businessName]
      );
      return result.rows[0].id;
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  }
}
