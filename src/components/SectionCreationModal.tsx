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
import { ServiceSection } from "../types";
import { createSection } from "../services/apiService";

// Simple ID generator that works with React Native/Hermes
const generateId = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface SectionCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSectionCreated: (section: ServiceSection) => void;
  existingSectionsCount: number;
  userId: string; // Add userId prop for backend calls
  existingSections: ServiceSection[]; // Add this to calculate proper order
}

const SectionCreationModal: React.FC<SectionCreationModalProps> = ({
  visible,
  onClose,
  onSectionCreated,
  existingSectionsCount,
  userId,
  existingSections,
}) => {
  const [sectionName, setSectionName] = useState("");
  const [sectionDescription, setSectionDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (sectionName.trim()) {
      setIsCreating(true);

      try {
        // Calculate the correct order for the new section
        let newOrder = 1;
        if (existingSections.length > 0) {
          // Get all existing orders and find the first available gap
          const existingOrders = existingSections
            .map((s) => s.order)
            .filter((order) => typeof order === "number" && !isNaN(order))
            .sort((a, b) => a - b);

          // Find the first available order number starting from 1
          for (let i = 1; i <= existingOrders.length + 1; i++) {
            if (!existingOrders.includes(i)) {
              newOrder = i;
              break;
            }
          }

          // If no gaps found, use the next number after the highest
          if (newOrder === 1 && existingOrders.length > 0) {
            const maxOrder = existingOrders[existingOrders.length - 1];
            if (maxOrder !== undefined) {
              newOrder = maxOrder + 1;
            }
          }
        }

        console.log("🔢 SectionCreationModal: Order calculation:", {
          existingSectionsCount,
          existingSectionsLength: existingSections.length,
          existingOrders: existingSections.map((s) => s.order),
          calculatedNewOrder: newOrder,
        });

        // Create section in backend
        const response = await createSection(userId, {
          name: sectionName.trim(),
          description: sectionDescription.trim() || undefined,
          order: newOrder,
        });

        if (response.success && response.data) {
          // Create local section object with backend ID
          const newSection: ServiceSection = {
            id: (response.data as any).id || generateId(), // Use backend ID or fallback to generated ID
            name: sectionName.trim(),
            description: sectionDescription.trim() || undefined,
            services: [],
            packages: [],
            order: existingSectionsCount + 1,
          };

          // Call parent callback with new section
          onSectionCreated(newSection);

          // Reset form and close modal
          setSectionName("");
          setSectionDescription("");
          setIsCreating(false);
          onClose();

          Alert.alert("✨ Success!", "New section created successfully!");
        } else {
          throw new Error(response.error || "Failed to create section");
        }
      } catch (error) {
        console.error("Error creating section:", error);
        Alert.alert(
          "❌ Error",
          `Failed to create section: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setIsCreating(false);
      }
    }
  };

  const handleCancel = () => {
    setSectionName("");
    setSectionDescription("");
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>✨ Create New Section</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Section Name *</Text>
              <TextInput
                style={styles.textInput}
                value={sectionName}
                onChangeText={setSectionName}
                placeholder="e.g., Hair Services, Facial Treatments"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={sectionDescription}
                onChangeText={setSectionDescription}
                placeholder="Describe what this section offers..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={2}
              />
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
                  isCreating && styles.disabledButton,
                ]}
                onPress={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create Section</Text>
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalKeyboardContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    width: "90%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF1493",
    marginBottom: 20,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderColor: "#FF69B4",
    borderWidth: 2,
  },
  cancelButtonText: {
    color: "#FF69B4",
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#FF69B4",
    borderColor: "#FF69B4",
    borderWidth: 2,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.7,
    backgroundColor: "#ccc",
    borderColor: "#ccc",
    borderWidth: 1,
  },
});

export default SectionCreationModal;
