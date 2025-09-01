import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Service } from "../types";
import { createService } from "../services/apiService";

interface ServiceCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onServiceCreated: (service: Service) => void;
  sectionId: string;
  existingServicesCount: number;
  userId: string;
}

const ServiceCreationModal: React.FC<ServiceCreationModalProps> = ({
  visible,
  onClose,
  onServiceCreated,
  sectionId,
  existingServicesCount,
  userId,
}) => {
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceDuration, setServiceDuration] = useState("60");
  const [servicePrice, setServicePrice] = useState("50");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (serviceName.trim() && serviceDuration.trim() && servicePrice.trim()) {
      setIsCreating(true);

      try {
        // Create service data for API call
        const serviceData = {
          name: serviceName.trim(),
          description: serviceDescription.trim() || undefined,
          duration: parseInt(serviceDuration) || 60,
          price: parseFloat(servicePrice) || 50,
          order: existingServicesCount + 1,
        };

        console.log("📡 Creating service with data:", serviceData);

        // Call the backend API to create the service
        const response = await createService(userId, sectionId, serviceData);
        console.log("✅ Service creation response:", response);

        if (response.success && response.data) {
          // Extract the ID from the nested response structure
          const serviceId =
            (response.data as any)?.data?.id || (response.data as any)?.id;

          if (!serviceId) {
            console.error("❌ No service ID found in response:", response);
            throw new Error("No service ID returned from backend");
          }

          console.log("🎯 Extracted service ID:", serviceId);
          console.log("🎯 Response data structure:", response.data);

          // Create the service object with the returned ID from backend
          const newService: Service = {
            id: serviceId,
            name: serviceData.name,
            description: serviceData.description,
            duration: serviceData.duration,
            price: serviceData.price,
          };

          console.log("🎯 Created service object:", newService);
          console.log("🎯 Backend response structure:", response);
          console.log("🎯 Extracted service ID:", serviceId);

          // Call the callback to add the service
          onServiceCreated(newService);

          // Reset form and close modal
          setServiceName("");
          setServiceDescription("");
          setServiceDuration("60");
          setServicePrice("50");
          setIsCreating(false);
          onClose();
        } else {
          throw new Error(response.error || "Failed to create service");
        }
      } catch (error) {
        console.error("💥 Error creating service:", error);
        Alert.alert("Error", "Failed to create service: " + error);
        setIsCreating(false);
      }
    } else {
      Alert.alert("Error", "Please fill in all required fields");
    }
  };

  const handleCancel = () => {
    setServiceName("");
    setServiceDescription("");
    setServiceDuration("60");
    setServicePrice("50");
    setIsCreating(false);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <KeyboardAvoidingView
        style={styles.modalKeyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.modalScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={false}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✨ Add New Service</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Service Name *</Text>
              <TextInput
                style={styles.textInput}
                value={serviceName}
                onChangeText={setServiceName}
                placeholder="e.g., Hair Cut, Facial, etc."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={serviceDescription}
                onChangeText={setServiceDescription}
                placeholder="Describe what this service includes..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Duration (minutes) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={serviceDuration}
                  onChangeText={setServiceDuration}
                  placeholder="60"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.inputLabel}>Price ($) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={servicePrice}
                  onChangeText={setServicePrice}
                  placeholder="50.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isCreating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createButton,
                  (!serviceName.trim() ||
                    !serviceDuration.trim() ||
                    !servicePrice.trim()) &&
                    styles.disabledButton,
                ]}
                onPress={handleCreate}
                disabled={
                  isCreating ||
                  !serviceName.trim() ||
                  !serviceDuration.trim() ||
                  !servicePrice.trim()
                }
              >
                {isCreating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create Service</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    // flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalKeyboardContainer: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalScrollView: {
    // flex: 1,
    width: "100%",
  },
  modalScrollContent: {
    // flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    minHeight: 400,
    maxHeight: 600,
    minHeight: 400,
    maxHeight: 600,
    maxWidth: 400,
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF1493",
    textAlign: "center",
    marginBottom: 25,
    textShadowColor: "rgba(255, 105, 180, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  halfWidth: {
    // flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderColor: "#FFC0CB",
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#FFF",
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginTop: 20,
  },
  modalButton: {
    // flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    minHeight: 56,
  },
  cancelButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#FFC0CB",
  },
  cancelButtonText: {
    color: "#FF69B4",
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#FF69B4",
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  disabledButton: {
    backgroundColor: "#CCC",
    shadowOpacity: 0.1,
  },
});

export default ServiceCreationModal;
