import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ServicePackage } from "../types";

interface PackageItemProps {
  package: ServicePackage;
  isEditing: boolean;
  onDrag: () => void;
  isActive: boolean;
}

const PackageItem: React.FC<PackageItemProps> = ({
  package: servicePackage,
  isEditing,
  onDrag,
  isActive,
}) => {
  // Format duration from minutes to readable format
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  // Format price with currency symbol and proper decimal formatting
  const formatPrice = (price: number): string => {
    // Round to 2 decimal places to avoid floating-point precision issues
    const roundedPrice = Math.round(price * 100) / 100;
    return `$${roundedPrice.toFixed(2)}`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onLongPress={isEditing ? onDrag : undefined}
      disabled={!isEditing}
      activeOpacity={isEditing ? 0.7 : 1}
    >
      <View style={styles.packageIcon}>
        <Text style={styles.packageIconText}>📦</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.mainInfo}>
          <Text style={styles.packageName}>{servicePackage.name}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {servicePackage.description}
          </Text>
        </View>

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>
              {formatDuration(servicePackage.duration)}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Services</Text>
            <Text style={styles.detailValue}>
              {servicePackage.services.length}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Price</Text>
            <Text style={styles.priceValue}>
              {formatPrice(servicePackage.totalPrice)}
            </Text>
          </View>
        </View>
      </View>

      {/* Drag indicator */}
      {isEditing && (
        <View style={styles.dragIndicator}>
          <Text style={styles.dragText}>⋮⋮</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeContainer: {
    backgroundColor: "#FFF0F5", // Light pink background
    borderColor: "#FF69B4", // Hot pink border
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    // Removed transform: [{ scale: 1.02 }] to prevent layout issues
  },
  packageIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  packageIconText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  mainInfo: {
    marginBottom: 12,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#047857",
    lineHeight: 20,
  },
  details: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#6ee7b7",
    marginBottom: 2,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#065f46",
    fontWeight: "600",
  },
  priceValue: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "bold",
  },
  dragIndicator: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 12,
  },
  dragText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default PackageItem;
