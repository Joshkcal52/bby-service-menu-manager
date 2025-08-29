import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./database/connection";
import { DatabaseService } from "./database/services";

// Load environment variables
dotenv.config({ path: "./config.env" });

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8081", // Expo dev server
      "http://localhost:8082", // Expo dev server alternative
      "http://10.0.0.29:3000", // Your local network
      "http://10.10.10.31:3000", // Your other interface
      "http://10.0.0.29:8081", // Expo on your network
      "http://10.10.10.31:8081", // Expo on your other interface
      /^http:\/\/10\.0\.0\.\d+:\d+$/, // Any IP in your 10.0.0.x range
      /^http:\/\/10\.10\.10\.\d+:\d+$/, // Any IP in your 10.10.10.x range
    ],
    credentials: true,
  })
);
app.use(express.json());

// Test database connection on startup
app.get("/api/health", async (req, res) => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Health check failed",
      timestamp: new Date().toISOString(),
    });
  }
});

// API Routes

// Get menu data for a user
app.get("/api/menu/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const menuData = await DatabaseService.getMenuData(userId);
    res.json({ success: true, data: { sections: menuData } });
  } catch (error) {
    console.error("Error fetching menu data:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch menu data" });
  }
});

// Update section order
app.put("/api/menu/:userId/sections/order", async (req, res) => {
  try {
    const { userId } = req.params;
    const { sections } = req.body;

    console.log(`Received section order update request for user ${userId}`);
    console.log(`Sections to update:`, sections);

    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: "Sections must be an array" });
    }

    await DatabaseService.updateSectionOrder(userId, sections);
    return res.json({
      success: true,
      message: "Section order updated successfully",
    });
  } catch (error) {
    console.error("Error updating section order:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return res
      .status(500)
      .json({ error: "Failed to update section order", details: errorMessage });
  }
});

// Update service order within a section
app.put("/api/sections/:sectionId/services/order", async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { services } = req.body;

    if (!Array.isArray(services)) {
      return res.status(400).json({ error: "Services must be an array" });
    }

    await DatabaseService.updateServiceOrder(sectionId, services);
    return res.json({
      success: true,
      message: "Service order updated successfully",
    });
  } catch (error) {
    console.error("Error updating service order:", error);
    return res.status(500).json({ error: "Failed to update service order" });
  }
});

// Update package order within a section
app.put("/api/sections/:sectionId/packages/order", async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { packages } = req.body;

    if (!Array.isArray(packages)) {
      return res.status(400).json({ error: "Packages must be an array" });
    }

    await DatabaseService.updatePackageOrder(sectionId, packages);
    return res.json({
      success: true,
      message: "Package order updated successfully",
    });
  } catch (error) {
    console.error("Error updating package order:", error);
    return res.status(500).json({ error: "Failed to update package order" });
  }
});

// Create a new section
app.post("/api/menu/:userId/sections", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, description, order } = req.body;

    if (!name || typeof order !== "number") {
      return res.status(400).json({ error: "Name and order are required" });
    }

    const sectionId = await DatabaseService.createSection(userId, {
      name,
      description,
      order,
    });
    return res
      .status(201)
      .json({ id: sectionId, message: "Section created successfully" });
  } catch (error) {
    console.error("Error creating section:", error);
    return res.status(500).json({ error: "Failed to create section" });
  }
});

// Create a new service
app.post("/api/sections/:sectionId/services", async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { name, description, duration, price, order } = req.body;

    if (!name || !duration || !price || typeof order !== "number") {
      return res
        .status(400)
        .json({ error: "Name, duration, price, and order are required" });
    }

    const serviceId = await DatabaseService.createService(sectionId, {
      name,
      description,
      duration,
      price,
      order,
    });
    return res
      .status(201)
      .json({ id: serviceId, message: "Service created successfully" });
  } catch (error) {
    console.error("Error creating service:", error);
    return res.status(500).json({ error: "Failed to create service" });
  }
});

// Create a new package
app.post("/api/sections/:sectionId/packages", async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { name, description, totalPrice, duration, order, serviceIds } =
      req.body;

    if (
      !name ||
      !totalPrice ||
      !duration ||
      typeof order !== "number" ||
      !Array.isArray(serviceIds)
    ) {
      return res.status(400).json({
        error: "Name, totalPrice, duration, order, and serviceIds are required",
      });
    }

    const packageData = {
      name,
      description,
      totalPrice,
      duration,
      order,
      services: serviceIds,
    };

    const packageId = await DatabaseService.createPackage(
      sectionId,
      packageData,
      serviceIds
    );
    return res
      .status(201)
      .json({ id: packageId, message: "Package created successfully" });
  } catch (error) {
    console.error("Error creating package:", error);
    return res.status(500).json({ error: "Failed to create package" });
  }
});

// Get or create user
app.post("/api/users", async (req, res) => {
  try {
    const { email, businessName } = req.body;

    if (!email || !businessName) {
      return res
        .status(400)
        .json({ error: "Email and business name are required" });
    }

    // Check if user exists
    let user = await DatabaseService.getUserByEmail(email);

    if (!user) {
      // Create new user
      const userId = await DatabaseService.createUser(email, businessName);
      user = { id: userId, email, business_name: businessName };
    }

    return res.json(user);
  } catch (error) {
    console.error("Error handling user:", error);
    return res.status(500).json({ error: "Failed to handle user" });
  }
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BBY Service Menu API Server running on port ${PORT}`);
  console.log(
    `📊 Health check available at: http://localhost:${PORT}/api/health`
  );
});

export default app;
