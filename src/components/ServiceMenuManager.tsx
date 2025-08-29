import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { ServiceSection, Service, ServicePackage } from "../types";
import SectionItem from "./SectionItem";
import {
  getMenuData,
  updateSectionOrder,
  updateServiceOrder,
  updatePackageOrder,
} from "../services/apiService";

const ServiceMenuManager: React.FC = () => {
  // State to hold our menu data
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string>(
    "0fa42cc0-75d2-4ef1-be9f-4df447a9ad99"
  ); // Real user ID from database

  // Load data when component mounts
  useEffect(() => {
    loadMenuData();
  }, []);

  // Load menu data from API
  const loadMenuData = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
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
      const orderData = newServices.map((service, index) => ({
        id: service.id,
        order: index + 1,
      }));

      const response = await updateServiceOrder(sectionId, orderData);
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

      const response = await updatePackageOrder(sectionId, orderData);
      if (response.success) {
        console.log("Package order saved to API successfully");
      } else {
        console.log("Failed to save package order:", response.error);
      }
    } catch (error) {
      console.log("Error saving package order:", error);
    }
  };

  // Render each section item
  const renderSectionItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ServiceSection>) => (
    <View>
      <SectionItem
        section={item}
        isEditing={false}
        onDrag={drag}
        isActive={isActive}
        onServiceReorder={(services) => handleServiceReorder(item.id, services)}
        onPackageReorder={(packages) => handlePackageReorder(item.id, packages)}
      />
    </View>
  );

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading menu data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={{ backgroundColor: "#FF69B4", padding: 15, paddingTop: 40 }}>
        <View
          style={{
            backgroundColor: "white",
            padding: 12,
            borderRadius: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            minWidth: 280,
          }}
        >
          <Text style={{ color: "#FF1493", fontSize: 20, marginRight: 8 }}>
            💖
          </Text>
          <Text
            style={{
              color: "#FF1493",
              fontSize: 22,
              fontWeight: "bold",
              flex: 1,
              textAlign: "center",
            }}
          >
            BBY Service Menu Manager
          </Text>
          <Text style={{ color: "#FF1493", fontSize: 20, marginLeft: 8 }}>
            💖
          </Text>
        </View>
      </View>

      {/* Draggable Sections List */}
      <View style={{ flex: 1 }}>
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
          ListFooterComponent={() => (
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
                      <Text key={service.id} style={styles.orderServiceText}>
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
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContainer: {
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)", // Slightly transparent white
  },
  orderDisplay: {
    backgroundColor: "#FFF8F8", // Soft pink-tinted white
    margin: 15,
    marginBottom: 30, // Extra margin at bottom for better visibility
    padding: 15,
    borderRadius: 25, // Super rounded corners
    shadowColor: "#FF69B4",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 105, 180, 0.2)", // Subtle pink border
  },
  orderTitle: {
    fontSize: 20,
    fontWeight: "800", // Extra bold
    marginBottom: 16,
    color: "#FF1493", // Deep pink
    textAlign: "center",
    textShadowColor: "rgba(255, 105, 180, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  orderScroll: {
    maxHeight: 300, // Increased height for better visibility
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
    color: "#FF1493", // Deep pink
    marginBottom: 6,
    textShadowColor: "rgba(255, 105, 180, 0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  orderServiceText: {
    fontSize: 15,
    color: "#FF69B4", // Hot pink
    marginBottom: 3,
    fontWeight: "500",
    fontStyle: "italic",
  },
  orderPackageText: {
    fontSize: 15,
    color: "#FF1493", // Deep pink
    fontWeight: "600",
    marginBottom: 3,
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF0F5", // Lavender blush background
  },
  loadingText: {
    marginTop: 15,
    color: "#FF1493", // Deep pink
    fontSize: 18,
    fontWeight: "600",
    fontStyle: "italic",
    textShadowColor: "rgba(255, 105, 180, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ServiceMenuManager;
