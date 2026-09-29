import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
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

export function SetLocationScreen({ route, navigation }: Props) {
  const currentFormData = route.params?.currentFormData;
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

    // Native Mobile (iOS / Android): uses native networking
    try {
      let foundPredictions: Prediction[] = [];

      // 1. Google Places Autocomplete
      if (GOOGLE_API_KEY) {
        try {
          const url =
            `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
            `?input=${encodeURIComponent(text)}` +
            `&key=${GOOGLE_API_KEY}`;
          const res = await fetch(url);
          const json = await res.json();
          if (json.status === "OK" && json.predictions?.length > 0) {
            foundPredictions = json.predictions.map((p: any) => ({
              place_id: p.place_id,
              description: p.description,
            }));
          }
        } catch (err) {
          console.warn("Google places search error:", err);
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim
      if (foundPredictions.length === 0) {
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            text
          )}&addressdetails=1&limit=6`;
          const res = await fetch(nomUrl, {
            headers: { "User-Agent": "HairlinesProApp/1.0 (support@hairlines.app)" },
          });
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            foundPredictions = json.map((item: any) => ({
              place_id: `osm_${item.place_id}`,
              description: item.display_name,
            }));
          }
        } catch (err) {
          console.warn("OSM search error:", err);
        }
      }

      // 3. Fallback to Native Expo Geocoder
      if (foundPredictions.length === 0) {
        try {
          const geoResults = await Location.geocodeAsync(text);
          if (geoResults && geoResults.length > 0) {
            const topGeo = geoResults[0];
            const rev = await Location.reverseGeocodeAsync({
              latitude: topGeo.latitude,
              longitude: topGeo.longitude,
            });
            const first = rev?.[0];
            const desc = first
              ? [
                  first.streetNumber,
                  first.street || first.name,
                  first.city || first.subregion,
                  first.region,
                  first.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")
              : text;

            foundPredictions = [
              {
                place_id: `geo_${topGeo.latitude}_${topGeo.longitude}`,
                description: desc || text,
              },
            ];
          }
        } catch (err) {
          console.warn("Native geocode search error:", err);
        }
      }

      setPredictions(foundPredictions);
    } catch (e: any) {
      console.warn("Places search error:", e);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const select = async (prediction: Prediction) => {
    setLoading(true);

    let lat = 0;
    let lng = 0;
    let extractedCity = "";
    let extractedState = "";
    let extractedPostalCode = "";
    let fullAddr = prediction.description;

    if (GOOGLE_API_KEY && prediction.place_id && !prediction.place_id.startsWith("osm_") && !prediction.place_id.startsWith("geo_")) {
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
          components.forEach((c: any) => {
            if (c.types.includes("locality")) extractedCity = c.long_name;
            if (c.types.includes("administrative_area_level_1"))
              extractedState = c.short_name || c.long_name;
            if (c.types.includes("postal_code"))
              extractedPostalCode = c.long_name;
          });
          fullAddr = result.formatted_address || prediction.description;
          lat = result.geometry?.location?.lat || 0;
          lng = result.geometry?.location?.lng || 0;
        }
      } catch (e: any) {
        console.warn("Place details error:", e);
      }
    }

    if (!lat || !lng) {
      try {
        const geo = await Location.geocodeAsync(prediction.description);
        if (geo && geo.length > 0) {
          lat = geo[0].latitude;
          lng = geo[0].longitude;
          const rev = await Location.reverseGeocodeAsync({
            latitude: lat,
            longitude: lng,
          });
          if (rev && rev.length > 0) {
            const top = rev[0];
            if (!extractedCity) extractedCity = top.city || top.subregion || "";
            if (!extractedState) extractedState = top.region || "";
            if (!extractedPostalCode) extractedPostalCode = top.postalCode || "";
          }
        }
      } catch (err) {
        console.warn("Native geocode fallback error:", err);
      }
    }

    setLoading(false);
    navigation.navigate("PersonalInfo", {
      addressData: {
        address: fullAddr,
        city: extractedCity,
        state: extractedState,
        postalCode: extractedPostalCode,
        latitude: lat || undefined,
        longitude: lng || undefined,
      },
      preservedFormData: currentFormData,
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

      let lat = 0;
      let lng = 0;

      const lastLoc = await Location.getLastKnownPositionAsync();
      if (lastLoc) {
        lat = lastLoc.coords.latitude;
        lng = lastLoc.coords.longitude;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      } catch (locErr) {
        console.warn("Current position err, using last known:", locErr);
      }

      if (!lat && !lng) {
        lat = 37.7749;
        lng = -122.4194;
      }

      let resolvedAddr = "";
      let resolvedCity = "";
      let resolvedState = "";
      let resolvedZip = "";

      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });

        if (geocode && geocode.length > 0) {
          const item = geocode[0];
          resolvedAddr = [
            item.name || item.streetNumber,
            item.street,
            item.city || item.subregion,
            item.region,
            item.postalCode,
            item.country,
          ]
            .filter(Boolean)
            .join(", ");
          resolvedCity = item.city || item.subregion || "";
          resolvedState = item.region || "";
          resolvedZip = item.postalCode || "";
        }
      } catch (err) {
        console.warn("Reverse geocode err:", err);
      }

      navigation.navigate("PersonalInfo", {
        addressData: {
          address: resolvedAddr || `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          city: resolvedCity,
          state: resolvedState,
          postalCode: resolvedZip,
          latitude: lat,
          longitude: lng,
        },
        preservedFormData: currentFormData,
      });
    } catch (err: any) {
      showAlert(
        "Location Error",
        err.message || "Could not retrieve your current location."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreset = (presetType: "Home" | "Work") => {
    const defaultAddr =
      presetType === "Home"
        ? "742 Evergreen Terrace, Springfield"
        : "100 Business Park Blvd, Suite 200";
    navigation.navigate("PersonalInfo", {
      addressData: {
        address: defaultAddr,
        city: presetType === "Home" ? "Springfield" : "New York",
        state: presetType === "Home" ? "OR" : "NY",
        postalCode: presetType === "Home" ? "97477" : "10001",
      },
      preservedFormData: currentFormData,
    });
  };

  const useEnteredAddress = () => {
    if (!query.trim()) return;
    navigation.navigate("PersonalInfo", {
      addressData: {
        address: query.trim(),
      },
      preservedFormData: currentFormData,
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
            <Ionicons name="chevron-forward" size={16} color="#059669" />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
          <Text style={styles.loadingText}>Searching locations...</Text>
        </View>
      )}

      {/* Predictions Search Results (Rendered at top with high zIndex) */}
      {query.trim().length >= 2 ? (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.sectionHeaderTitle}>Search Results</Text>
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
      ) : (
        /* Vertically Stacked Quick Suggestion Cards */
        <ScrollView style={styles.quickOptionsScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionHeaderTitle}>Quick Suggestions</Text>

          <TouchableOpacity
            style={styles.stackedCard}
            onPress={useCurrentLocation}
            activeOpacity={0.8}
          >
            <View style={[styles.stackedIconWrap, { backgroundColor: "#EEF4FF" }]}>
              <Ionicons name="locate" size={22} color={Colors.ButtonPrimaryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stackedTitle}>Use Current Location</Text>
              <Text style={styles.stackedSub}>Auto-detect GPS address & coordinates</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stackedCard}
            onPress={() => handleQuickPreset("Home")}
            activeOpacity={0.8}
          >
            <View style={[styles.stackedIconWrap, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="home-outline" size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stackedTitle}>Home</Text>
              <Text style={styles.stackedSub}>Set as residential address</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.stackedCard}
            onPress={() => handleQuickPreset("Work")}
            activeOpacity={0.8}
          >
            <View style={[styles.stackedIconWrap, { backgroundColor: "#FDF2F8" }]}>
              <Ionicons name="briefcase-outline" size={22} color="#EC4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stackedTitle}>Work</Text>
              <Text style={styles.stackedSub}>Set as workplace / business address</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </ScrollView>
      )}
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
    zIndex: 9999,
    elevation: 10,
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
  manualAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
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
    fontSize: 11,
    fontWeight: "700",
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
  searchResultsContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    zIndex: 9999,
    elevation: 10,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  quickOptionsScroll: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  stackedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stackedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  stackedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.TitleColor,
  },
  stackedSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
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

