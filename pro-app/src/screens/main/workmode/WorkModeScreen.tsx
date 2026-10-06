import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";
import { useUser } from "../../../context/UserContext";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { storage } from "../../../utils/storage";
import { StorageKeys } from "../../../constants";

const TRAVEL_RADII = [5, 10, 15, 25, 50];

export function WorkModeScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { user, updateUser } = useUser();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Work Mode Premises Flags
  const [provideInPremises, setProvideInPremises] = useState<boolean>(
    user.provideServicesinPremisis ?? true
  );
  const [provideInUserPremises, setProvideInUserPremises] = useState<boolean>(
    user.provideServicesinUserPrimisis ?? true
  );

  // Radius for mobile travel
  const [travelRadius, setTravelRadius] = useState<number>(15);

  // Target Clientele (1 = Barber, 2 = Stylist, 3 = Cleaner / Commercial)
  const [serviceFor, setServiceFor] = useState<number>(
    typeof user.serviceFor === "number" && user.serviceFor >= 0 ? user.serviceFor : 2
  );

  // Special Care / Seniors
  const [specialCare, setSpecialCare] = useState<boolean>(true);

  // Online Dispatch status
  const [isOnline, setIsOnline] = useState<boolean>(false);

  // Auto-accept bookings
  const [autoAccept, setAutoAccept] = useState<boolean>(false);

  const canGoBack = navigation.canGoBack();
  const isFromSettings = route?.params?.isFromSettings;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [statusRes, profileRes] = await Promise.all([
          api.getSPStatus().catch(() => ({ isSpOnline: false })),
          api.getSPProfile().catch(() => null),
        ]);

        setIsOnline(statusRes?.isSpOnline ?? false);

        if (profileRes) {
          const raw = profileRes as any;
          if (typeof raw.provideServiceInPremisis === "boolean") {
            setProvideInPremises(raw.provideServiceInPremisis);
          } else if (typeof raw.provideServicesinPremisis === "boolean") {
            setProvideInPremises(raw.provideServicesinPremisis);
          }

          if (typeof raw.provideServiceInUserPremisis === "boolean") {
            setProvideInUserPremises(raw.provideServiceInUserPremisis);
          } else if (typeof raw.provideServicesinUserPrimisis === "boolean") {
            setProvideInUserPremises(raw.provideServicesinUserPrimisis);
          }

          if (typeof raw.serviceFor === "number") {
            setServiceFor(raw.serviceFor);
          }
        }
      } catch (e) {
        // ignore load errors
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggleOnline = async (val: boolean) => {
    try {
      await api.updateStatus(val ? 1 : 0);
      setIsOnline(val);
    } catch (e: any) {
      showAlert("Error", e.message || "Failed to update online status");
    }
  };

  const handleSave = async () => {
    if (!provideInPremises && !provideInUserPremises) {
      showAlert(
        "Selection Required",
        "Please select at least one work mode (Salon Premises or Client Mobile Location)."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        provideServiceInPremises: provideInPremises,
        provideServiceInUserPremises: provideInUserPremises,
        provideServicesinPremisis: provideInPremises,
        provideServicesinUserPrimisis: provideInUserPremises,
        serviceFor,
        travelRadius,
        autoAccept,
      };

      try {
        await api.updateServicePreference(payload);
      } catch (apiErr) {
        console.warn("updateServicePreference fallback note:", apiErr);
      }

      try {
        await api.selectServiceFor({ serviceFor, userType: 2 });
      } catch (err) {}

      await updateUser({
        provideServicesinPremisis: provideInPremises,
        provideServicesinUserPrimisis: provideInUserPremises,
        serviceFor,
      });

      showAlert("Success", "Work mode and service preferences saved successfully!");

      if (isFromSettings && canGoBack) {
        navigation.goBack();
      }
    } catch (e: any) {
      showAlert("Error", e.message || "Failed to save work mode settings.");
    } finally {
      setSaving(false);
    }
  };

  const getModeSummaryText = () => {
    if (provideInPremises && provideInUserPremises) {
      return "Hybrid Mode: Salon & Mobile Visits";
    }
    if (provideInPremises) {
      return "Salon Premises Only (Clients visit you)";
    }
    if (provideInUserPremises) {
      return "Mobile House Calls Only (You travel to clients)";
    }
    return "No mode selected";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <Header
        title="Work Mode & Location"
        onBackPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            (navigation as any).navigate("Settings");
          }
        }}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.ButtonPrimaryColor} />
          <Text style={styles.loadingText}>Loading work mode preferences...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Banner / Status Overview */}
          <Card style={styles.bannerCard}>
            <View style={styles.bannerTopRow}>
              <View style={styles.bannerIconBox}>
                <Ionicons name="briefcase" size={24} color={Colors.ButtonPrimaryColor} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.bannerTitle}>Active Service Delivery</Text>
                <Text style={styles.bannerSubtitle}>{getModeSummaryText()}</Text>
              </View>
            </View>

            <View style={styles.activePillRow}>
              <View
                style={[
                  styles.activeModePill,
                  provideInPremises && styles.activeModePillSelected,
                ]}
              >
                <Ionicons
                  name="business"
                  size={14}
                  color={provideInPremises ? "#FFFFFF" : "#64748B"}
                />
                <Text
                  style={[
                    styles.activeModePillText,
                    provideInPremises && styles.activeModePillTextSelected,
                  ]}
                >
                  At My Salon
                </Text>
              </View>

              <View
                style={[
                  styles.activeModePill,
                  provideInUserPremises && styles.activeModePillSelected,
                ]}
              >
                <Ionicons
                  name="car"
                  size={14}
                  color={provideInUserPremises ? "#FFFFFF" : "#64748B"}
                />
                <Text
                  style={[
                    styles.activeModePillText,
                    provideInUserPremises && styles.activeModePillTextSelected,
                  ]}
                >
                  Mobile / House Calls
                </Text>
              </View>
            </View>
          </Card>

          {/* Section 1: Where do you provide services */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>WHERE YOU PROVIDE SERVICES</Text>
            <Text style={styles.sectionSub}>
              Enable one or both options to choose your job booking channels
            </Text>
          </View>

          {/* Option A: In-Premises (Salon / Studio) */}
          <Card
            style={[
              styles.modeCard,
              provideInPremises && styles.modeCardActive,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.modeIconCircle}>
                <Ionicons name="storefront" size={22} color={Colors.ButtonPrimaryColor} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.modeTitle}>At My Premises / Salon</Text>
                <Text style={styles.modeDescription}>
                  Customers come directly to your studio, barbershop, or designated facility.
                </Text>
              </View>
              <Switch
                value={provideInPremises}
                onValueChange={(val) => setProvideInPremises(val)}
                trackColor={{ false: "#CBD5E1", true: "#E5B652" }}
                thumbColor={provideInPremises ? Colors.ButtonPrimaryColor : "#FFFFFF"}
              />
            </View>

            {provideInPremises && (
              <View style={styles.premisesDetailBox}>
                <View style={styles.addressLabelRow}>
                  <Ionicons name="location" size={16} color={Colors.ButtonPrimaryColor} />
                  <Text style={styles.addressLabelText}>Registered Premises Address:</Text>
                </View>
                <Text style={styles.addressValueText}>
                  {user.permanentAddress || "No address specified on profile"}
                  {user.city ? `, ${user.city}` : ""}
                  {user.state ? `, ${user.state}` : ""}
                  {user.postalCode ? ` ${user.postalCode}` : ""}
                </Text>
                <TouchableOpacity
                  style={styles.changeAddressLink}
                  onPress={() =>
                    (navigation as any).navigate("Onboarding", {
                      screen: "PersonalInfo",
                      params: { isFromSettings: true },
                    })
                  }
                >
                  <Text style={styles.changeAddressLinkText}>Edit Salon Address & Map Pin</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.ButtonPrimaryColor} />
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Option B: User Premises (Mobile / Travel to Client) */}
          <Card
            style={[
              styles.modeCard,
              provideInUserPremises && styles.modeCardActive,
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={styles.modeIconCircle}>
                <Ionicons name="car-sport" size={22} color={Colors.ButtonPrimaryColor} />
              </View>
              <View style={{ flex: 1, marginHorizontal: 12 }}>
                <Text style={styles.modeTitle}>At Client's Location (Mobile)</Text>
                <Text style={styles.modeDescription}>
                  Travel to clients' residences, offices, or venues for on-demand services.
                </Text>
              </View>
              <Switch
                value={provideInUserPremises}
                onValueChange={(val) => setProvideInUserPremises(val)}
                trackColor={{ false: "#CBD5E1", true: "#E5B652" }}
                thumbColor={provideInUserPremises ? Colors.ButtonPrimaryColor : "#FFFFFF"}
              />
            </View>

            {provideInUserPremises && (
              <View style={styles.mobileDetailBox}>
                <Text style={styles.radiusLabel}>Maximum Travel Radius:</Text>
                <View style={styles.radiusChipsRow}>
                  {TRAVEL_RADII.map((radius) => (
                    <TouchableOpacity
                      key={radius}
                      style={[
                        styles.radiusChip,
                        travelRadius === radius && styles.radiusChipActive,
                      ]}
                      onPress={() => setTravelRadius(radius)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.radiusChipText,
                          travelRadius === radius && styles.radiusChipTextActive,
                        ]}
                      >
                        {radius} mi
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.radiusNote}>
                  You will receive on-demand and scheduled requests within {travelRadius} miles of your location.
                </Text>
              </View>
            )}
          </Card>

          {/* Section 2: Specialty Category & Role */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>PRIMARY SERVICE CATEGORY</Text>
            <Text style={styles.sectionSub}>Select the category that best describes your trade</Text>
          </View>

          <View style={styles.categoryGrid}>
            {[
              { id: 1, label: "Barber & Grooming", icon: "cut", desc: "Haircuts, beard trims & fades" },
              { id: 2, label: "Stylist & Salon", icon: "color-wand", desc: "Blowouts, styling, coloring" },
              { id: 3, label: "Cleaning Pro", icon: "sparkles", desc: "Residential & office sanitization" },
            ].map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  serviceFor === cat.id && styles.categoryCardActive,
                ]}
                onPress={() => setServiceFor(cat.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.categoryIconWrap,
                    serviceFor === cat.id && styles.categoryIconWrapActive,
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={serviceFor === cat.id ? "#FFFFFF" : Colors.ButtonPrimaryColor}
                  />
                </View>
                <Text
                  style={[
                    styles.categoryLabel,
                    serviceFor === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
                <Text style={styles.categorySub}>{cat.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Section 3: Booking & Availability Options */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeading}>DISPATCH & BOOKING CONTROLS</Text>
          </View>

          <Card style={styles.controlsCard}>
            <View style={styles.controlRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.controlTitle}>Live Online Status</Text>
                <Text style={styles.controlSub}>
                  Appear on customer live maps for instant appointments
                </Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
                thumbColor={isOnline ? "#16A34A" : "#FFFFFF"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.controlRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.controlTitle}>Auto-Confirm Instant Bookings</Text>
                <Text style={styles.controlSub}>
                  Automatically accept bookings that fit your availability schedule
                </Text>
              </View>
              <Switch
                value={autoAccept}
                onValueChange={(val) => setAutoAccept(val)}
                trackColor={{ false: "#CBD5E1", true: "#E5B652" }}
                thumbColor={autoAccept ? Colors.ButtonPrimaryColor : "#FFFFFF"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.controlRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.controlTitle}>Seniors & Special Needs Care</Text>
                <Text style={styles.controlSub}>
                  Accommodate senior citizens, mobility-impaired or sensitive clients
                </Text>
              </View>
              <Switch
                value={specialCare}
                onValueChange={(val) => setSpecialCare(val)}
                trackColor={{ false: "#CBD5E1", true: "#E5B652" }}
                thumbColor={specialCare ? Colors.ButtonPrimaryColor : "#FFFFFF"}
              />
            </View>
          </Card>

          {/* Bottom CTA */}
          <View style={styles.bottomCtaBox}>
            <Button
              title="Save Work Mode Preferences"
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: FontSizes.base,
    color: "#64748B",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
  },
  bannerCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.gold,
  },
  bannerTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  bannerSubtitle: {
    fontSize: FontSizes.sm,
    color: "#64748B",
    marginTop: 2,
  },
  activePillRow: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  activeModePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F1F5F9",
    gap: 6,
  },
  activeModePillSelected: {
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  activeModePillText: {
    fontSize: 12,
    fontWeight: FontWeights.medium,
    color: "#64748B",
  },
  activeModePillTextSelected: {
    color: "#FFFFFF",
  },
  sectionHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: "#64748B",
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  modeCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  modeCardActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: "#FFFFFF",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  modeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  modeTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  modeDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 16,
  },
  premisesDetailBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  addressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressLabelText: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: Colors.TitleColor,
  },
  addressValueText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 4,
    lineHeight: 18,
  },
  changeAddressLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  changeAddressLinkText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  mobileDetailBox: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  radiusLabel: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: Colors.TitleColor,
    marginBottom: 8,
  },
  radiusChipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  radiusChipActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  radiusChipText: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: "#475569",
  },
  radiusChipTextActive: {
    color: "#FFFFFF",
  },
  radiusNote: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
    lineHeight: 15,
  },
  categoryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: Spacing.md,
  },
  categoryCard: {
    flex: 1,
    padding: 12,
    borderRadius: BorderRadius.lg,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryCardActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: "#F8FAFF",
  },
  categoryIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryIconWrapActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    textAlign: "center",
  },
  categoryLabelActive: {
    color: Colors.ButtonPrimaryColor,
  },
  categorySub: {
    fontSize: 9,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 2,
  },
  controlsCard: {
    padding: Spacing.md,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  controlTitle: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  controlSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: Spacing.sm,
  },
  bottomCtaBox: {
    marginTop: Spacing.sm,
  },
  saveBtn: {
    backgroundColor: Colors.ButtonPrimaryColor,
    height: 52,
    borderRadius: BorderRadius.md,
  },
});
