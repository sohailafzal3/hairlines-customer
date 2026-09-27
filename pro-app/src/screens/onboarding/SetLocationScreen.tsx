import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { OnboardingStackParamList } from "../../navigation/types";
import { Header } from "../../components/Header";
import { GOOGLE_API_KEY } from "../../constants";
import { showAlert } from "../../utils/helpers";
import { Colors } from "../../theme/colors";
import { Spacing, BorderRadius } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "SetLocation">;

interface Prediction {
  place_id: string;
  description: string;
}

function loadGooglePlacesScript(): Promise<boolean> {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return Promise.resolve(false);
  }
  if ((window as any).google?.maps?.places) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const existing = document.getElementById("google-places-script");
    if (existing) {
      if ((window as any).google?.maps?.places) return resolve(true);
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.id = "google-places-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function SetLocationScreen({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      loadGooglePlacesScript().catch(() => {});
    }
  }, []);

  const search = async (text: string) => {
    setQuery(text);
    if (!text.trim() || text.length < 3) {
      setPredictions([]);
      return;
    }

    setLoading(true);

    // On Web: use Google Maps JavaScript SDK to completely bypass browser CORS limitations
    if (Platform.OS === "web") {
      try {
        await loadGooglePlacesScript();
        const google = (window as any).google;
        if (google?.maps?.places) {
          const service = new google.maps.places.AutocompleteService();
          service.getPlacePredictions(
            {
              input: text,
              types: ["address"],
            },
            (results: any[], status: any) => {
              setLoading(false);
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                results
              ) {
                setPredictions(
                  results.map((r: any) => ({
                    place_id: r.place_id,
                    description: r.description,
                  }))
                );
              } else {
                setPredictions([]);
              }
            }
          );
          return;
        }
      } catch (err) {
        console.warn("Google Places Web SDK warning:", err);
      }
      setLoading(false);
      return;
    }

    // Native Mobile (iOS / Android): uses native networking (no browser CORS restriction)
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
        `?input=${encodeURIComponent(text)}` +
        `&key=${GOOGLE_API_KEY}` +
        `&types=address`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.status === "OK" && json.predictions) {
        setPredictions(
          json.predictions.map((p: any) => ({
            place_id: p.place_id,
            description: p.description,
          }))
        );
      } else {
        setPredictions([]);
      }
    } catch (e: any) {
      console.warn("Google Places REST error:", e);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const select = async (prediction: Prediction) => {
    setLoading(true);

    // On Web: use Google Maps PlacesService
    if (Platform.OS === "web") {
      try {
        await loadGooglePlacesScript();
        const google = (window as any).google;
        if (google?.maps?.places) {
          const dummy = document.createElement("div");
          const service = new google.maps.places.PlacesService(dummy);
          service.getDetails(
            {
              placeId: prediction.place_id,
              fields: ["formatted_address", "address_components", "geometry"],
            },
            (place: any, status: any) => {
              setLoading(false);
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                place
              ) {
                const components = place.address_components || [];
                const get = (type: string) =>
                  components.find((c: any) => c.types.includes(type))
                    ?.long_name || "";

                const lat =
                  typeof place.geometry?.location?.lat === "function"
                    ? place.geometry.location.lat()
                    : place.geometry?.location?.lat;
                const lng =
                  typeof place.geometry?.location?.lng === "function"
                    ? place.geometry.location.lng()
                    : place.geometry?.location?.lng;

                navigation.navigate("PersonalInfo", {
                  addressData: {
                    address: place.formatted_address || prediction.description,
                    city:
                      get("locality") ||
                      get("sublocality") ||
                      get("administrative_area_level_2"),
                    state: get("administrative_area_level_1"),
                    postalCode: get("postal_code"),
                    latitude: lat,
                    longitude: lng,
                  },
                });
                return;
              }

              // Fallback with description
              navigation.navigate("PersonalInfo", {
                addressData: {
                  address: prediction.description,
                },
              });
            }
          );
          return;
        }
      } catch (err) {
        console.warn("PlacesService error on web:", err);
      }
      setLoading(false);
      navigation.navigate("PersonalInfo", {
        addressData: { address: prediction.description },
      });
      return;
    }

    // Native Mobile (iOS / Android)
    try {
      const url =
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${prediction.place_id}` +
        `&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const json = await res.json();
      const result = json.result;
      if (result) {
        const components = result.address_components || [];
        const get = (type: string) =>
          components.find((c: any) => c.types.includes(type))?.long_name || "";

        navigation.navigate("PersonalInfo", {
          addressData: {
            address: result.formatted_address || prediction.description,
            city: get("locality") || get("sublocality"),
            state: get("administrative_area_level_1"),
            postalCode: get("postal_code"),
            latitude: result.geometry?.location?.lat,
            longitude: result.geometry?.location?.lng,
          },
        });
        return;
      }
    } catch (e: any) {
      console.warn("Native place details error:", e);
    } finally {
      setLoading(false);
    }

    navigation.navigate("PersonalInfo", {
      addressData: { address: prediction.description },
    });
  };

  const useCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "Please enable location permissions to use your current location."
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const formatted = [
          item.name,
          item.street,
          item.city || item.subregion,
          item.region,
          item.postalCode,
          item.country,
        ]
          .filter(Boolean)
          .join(", ");

        navigation.navigate("PersonalInfo", {
          addressData: {
            address:
              formatted || `${loc.coords.latitude}, ${loc.coords.longitude}`,
            city: item.city || item.subregion || "",
            state: item.region || "",
            postalCode: item.postalCode || "",
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        });
      } else {
        navigation.navigate("PersonalInfo", {
          addressData: {
            address: `${loc.coords.latitude}, ${loc.coords.longitude}`,
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        });
      }
    } catch (err: any) {
      showAlert(
        "Location Error",
        err.message || "Could not retrieve your current location."
      );
    } finally {
      setLoading(false);
    }
  };

  const useEnteredAddress = () => {
    if (!query.trim()) return;
    navigation.navigate("PersonalInfo", {
      addressData: {
        address: query.trim(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Set Location" onBackPress={() => navigation.goBack()} />

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={20}
            color={Colors.PlaceholderInactive}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.input}
            placeholder="Search address, plaza, city..."
            placeholderTextColor={Colors.PlaceholderInactive}
            value={query}
            onChangeText={search}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => search("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Current Location Option */}
        <TouchableOpacity
          style={styles.currentLocationRow}
          onPress={useCurrentLocation}
          activeOpacity={0.7}
        >
          <View style={styles.currentLocationIcon}>
            <Ionicons name="navigate" size={18} color="#2563EB" />
          </View>
          <Text style={styles.currentLocationText}>Use Current Location</Text>
        </TouchableOpacity>

        {/* Manual Address Confirmation Option */}
        {query.trim().length >= 3 && (
          <TouchableOpacity
            style={styles.manualAddressRow}
            onPress={useEnteredAddress}
            activeOpacity={0.7}
          >
            <View style={styles.manualAddressIcon}>
              <Ionicons name="checkmark-sharp" size={18} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.manualAddressLabel}>Use entered address</Text>
              <Text style={styles.manualAddressText} numberOfLines={1}>
                "{query.trim()}"
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
          <Text style={styles.loadingText}>Searching locations...</Text>
        </View>
      )}

      <FlatList
        data={predictions}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => select(item)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="location-sharp"
              size={20}
              color={Colors.ButtonPrimaryColor}
              style={styles.rowIcon}
            />
            <Text style={styles.description}>{item.description}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.place_id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !loading && query.trim().length >= 3 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No exact match found. You can tap "Use entered address" above to proceed.
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === "ios" ? 12 : 6,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.TitleColor,
  },
  currentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  currentLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  currentLocationText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2563EB",
  },
  manualAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  manualAddressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  manualAddressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#059669",
    textTransform: "uppercase",
  },
  manualAddressText: {
    fontSize: 14,
    color: Colors.TitleColor,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  rowIcon: {
    marginRight: 12,
  },
  description: {
    fontSize: 14,
    color: "#1E293B",
    flex: 1,
    lineHeight: 20,
  },
  emptyContainer: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});

