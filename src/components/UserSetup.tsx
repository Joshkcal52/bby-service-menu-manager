import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  createOrGetUser,
  checkApiHealth,
  resetAPICache,
} from "../services/apiService";
import { NetworkUtils } from "../utils/networkUtils";

interface UserSetupProps {
  onUserReady: (userId: string, businessName: string) => void;
}

interface UserData {
  id: string;
  email: string;
  business_name: string;
}

const UserSetup: React.FC<UserSetupProps> = ({ onUserReady }) => {
  const [email, setEmail] = useState("test@bby.com");
  const [businessName, setBusinessName] = useState("BBY Beauty Salon");
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [detectedIP, setDetectedIP] = useState<string>("");
  const [isTestingIP, setIsTestingIP] = useState(false);

  // Check API health and detect IP on component mount
  React.useEffect(() => {
    checkAPIHealthAndDetectIP();
  }, []);

  const checkAPIHealthAndDetectIP = async () => {
    try {
      // First, detect the IP
      const ip = await NetworkUtils.getComputerIP();
      setDetectedIP(ip);

      // Then test the connection
      const connectionTest = await NetworkUtils.testAPIConnection();

      if (connectionTest.success) {
        setApiStatus("connected");
        console.log(`✅ API connected successfully to ${connectionTest.ip}`);
      } else {
        setApiStatus("error");
        console.log(
          `❌ API connection failed to ${connectionTest.ip}: ${connectionTest.error}`
        );
      }
    } catch (error) {
      setApiStatus("error");
      console.log("Error detecting IP or testing connection:", error);
    }
  };

  const handleContinue = async () => {
    if (!email.trim() || !businessName.trim()) {
      Alert.alert("Error", "Please fill in both email and business name");
      return;
    }

    setIsLoading(true);
    try {
      const response = await createOrGetUser(email.trim(), businessName.trim());

      if (response.success && response.data) {
        const userData = response.data as UserData;
        const userId = userData.id;
        onUserReady(userId, businessName.trim());
        Alert.alert(
          "Success!",
          `Welcome back, ${businessName}! Your menu is ready.`
        );
      } else {
        Alert.alert("Error", response.error || "Failed to create/get user");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshConnection = async () => {
    setIsTestingIP(true);
    try {
      // Reset the API cache to force re-detection
      resetAPICache();
      await checkAPIHealthAndDetectIP();
      Alert.alert("Refresh Complete", "Network connection refreshed");
    } catch (error) {
      Alert.alert("Error", "Failed to refresh connection");
    } finally {
      setIsTestingIP(false);
    }
  };

  const getApiStatusText = () => {
    switch (apiStatus) {
      case "checking":
        return "Checking API connection...";
      case "connected":
        return `✅ API Connected to ${detectedIP}`;
      case "error":
        return `❌ API Connection Failed to ${detectedIP}`;
    }
  };

  const getApiStatusColor = () => {
    switch (apiStatus) {
      case "checking":
        return "#f59e0b";
      case "connected":
        return "#10b981";
      case "error":
        return "#ef4444";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>BBY Service Menu Manager</Text>
        <Text style={styles.subtitle}>Setup & Connect</Text>
      </View>

      {/* API Status */}
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, { color: getApiStatusColor() }]}>
          {getApiStatusText()}
        </Text>
        {apiStatus === "checking" && (
          <ActivityIndicator size="small" color={getApiStatusColor()} />
        )}
      </View>

      {/* Network Info */}
      <View style={styles.networkInfoContainer}>
        <Text style={styles.networkInfoTitle}>Network Information:</Text>
        <Text style={styles.networkInfoText}>Detected IP: {detectedIP}</Text>
        <Text style={styles.networkInfoText}>Port: 3002</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefreshConnection}
          disabled={isTestingIP}
        >
          {isTestingIP ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh Connection</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Setup Form */}
      <View style={styles.formContainer}>
        <Text style={styles.label}>Business Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@business.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Business Name:</Text>
        <TextInput
          style={styles.input}
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="Your Business Name"
          autoCapitalize="words"
        />

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!email.trim() || !businessName.trim() || isLoading) &&
              styles.disabledButton,
          ]}
          onPress={handleContinue}
          disabled={!email.trim() || !businessName.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.continueButtonText}>Continue to Menu</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>What happens next?</Text>
        <Text style={styles.instructionText}>
          • We'll create or retrieve your business account{"\n"}• Load your
          existing service menu{"\n"}• Enable drag-and-drop reordering{"\n"}•
          Save changes automatically to your backend
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#6366f1",
    padding: 20,
    paddingTop: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statusContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
  },
  networkInfoContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  networkInfoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
  },
  networkInfoText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
  },
  refreshButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: "white",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  continueButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  instructions: {
    backgroundColor: "#fef3c7",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
});

export default UserSetup;
