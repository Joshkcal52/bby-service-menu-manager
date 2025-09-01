import React, { useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import Animated from "react-native-reanimated";
import { Service, ServicePackage, ServiceSection } from "../types";
import { deleteService, deletePackage } from "../services/apiService";
import ServiceCreationModal from "./ServiceCreationModal";

interface SectionItemProps {
  section: ServiceSection;
  isEditing: boolean;
  isActive: boolean;
  onToggleActive: (sectionId: string) => void;
  onServiceReorder: (sectionId: string, services: Service[]) => void;
  onPackageReorder: (sectionId: string, packages: ServicePackage[]) => void;
  onServiceDeleted: (sectionId: string, serviceId: string) => void;
  onPackageDeleted: (sectionId: string, packageId: string) => void;
  userId: string;
}

const SectionItem: React.FC<SectionItemProps> = ({
  section,
  isEditing,
  isActive,
  onToggleActive,
  onServiceReorder,
  onPackageReorder,
  onServiceDeleted,
  onPackageDeleted,
  userId,
}) => {
  const [expandedServices, setExpandedServices] = useState(true);
  const [expandedPackages, setExpandedPackages] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Refs for swipeable components to force them to close
  const serviceSwipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});
  const packageSwipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  const toggleServices = () => setExpandedServices(!expandedServices);
  const togglePackages = () => setExpandedPackages(!expandedPackages);

  const handleServiceReorder = ({ data }: { data: Service[] }) => {
    onServiceReorder(section.id, data);
  };

  const handlePackageReorder = ({ data }: { data: ServicePackage[] }) => {
    onPackageReorder(section.id, data);
  };

  const handleDeleteService = useCallback(
    async (serviceId: string) => {
      console.log("🔄 Starting service deletion for:", serviceId);

      // Force the swipeable to close instantly (super fast response)
      const swipeableRef = serviceSwipeableRefs.current[serviceId];
      if (swipeableRef) {
        swipeableRef.close();
      }

      try {
        console.log("📡 Calling deleteService API with:", {
          userId,
          sectionId: section.id,
          serviceId,
        });
        const response = await deleteService(userId, section.id, serviceId);
        console.log("✅ API Response:", response);

        if (response.success) {
          onServiceDeleted(section.id, serviceId);
          console.log("🗑️ Service deleted successfully:", serviceId);
        } else {
          console.error("❌ API returned error:", response.error);
          Alert.alert("Error", "Failed to delete service: " + response.error);
        }
      } catch (error) {
        console.error("💥 Error deleting service:", error);
        Alert.alert("Error", "Failed to delete service: " + error);
      }
    },
    [userId, section.id, onServiceDeleted]
  );

  const handleDeletePackage = useCallback(
    async (packageId: string) => {
      console.log("🔄 Starting package deletion for:", packageId);

      // Force the swipeable to close instantly (super fast response)
      const swipeableRef = packageSwipeableRefs.current[packageId];
      if (swipeableRef) {
        swipeableRef.close();
      }

      try {
        console.log("📡 Calling deletePackage API with:", {
          userId,
          sectionId: section.id,
          packageId,
        });
        const response = await deletePackage(userId, section.id, packageId);
        console.log("✅ API Response:", response);

        if (response.success) {
          onPackageDeleted(section.id, packageId);
          console.log("🗑️ Package deleted successfully:", packageId);
        } else {
          console.error("❌ API returned error:", response.error);
          Alert.alert("Error", "Failed to delete package: " + response.error);
        }
      } catch (error) {
        console.error("💥 Error deleting package:", error);
        Alert.alert("Error", "Failed to delete package: " + error);
      }
    },
    [userId, section.id, onPackageDeleted]
  );

  const handleServiceCreated = (newService: Service) => {
    console.log("🎯 Service created in SectionItem:", newService);
    console.log("🎯 Service ID type:", typeof newService.id);
    console.log("🎯 Service ID value:", newService.id);
    console.log(
      "🎯 Is UUID format?",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        newService.id
      )
    );

    // Add the new service to the section
    const updatedServices = [...section.services, newService];
    console.log(
      "🎯 Updated services array:",
      updatedServices.map((s) => ({ id: s.id, name: s.name }))
    );

    onServiceReorder(section.id, updatedServices);
  };

  const handleAddServicePress = () => {
    setShowServiceModal(true);
  };

  // Get girly emoji for each section type
  const getSectionEmoji = (sectionName: string): string => {
    const name = sectionName.toLowerCase();
    if (name.includes("hair")) return "💇‍♀️";
    if (name.includes("facial") || name.includes("face")) return "✨";
    if (name.includes("nail")) return "💅";
    if (name.includes("makeup")) return "💄";
    if (name.includes("massage")) return "💆‍♀️";
    if (name.includes("wax")) return "🪶";
    if (name.includes("lash")) return "👁️";
    if (name.includes("brow")) return "🤨";
    if (name.includes("spa")) return "🧖‍♀️";
    if (name.includes("package")) return "🎁";
    return "💖"; // Default girly emoji
  };

  const renderServiceItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<Service>) => (
    <Swipeable
      ref={(ref) => {
        serviceSwipeableRefs.current[item.id] = ref;
      }}
      renderRightActions={() => (
        <View style={styles.deleteAreaContainer}>
          <View style={styles.deleteArea}>
            <Text style={styles.deleteX}>✕</Text>
          </View>
        </View>
      )}
      rightThreshold={40}
      onSwipeableOpen={() => handleDeleteService(item.id)}
    >
      <TouchableOpacity
        style={[styles.serviceItem, isActive && styles.draggingItem]}
        onLongPress={isEditing ? drag : undefined}
        disabled={!isEditing}
      >
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceDetailText}>{item.duration}min</Text>
            <Text style={styles.servicePrice}>${item.price}</Text>
          </View>
          {item.description && (
            <Text style={styles.serviceDescription}>{item.description}</Text>
          )}
        </View>
        {isEditing && (
          <View style={styles.dragHandle}>
            <Text style={styles.dragHandleText}>⋮⋮</Text>
          </View>
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  const renderPackageItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ServicePackage>) => (
    <Swipeable
      ref={(ref) => {
        packageSwipeableRefs.current[item.id] = ref;
      }}
      renderRightActions={() => (
        <View style={styles.deleteAreaContainer}>
          <View style={styles.deleteArea}>
            <Text style={styles.deleteX}>✕</Text>
          </View>
        </View>
      )}
      rightThreshold={40}
      onSwipeableOpen={() => handleDeletePackage(item.id)}
    >
      <TouchableOpacity
        style={[styles.packageItem, isActive && styles.draggingItem]}
        onLongPress={isEditing ? drag : undefined}
        disabled={!isEditing}
      >
        <View style={styles.packageHeader}>
          <Text style={styles.packageName}>{item.name}</Text>
          <Text style={styles.packagePrice}>${item.totalPrice}</Text>
        </View>
        {item.description && (
          <Text style={styles.packageDescription}>{item.description}</Text>
        )}
        <View style={styles.packageServices}>
          {item.services.map((serviceId, index) => (
            <View key={serviceId} style={styles.packageService}>
              <Text style={styles.packageServiceText}>Service {index + 1}</Text>
              <Text style={styles.packageServiceDuration}>
                Included in package
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={[styles.sectionContainer, isActive && styles.activeContainer]}>
      {/* Section Header */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => onToggleActive(section.id)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.sectionTitle}>
            {getSectionEmoji(section.name)} {section.name}
          </Text>
          {section.description && (
            <Text style={styles.sectionDescription}>{section.description}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <Text style={styles.expandIcon}>{isActive ? "▼" : "▶"}</Text>
        </View>
      </TouchableOpacity>

      {/* Section Content */}
      {isActive && (
        <View style={styles.sectionContent}>
          {/* Services Section */}
          {section.services.length > 0 && (
            <View style={styles.subsection}>
              <TouchableOpacity
                style={styles.subsectionHeader}
                onPress={toggleServices}
              >
                <Text style={styles.subsectionTitle}>
                  💎 Services ({section.services.length})
                </Text>
                <Text style={styles.expandIcon}>
                  {expandedServices ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>

              {expandedServices && (
                <DraggableFlatList
                  data={section.services}
                  onDragEnd={handleServiceReorder}
                  keyExtractor={(item) => item.id}
                  renderItem={renderServiceItem}
                  scrollEnabled={true}
                  contentContainerStyle={styles.draggableList}
                  dragItemOverflow={true}
                  activationDistance={10}
                />
              )}
            </View>
          )}

          {/* Packages Section */}
          {section.packages && section.packages.length > 0 && (
            <View style={styles.subsection}>
              <TouchableOpacity
                style={styles.subsectionHeader}
                onPress={togglePackages}
              >
                <Text style={styles.subsectionTitle}>
                  🎀 Packages ({section.packages.length})
                </Text>
                <Text style={styles.expandIcon}>
                  {expandedPackages ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>

              {expandedPackages && (
                <DraggableFlatList
                  data={section.packages}
                  onDragEnd={handlePackageReorder}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPackageItem}
                  scrollEnabled={true}
                  contentContainerStyle={styles.draggableList}
                  dragItemOverflow={true}
                  activationDistance={10}
                />
              )}
            </View>
          )}
        </View>
      )}

      {/* Add Service Button */}
      <TouchableOpacity
        style={styles.addServiceButton}
        onPress={handleAddServicePress}
      >
        <Text style={styles.addServiceButtonText}>+ Add Service</Text>
      </TouchableOpacity>

      <ServiceCreationModal
        visible={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onServiceCreated={handleServiceCreated}
        sectionId={section.id}
        existingServicesCount={section.services.length}
        userId={userId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: "white",
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeContainer: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF1493",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dragIndicator: {
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dragText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "bold",
  },
  expandIcon: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "bold",
  },
  sectionContent: {
    padding: 20,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF1493",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  draggableList: {
    paddingVertical: 8,
  },
  addServiceButton: {
    backgroundColor: "rgba(255, 105, 180, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 15,
    marginHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 20, 147, 0.3)",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addServiceButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  // Swipe-to-delete styles
  deleteAreaContainer: {
    width: 80,
    height: "100%",
    overflow: "hidden",
  },
  deleteArea: {
    backgroundColor: "#FFC0CB",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderLeftWidth: 2,
    borderLeftColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
    overflow: "hidden",
  },
  deleteX: {
    color: "#FF1493",
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  serviceItem: {
    backgroundColor: "white",
    padding: 18,
    marginBottom: 10,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 105, 180, 0.1)",
  },
  draggingItem: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF1493",
    marginBottom: 4,
  },
  serviceDetails: {
    fontSize: 14,
    color: "#FF69B4",
    marginBottom: 4,
  },
  serviceDetailText: {
    fontSize: 14,
    color: "#718096",
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#667EEA",
  },
  serviceDescription: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  dragHandle: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  dragHandleText: {
    fontSize: 18,
    color: "#FF69B4",
    fontWeight: "bold",
  },
  packageItem: {
    backgroundColor: "white",
    padding: 18,
    marginBottom: 10,
    borderRadius: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 105, 180, 0.1)",
  },
  packageHeader: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF1493",
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 14,
    color: "#FF69B4",
    marginBottom: 4,
  },
  packageDescription: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
  },
  packageServices: {
    backgroundColor: "#FFF8F8",
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#FF69B4",
  },
  packageService: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE4E1",
  },
  packageServiceText: {
    fontSize: 14,
    color: "#FF69B4",
  },
  packageServiceDuration: {
    fontSize: 12,
    color: "#FFB6C1",
  },
  addPackageButton: {
    backgroundColor: "rgba(255, 105, 180, 0.9)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 15,
    marginHorizontal: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 20, 147, 0.3)",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addPackageButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  deleteSectionAreaContainer: {
    width: 80,
    height: "100%",
    overflow: "hidden",
  },
  deleteSectionArea: {
    backgroundColor: "#FFC0CB",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    maxHeight: "100%",
    borderRadius: 12,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderLeftWidth: 2,
    borderLeftColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
    overflow: "hidden",
  },
  deleteSectionX: {
    color: "#FF1493",
    fontSize: 24,
    fontWeight: "900",
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default SectionItem;
