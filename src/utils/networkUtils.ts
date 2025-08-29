// Network utilities for dynamic IP detection
export class NetworkUtils {
  private static cachedIP: string | null = null;
  private static lastCheck: number = 0;
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  // Get the computer's IP address dynamically
  static async getComputerIP(): Promise<string> {
    // Check cache first
    if (this.cachedIP && Date.now() - this.lastCheck < this.CACHE_DURATION) {
      return this.cachedIP;
    }

    try {
      // Try to get local network IP first
      const localIP = await this.getLocalNetworkIP();
      if (localIP) {
        this.cachedIP = localIP;
        this.lastCheck = Date.now();
        return localIP;
      }

      // If no network IPs work, try localhost as fallback
      console.log("🔄 Trying localhost as fallback...");
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 3000);
        });
        const localhostTest = (await Promise.race([
          fetch("http://localhost:3002/api/health", { method: "GET" }),
          timeoutPromise,
        ])) as Response;

        if (localhostTest.ok) {
          console.log("✅ Backend accessible via localhost fallback");
          this.cachedIP = "localhost";
          this.lastCheck = Date.now();
          return "localhost";
        }
      } catch (error) {
        console.log("❌ Localhost fallback also failed:", error);
      }

      // Final fallback to your work IP
      console.log("🔄 Using work IP fallback");
      this.cachedIP = "10.0.0.29";
      this.lastCheck = Date.now();
      return "10.0.0.29";
    } catch (error) {
      console.log("Failed to get IP, using fallback:", error);
      this.cachedIP = "10.0.0.29"; // Fallback to your work IP
      this.lastCheck = Date.now();
      return "10.0.0.29";
    }
  }

  // Get local network IP (improved method)
  private static async getLocalNetworkIP(): Promise<string | null> {
    try {
      console.log("🔍 Testing localhost connection...");
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 3000);
      });
      const localhostTest = Promise.race([
        fetch("http://localhost:3002/api/health", { method: "GET" }),
        timeoutPromise,
      ]);
      const response = (await localhostTest) as Response;

      if (response.ok) {
        console.log("✅ Backend accessible via localhost");
        return "localhost";
      }
    } catch (error) {
      console.log("❌ Backend not accessible via localhost:", error);
    }

    const commonIPs = [
      "10.0.0.29", // Your work IP
      "10.10.10.31", // Your other work interface
      "192.168.10.132", // Your home IP
      "192.168.10.1", // Your home router
      "localhost", // Localhost
      "127.0.0.1", // Localhost alternative
    ];

    console.log("🔍 Testing network IPs...");
    for (const ip of commonIPs) {
      try {
        console.log(`🔍 Testing ${ip}...`);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 3000);
        });
        const testResponse = (await Promise.race([
          fetch(`http://${ip}:3002/api/health`, { method: "GET" }),
          timeoutPromise,
        ])) as Response;

        if (testResponse.ok) {
          console.log(`✅ Backend accessible via ${ip}`);
          return ip;
        } else {
          console.log(
            `❌ Backend responded with status ${testResponse.status} via ${ip}`
          );
        }
      } catch (error) {
        console.log(`❌ Backend not accessible via ${ip}:`, error);
        continue;
      }
    }
    console.log("❌ No network IPs worked, falling back to localhost");
    return null;
  }

  // Build API URL dynamically
  static async getAPIBaseURL(): Promise<string> {
    const ip = await this.getComputerIP();

    // If we're using localhost, use the full localhost URL
    if (ip === "localhost") {
      return `http://localhost:3002/api`;
    }

    return `http://${ip}:3002/api`;
  }

  // Test API connectivity
  static async testAPIConnection(): Promise<{
    success: boolean;
    ip: string;
    error?: string;
  }> {
    try {
      const apiURL = await this.getAPIBaseURL();
      const urlParts = apiURL.split("://");
      const ipPort = urlParts[1]?.split(":");
      const ip = ipPort?.[0] || "unknown";

      const response = await fetch(`${apiURL}/health`);

      if (response.ok) {
        return { success: true, ip };
      } else {
        return { success: false, ip, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      const apiURL = await this.getAPIBaseURL();
      const urlParts = apiURL.split("://");
      const ipPort = urlParts[1]?.split(":");
      const ip = ipPort?.[0] || "unknown";

      return {
        success: false,
        ip,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Get all possible local IPs for testing
  static async getAllLocalIPs(): Promise<string[]> {
    try {
      // This would ideally use a native module to get actual network interfaces
      // For now, return common ones plus your known working IPs
      return [
        "localhost", // Try localhost first
        "10.0.0.29", // Your current work IP
        "10.10.10.31", // Your other interface
        "192.168.1.1", // Common home
        "192.168.0.1", // Common home
        "10.0.0.1", // Common work
        "172.16.0.1", // Common corporate
      ];
    } catch (error) {
      console.log("Error getting local IPs:", error);
      return ["localhost", "10.0.0.29"]; // Fallback to known working IPs
    }
  }
}
