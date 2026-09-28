import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Availability">;

const DAYS = [
  { id: 1, short: "Mon", full: "Monday" },
  { id: 2, short: "Tue", full: "Tuesday" },
  { id: 3, short: "Wed", full: "Wednesday" },
  { id: 4, short: "Thu", full: "Thursday" },
  { id: 5, short: "Fri", full: "Friday" },
  { id: 6, short: "Sat", full: "Saturday" },
  { id: 7, short: "Sun", full: "Sunday" },
];

export function AvailabilityScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const isFromSettings =
    route.params?.isFromSettings || user.isSignUpCompleted;

  const toggleDay = (id: number) => {
    setSelectedDays((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id].sort((a, b) => a - b)
    );
  };

  const selectAllWeekdays = () => {
    setSelectedDays([1, 2, 3, 4, 5]);
  };

  const selectAllDays = () => {
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
  };

  const submit = async () => {
    if (selectedDays.length === 0) {
      showAlert("Required", "Please select at least one working day.");
      return;
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime.trim())) {
      showAlert("Invalid Time", "Please enter a valid start time in HH:MM format (e.g. 09:00).");
      return;
    }
    if (!timeRegex.test(endTime.trim())) {
      showAlert("Invalid Time", "Please enter a valid end time in HH:MM format (e.g. 18:00).");
      return;
    }

    try {
      setLoading(true);
      const [sh, sm] = startTime.split(":").map((v) => Number(v) || 0);
      const [eh, em] = endTime.split(":").map((v) => Number(v) || 0);

      const timeZone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const today = new Date();
      const startDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        sh,
        sm,
        0
      );
      const endDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        eh,
        em,
        0
      );

      const slots = [
        {
          days: selectedDays,
          openingsHours: sh === 24 ? 0 : sh,
          openingsMinutes: sm,
          closingHours: eh === 24 ? 0 : eh,
          closingMinutes: em,
          startTime: Math.floor(startDate.getTime() / 1000),
          endTime: Math.floor(endDate.getTime() / 1000),
          isEnabled: true,
        },
      ];

      await api.addAvailability({
        slots,
        timeZone,
      });

      if (isFromSettings) {
        showAlert("Success", "Your availability schedule has been updated.");
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("BankingLanguages");
        }
      } else {
        navigation.navigate("ThankYou");
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("BankingLanguages");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Job Availability" onBackPress={handleBack} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading} />

        <Text style={styles.headerTitle}>Set Your Schedule</Text>
        <Text style={styles.headerSubtitle}>
          Choose the days and hours you are available to accept service appointments.
        </Text>

        {/* Working Days Card */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.titleWithIcon}>
              <Ionicons name="calendar-outline" size={20} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.cardSectionTitle}>Working Days</Text>
            </View>
            <View style={styles.presetButtonsRow}>
              <TouchableOpacity onPress={selectAllWeekdays} style={styles.presetBtn}>
                <Text style={styles.presetBtnText}>Mon-Fri</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={selectAllDays} style={styles.presetBtn}>
                <Text style={styles.presetBtnText}>All Days</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.daysRow}>
            {DAYS.map((day) => {
              const isSelected = selectedDays.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayChip, isSelected && styles.dayChipSelected]}
                  onPress={() => toggleDay(day.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      isSelected && styles.dayChipTextSelected,
                    ]}
                  >
                    {day.short}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.selectedDaysSummary}>
            {selectedDays.length === 0
              ? "No days selected"
              : `Selected ${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""}: ${selectedDays
                  .map((d) => DAYS.find((item) => item.id === d)?.short)
                  .join(", ")}`}
          </Text>
        </View>

        {/* Working Hours Card */}
        <View style={styles.cardSection}>
          <View style={styles.titleWithIcon}>
            <Ionicons name="time-outline" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.cardSectionTitle}>Working Hours</Text>
          </View>
          <Text style={styles.cardSectionSub}>
            Enter your typical daily operating hours (24h or HH:MM format):
          </Text>

          <View style={styles.timeInputsRow}>
            <View style={styles.timeInputWrap}>
              <Input
                label="Start Time"
                value={startTime}
                onChangeText={setStartTime}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.timeInputWrap}>
              <Input
                label="End Time"
                value={endTime}
                onChangeText={setEndTime}
                placeholder="18:00"
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Pinned Bottom Button */}
      <View
        style={[
          styles.footerWrap,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title={isFromSettings ? "Update Availability Schedule" : "Complete Onboarding"}
          onPress={submit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.lg,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardSectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  cardSectionSub: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  presetButtonsRow: {
    flexDirection: "row",
    gap: 6,
  },
  presetBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F1F5F9",
  },
  presetBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.ButtonPrimaryColor,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  dayChip: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 3,
  },
  dayChipSelected: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  dayChipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: "#64748B",
  },
  dayChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: FontWeights.bold,
  },
  selectedDaysSummary: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    fontStyle: "italic",
    marginTop: 4,
  },
  timeInputsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  timeInputWrap: {
    flex: 1,
  },
  footerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
});

