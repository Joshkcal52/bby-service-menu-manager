import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";
import { ServiceSection, Service, ServicePackage } from "../types";
import SectionItem from "./SectionItem";
import SectionCreationModal from "./SectionCreationModal";
import {
  getMenuData,
  updateSectionOrder,
  updateServiceOrder,
  updatePackageOrder,
  deleteSection,
} from "../services/apiService";
import ReanimatedAnimated from "react-native-reanimated";

const ServiceMenuManager: React.FC = () => {
  console.log("🚀 ServiceMenuManager: Component initializing");

  // State to hold our menu data
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>(
    "0fa42cc0-75d2-4ef1-be9f-4df447a9ad99"
  ); // Real user ID from database

  console.log("📱 ServiceMenuManager: State initialized", {
    sections: sections.length,
    loading,
    refreshing,
    userId,
  });

  // Load data when component mounts
  useEffect(() => {
    // Start with blank slate - no automatic data loading
    // loadMenuData();
  }, []);

  // Load menu data from API
  const loadMenuData = async () => {
    try {
      setLoading(true);
      console.log("Loading menu data for user:", userId);

      const response = await getMenuData(userId);
      console.log("API response:", response);
      console.log("Response type:", typeof response);
      console.log("Response keys:", Object.keys(response));
      console.log("Response.data type:", typeof response.data);
      console.log(
        "Response.data keys:",
        response.data ? Object.keys(response.data) : "undefined"
      );

      if (response.success && response.data) {
        // Handle the double-nested response structure
        const menuData = (response.data as any).data || response.data;
        console.log("Menu data from API:", menuData);
        console.log("Menu data type:", typeof menuData);
        console.log("Menu data keys:", Object.keys(menuData));
        console.log("Menu data.sections:", menuData.sections);
        console.log("Menu data.sections type:", typeof menuData.sections);
        console.log("Menu data.sections length:", menuData.sections?.length);

        if (menuData.sections && menuData.sections.length > 0) {
          console.log(
            "Loading menu data from API:",
            menuData.sections.length,
            "sections"
          );
          setSections(menuData.sections);
        } else {
          console.log("API returned empty sections");
          setSections([]);
        }
      } else {
        console.log("API call failed");
        setSections([]);
      }
    } catch (error) {
      console.log("Error loading menu data:", error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMenuData();
      // Add a small delay to make the animation smoother
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.log("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle reordering of sections with API save
  const handleSectionReorder = async ({ data }: { data: ServiceSection[] }) => {
    setSections(data);
    console.log("Section order updated:", data);

    // Save to API
    try {
      const orderData = data.map((section, index) => ({
        id: section.id,
        order: index + 1,
      }));

      const response = await updateSectionOrder(userId, orderData);
      if (response.success) {
        console.log("Section order saved to API successfully");
      } else {
        console.log("Failed to save section order:", response.error);
      }
    } catch (error) {
      console.log("Error saving section order:", error);
    }
  };

  // Handle reordering of services within a section with API save
  const handleServiceReorder = async (
    sectionId: string,
    newServices: Service[]
  ) => {
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        return { ...section, services: newServices };
      }
      return section;
    });
    setSections(updatedSections);
    console.log("Service order updated for section:", sectionId);

    // Save to API
    try {
      // Filter out any services with temporary IDs (they start with 'service-')
      const validServices = newServices.filter(
        (service) =>
          !service.id.startsWith("service-") &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            service.id
          )
      );

      if (validServices.length !== newServices.length) {
        console.warn(
          "⚠️ Some services have temporary IDs and will be skipped:",
          newServices
            .filter((s) => s.id.startsWith("service-"))
            .map((s) => ({ id: s.id, name: s.name }))
        );
      }

      const orderData = validServices.map((service, index) => ({
        id: service.id,
        order: index + 1,
      }));

      console.log("🔄 Updating service order with valid services:", orderData);

      const response = await updateServiceOrder(userId, sectionId, orderData);
      if (response.success) {
        console.log("Service order saved to API successfully");
      } else {
        console.log("Failed to save service order:", response.error);
      }
    } catch (error) {
      console.log("Error saving service order:", error);
    }
  };

  // Handle reordering of packages within a section with API save
  const handlePackageReorder = async (
    sectionId: string,
    newPackages: ServicePackage[]
  ) => {
    const updatedSections = sections.map((section) => {
      if (section.id === sectionId) {
        return { ...section, packages: newPackages };
      }
      return section;
    });
    setSections(updatedSections);
    console.log("Package order updated for section:", sectionId);

    // Save to API
    try {
      const orderData = newPackages.map((pkg, index) => ({
        id: pkg.id,
        order: index + 1,
      }));

      const response = await updatePackageOrder(userId, sectionId, orderData);
      if (response.success) {
        console.log("Package order saved to API successfully");
      } else {
        console.log("Failed to save package order:", response.error);
      }
    } catch (error) {
      console.log("Error saving package order:", error);
    }
  };

  // Refs for swipeable components to force them to close
  const sectionSwipeableRefs = useRef<{ [key: string]: Swipeable | null }>({});

  // Animation state for smooth deletions
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());

  // Handle service deletion
  const handleServiceDeleted = (sectionId: string, serviceId: string) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              services: section.services.filter((s) => s.id !== serviceId),
            }
          : section
      )
    );
  };

  // Handle package deletion
  const handlePackageDeleted = (sectionId: string, packageId: string) => {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              packages:
                section.packages?.filter((p) => p.id !== packageId) || [],
            }
          : section
      )
    );
  };

  // Handle section deletion
  const handleSectionDeleted = (sectionId: string) => {
    setSections((prevSections) =>
      prevSections.filter((s) => s.id !== sectionId)
    );
  };

  // Smooth deletion animation
  const animateAndDelete = (itemId: string, deleteFunction: () => void) => {
    // Mark item as deleting
    setDeletingItems((prev) => new Set(prev).add(itemId));

    // Simple fade out over 200ms
    setTimeout(() => {
      // Remove from deleting set
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });

      // Actually delete the item
      deleteFunction();
    }, 200);
  };

  // Toggle section expansion
  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Render each section item
  const renderSectionItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ServiceSection>) => {
    const handleDeleteSection = useCallback(
      async (sectionId: string) => {
        console.log("🔄 Starting section deletion for:", sectionId);

        // Force the swipeable to close instantly (super fast response)
        const swipeableRef = sectionSwipeableRefs.current[sectionId];
        if (swipeableRef) {
          swipeableRef.close();
        }

        try {
          console.log("📡 Calling deleteSection API with:", {
            userId,
            sectionId,
          });
          const response = await deleteSection(userId, sectionId);
          console.log("✅ API Response:", response);

          if (response.success) {
            animateAndDelete(sectionId, () => handleSectionDeleted(sectionId));
            console.log("🗑️ Section deleted successfully:", sectionId);
          } else {
            console.error("❌ API returned error:", response.error);
            Alert.alert("Error", "Failed to delete section: " + response.error);
          }
        } catch (error) {
          console.error("💥 Error deleting section:", error);
          Alert.alert("Error", "Failed to delete section: " + error);
        }
      },
      [userId, handleSectionDeleted, animateAndDelete]
    );

    // Create animated value for this item
    const animatedValue = useRef(new Animated.Value(1)).current;

    // Apply animation when item is marked for deletion
    useEffect(() => {
      if (deletingItems.has(item.id)) {
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [deletingItems.has(item.id)]);

    return (
      <Swipeable
        ref={(ref) => {
          sectionSwipeableRefs.current[item.id] = ref;
        }}
        renderRightActions={() => (
          <View style={styles.deleteSectionAreaContainer}>
            <View style={styles.deleteSectionArea}>
              <Text style={styles.deleteSectionX}>✕</Text>
            </View>
          </View>
        )}
        rightThreshold={40}
        onSwipeableOpen={() => handleDeleteSection(item.id)}
      >
        <View style={isActive && styles.draggingSection}>
          <Animated.View
            style={{
              opacity: animatedValue,
            }}
          >
            <SectionItem
              section={item}
              isEditing={true}
              isActive={expandedSections.includes(item.id)}
              onToggleActive={(sectionId) => toggleSectionExpanded(sectionId)}
              onServiceReorder={handleServiceReorder}
              onPackageReorder={handlePackageReorder}
              onServiceDeleted={handleServiceDeleted}
              onPackageDeleted={handlePackageDeleted}
              userId={userId}
            />
          </Animated.View>
        </View>
      </Swipeable>
    );
  };

  // Show loading state
  if (loading) {
    console.log("⏳ ServiceMenuManager: Showing loading state");
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF69B4" />
        <Text style={styles.loadingText}>Loading your beautiful menu...</Text>
      </View>
    );
  }

  console.log("🎨 ServiceMenuManager: Rendering main component", {
    sectionsCount: sections.length,
  });

  console.log("📋 ServiceMenuManager: About to render DraggableFlatList", {
    sectionsCount: sections.length,
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={{ color: "#FF1493", fontSize: 20, marginRight: 8 }}>
            💖
          </Text>
          <Text style={styles.titleText}>BBY Service Menu Manager</Text>
          <Text style={{ color: "#FF1493", fontSize: 20, marginLeft: 8 }}>
            💖
          </Text>
        </View>

        {/* Clear Menu Button (when data is loaded) */}
        {sections.length > 0 && (
          <TouchableOpacity
            style={styles.clearMenuButton}
            onPress={() => {
              setSections([]);
              console.log("🗑️ Menu cleared, returning to blank slate");
            }}
          >
            <Text style={styles.clearMenuButtonText}>🗑️ Clear Menu</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Load Sample Data Button */}
      {sections.length === 0 && (
        <View style={styles.sampleDataContainer}>
          <Text style={styles.sampleDataText}>
            Start building your service menu! 🎨
          </Text>
          <TouchableOpacity
            style={styles.loadSampleButton}
            onPress={loadMenuData}
          >
            <Text style={styles.loadSampleButtonText}>Load Sample Data</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Section Button */}
      <TouchableOpacity
        style={styles.addSectionButton}
        onPress={() => {
          setShowSectionModal(true);
          console.log("➕ Opening section creation modal");
        }}
      >
        <Text style={styles.addSectionButtonText}>+ Add Section</Text>
      </TouchableOpacity>
      {/* Draggable Sections List */}
      <View style={{ flex: 1 }}>
        {sections.length > 0 ? (
          <DraggableFlatList
            data={sections}
            onDragEnd={handleSectionReorder}
            keyExtractor={(item) => item.id}
            renderItem={renderSectionItem}
            contentContainerStyle={styles.listContainer}
            dragItemOverflow={true}
            activationDistance={10}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#FF69B4"]}
                tintColor="#FF69B4"
              />
            }
            ListFooterComponent={() => {
              console.log(
                "📋 ServiceMenuManager: Rendering ListFooterComponent"
              );
              return (
                <View style={styles.orderDisplay}>
                  <Text style={styles.orderTitle}>Current Menu Order:</Text>
                  <ScrollView
                    style={styles.orderScroll}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {sections.map((section, index) => (
                      <View key={section.id} style={styles.orderItem}>
                        <Text style={styles.orderSectionText}>
                          {index + 1}. {section.name}
                        </Text>
                        {section.services.map((service, serviceIndex) => (
                          <Text
                            key={service.id}
                            style={styles.orderServiceText}
                          >
                            {"  "}• {service.name}
                          </Text>
                        ))}
                        {section.packages?.map((pkg, packageIndex) => (
                          <Text key={pkg.id} style={styles.orderPackageText}>
                            {"  "}📦 {pkg.name}
                          </Text>
                        ))}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              );
            }}
          />
        ) : (
          // Show a spacer view when no sections to maintain layout
          <View style={{ flex: 1 }} />
        )}
      </View>

      {/* Section Creation Modal */}
      <SectionCreationModal
        visible={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        onSectionCreated={(newSection) => {
          setSections([...sections, newSection]);
          setShowSectionModal(false);
        }}
        existingSectionsCount={sections.length}
        userId={userId}
        existingSections={sections}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#FF69B4",
    padding: 15,
    paddingTop: 40,
    alignItems: "center",
  },
  titleContainer: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 280,
    marginBottom: 15,
  },
  titleText: {
    color: "#FF1493",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginTop: 20,
  },
  headerButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  headerButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionsList: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
    overflow: "hidden",
  },
  sectionHeader: {
    backgroundColor: "#FF69B4",
    paddingVertical: 20,
    paddingHorizontal: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    flex: 1,
  },
  sectionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  actionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 12,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  sectionContent: {
    padding: 25,
  },
  serviceItem: {
    backgroundColor: "#FFF8F8",
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#FF69B4",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  serviceDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serviceDetailText: {
    fontSize: 14,
    color: "#FF69B4",
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF1493",
  },
  addServiceButton: {
    backgroundColor: "#FF69B4",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addServiceButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  packageItem: {
    backgroundColor: "#FFF8F8",
    padding: 18,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#FF69B4",
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF1493",
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF1493",
  },
  packageServices: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
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
    backgroundColor: "#FF69B4",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 15,
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addPackageButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  footer: {
    backgroundColor: "white",
    padding: 25,
    borderTopWidth: 1,
    borderTopColor: "#FFE4E1",
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF1493",
    marginBottom: 15,
    textAlign: "center",
  },
  footerContent: {
    backgroundColor: "#FFF8F8",
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFE4E1",
  },
  footerText: {
    fontSize: 14,
    color: "#FF69B4",
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F5",
  },
  loadingText: {
    fontSize: 16,
    color: "#FF69B4",
    marginTop: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    color: "#FFB6C1",
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FF1493",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#FF69B4",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  // Swipe-to-delete styles
  deleteAreaContainer: {
    width: 80,
    height: "100%",
    overflow: "hidden",
  },
  deleteArea: {
    backgroundColor: "#FFB6C1",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    borderLeftWidth: 3,
    borderLeftColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteX: {
    color: "#FF1493",
    fontSize: 28,
    fontWeight: "900",
  },
  deleteSectionAreaContainer: {
    width: 80,
    height: "100%",
    overflow: "hidden",
  },
  deleteSectionArea: {
    backgroundColor: "#FFB6C1",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deleteSectionX: {
    color: "#FF1493",
    fontSize: 24,
    fontWeight: "900",
  },
  // Additional styles for existing functionality
  draggingSection: {
    opacity: 0.8,
    transform: [{ scale: 1.02 }],
  },
  clearMenuButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  clearMenuButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  sampleDataContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 25,
    borderRadius: 20,
    margin: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 105, 180, 0.15)",
  },
  sampleDataText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF1493",
    marginBottom: 15,
    textAlign: "center",
  },
  loadSampleButton: {
    backgroundColor: "#FF69B4",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loadSampleButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  addSectionButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: "#FF69B4",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#FF69B4",
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  addSectionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Order display styles
  listContainer: {
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  orderDisplay: {
    backgroundColor: "#FFF8F8",
    margin: 15,
    marginBottom: 100,
    padding: 15,
    borderRadius: 25,
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 105, 180, 0.2)",
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    color: "#FF1493",
    textAlign: "center",
  },
  orderScroll: {
    maxHeight: 300,
  },
  orderItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#FF69B4",
  },
  orderSectionText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FF1493",
    marginBottom: 6,
  },
  orderServiceText: {
    fontSize: 15,
    color: "#FF69B4",
    marginBottom: 3,
  },
  orderPackageText: {
    fontSize: 15,
    color: "#FF69B4",
    marginBottom: 3,
    fontStyle: "italic",
  },
});

console.log("🎨 ServiceMenuManager: Styles loaded successfully");

export default ServiceMenuManager;
