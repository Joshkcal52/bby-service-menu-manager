import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";
import { ServiceSection, Service, ServicePackage } from "../types";
import ServiceItem from "./ServiceItem";
import PackageItem from "./PackageItem";

interface SectionItemProps {
  section: ServiceSection;
  isEditing: boolean;
  onDrag: () => void;
  isActive: boolean;
  onServiceReorder: (services: Service[]) => void;
  onPackageReorder: (packages: ServicePackage[]) => void;
}

const SectionItem: React.FC<SectionItemProps> = ({
  section,
  isEditing,
  onDrag,
  isActive,
  onServiceReorder,
  onPackageReorder,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showServices, setShowServices] = useState(true);
  const [showPackages, setShowPackages] = useState(true);

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

  // Handle service reordering within this section
  const handleServiceReorder = ({ data }: { data: Service[] }) => {
    onServiceReorder(data);
  };

  // Handle package reordering within this section
  const handlePackageReorder = ({ data }: { data: ServicePackage[] }) => {
    onPackageReorder(data);
  };

  // Create a no-op drag function for when editing is disabled
  const noOpDrag = () => {};

  // Render individual service items
  const renderServiceItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<Service>) => (
    <View>
      <ServiceItem
        service={item}
        isEditing={true}
        onDrag={drag}
        isActive={isActive}
      />
    </View>
  );

  // Render individual package items
  const renderPackageItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<ServicePackage>) => (
    <View>
      <PackageItem
        package={item}
        isEditing={true}
        onDrag={drag}
        isActive={isActive}
      />
    </View>
  );

  return (
    <View style={[styles.container, isActive && styles.activeContainer]}>
      {/* Section Header - Draggable */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onLongPress={onDrag}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={styles.sectionTitle}>
            {getSectionEmoji(section.name)} {section.name}
          </Text>
          <Text style={styles.sectionDescription}>{section.description}</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.dragIndicator}>
            <Text style={styles.dragText}>⋮⋮</Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? "▼" : "▶"}</Text>
        </View>
      </TouchableOpacity>

      {/* Section Content */}
      {isExpanded && (
        <View style={styles.sectionContent}>
          {/* Services Section */}
          {section.services.length > 0 && (
            <View style={styles.subsection}>
              <TouchableOpacity
                style={styles.subsectionHeader}
                onPress={() => setShowServices(!showServices)}
              >
                <Text style={styles.subsectionTitle}>
                  💎 Services ({section.services.length})
                </Text>
                <Text style={styles.expandIcon}>
                  {showServices ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>

              {showServices && (
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
                onPress={() => setShowPackages(!showPackages)}
              >
                <Text style={styles.subsectionTitle}>
                  🎀 Packages ({section.packages.length})
                </Text>
                <Text style={styles.expandIcon}>
                  {showPackages ? "▼" : "▶"}
                </Text>
              </TouchableOpacity>

              {showPackages && (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeContainer: {
    backgroundColor: "#FFF0F5", // Light pink background
    borderColor: "#FF69B4", // Hot pink border
    borderWidth: 2,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    color: "#1e293b",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#64748b",
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
    color: "#374151",
  },
  draggableList: {
    gap: 8,
  },
});

export default SectionItem;
