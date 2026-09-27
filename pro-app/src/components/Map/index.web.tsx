import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MapViewProps {
  style?: any;
  region?: Region;
  initialRegion?: Region;
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  children?: React.ReactNode;
  provider?: any;
}

export interface MarkerProps {
  coordinate: LatLng;
  title?: string;
  description?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}

export const PROVIDER_GOOGLE = "google";
export const PROVIDER_DEFAULT = "default";

export function Marker({ coordinate, title, description, onPress, children }: MarkerProps) {
  if (children) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.markerWrapper}
        activeOpacity={0.8}
      >
        {children}
        {title && <Text style={styles.markerTitle}>{title}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.defaultMarker}
      activeOpacity={0.8}
    >
      <Ionicons name="location" size={32} color="#222D63" />
      {title && <Text style={styles.markerTitle}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function Callout({ children }: { children?: React.ReactNode }) {
  return <View style={styles.callout}>{children}</View>;
}

export function Circle() {
  return null;
}

export function Polyline() {
  return null;
}

export function Polygon() {
  return null;
}

export default function MapView({
  style,
  region,
  initialRegion,
  children,
}: MapViewProps) {
  const currentRegion = region || initialRegion || {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  // OpenStreetMap embed URL for interactive web view
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    currentRegion.longitude - 0.05
  }%2C${currentRegion.latitude - 0.05}%2C${
    currentRegion.longitude + 0.05
  }%2C${currentRegion.latitude + 0.05}&layer=mapnik&marker=${
    currentRegion.latitude
  }%2C${currentRegion.longitude}`;

  return (
    <View style={[styles.container, style]}>
      {/* Embedded interactive map for web */}
      <iframe
        src={mapUrl}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        title="Map"
      />

      {/* Overlay Markers Container */}
      {children ? (
        <View pointerEvents="box-none" style={styles.overlayContainer}>
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  overlayContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "80%",
  },
  markerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  defaultMarker: {
    alignItems: "center",
  },
  markerTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0F172A",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  callout: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
});
