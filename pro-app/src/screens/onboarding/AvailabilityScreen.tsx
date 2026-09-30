import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";
import { navigationRef } from "../../navigation/navigationRef";
import { storage } from "../../utils/storage";
import { StorageKeys } from "../../constants";

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

const TIME_PRESETS = [
  { label: "9 AM - 5 PM", start: "09:00", end: "17:00" },
  { label: "8 AM - 6 PM", start: "08:00", end: "18:00" },
  { label: "10 AM - 7 PM", start: "10:00", end: "19:00" },
  { label: "8 AM - 8 PM", start: "08:00", end: "20:00" },
];

export function AvailabilityScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [slotId, setSlotId] = useState<string>("");

  // TimePicker State
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const isFromSettings =
    route.params?.isFromSettings || user.isSignUpCompleted;

  // Helpers for Time Conversion
  const formatTime12h = (time24: string) => {
    if (!time24) return "09:00 AM";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10) || 0;
    const m = (mStr || "00").padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
  };

  const parseTimeToDate = (time24: string) => {
    const [hStr, mStr] = time24.split(":");
    const d = new Date();
    d.setHours(parseInt(hStr, 10) || 9, parseInt(mStr, 10) || 0, 0, 0);
    return d;
  };

  const formatDateToTime24 = (d: Date) => {
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const openTimePicker = (type: "start" | "end") => {
    const currentTimeStr = type === "start" ? startTime : endTime;
    setTempDate(parseTimeToDate(currentTimeStr));
    setActivePicker(type);
  };

  const onNativePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setActivePicker(null);
      if (event.type === "set" && selected) {
        const timeStr = formatDateToTime24(selected);
        if (activePicker === "start") {
          setStartTime(timeStr);
        } else if (activePicker === "end") {
          setEndTime(timeStr);
        }
      }
    } else if (selected) {
      setTempDate(selected);
    }
  };

  const confirmIosPicker = () => {
    const timeStr = formatDateToTime24(tempDate);
    if (activePicker === "start") {
      setStartTime(timeStr);
    } else if (activePicker === "end") {
      setEndTime(timeStr);
    }
    setActivePicker(null);
  };

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

  const applyPreset = (preset: { start: string; end: string }) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  // Load Availability from Cache & Remote API
  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Try local storage cache only if from Settings
      if (isFromSettings) {
        try {
          const cached = await storage.get<{
            selectedDays?: number[];
            startTime?: string;
            endTime?: string;
            slotId?: string;
          }>(StorageKeys.userAvailability);
          if (cached) {
            if (Array.isArray(cached.selectedDays) && cached.selectedDays.length > 0) {
              setSelectedDays(cached.selectedDays);
            }
            if (cached.startTime) setStartTime(cached.startTime);
            if (cached.endTime) setEndTime(cached.endTime);
            if (cached.slotId) setSlotId(cached.slotId);
          }
        } catch {}
      } else {
        setSelectedDays([1, 2, 3, 4, 5]);
        setStartTime("09:00");
        setEndTime("18:00");
        setSlotId("");
      }

      // 2. Fetch from backend API
      try {
        const res = await api.getAvailabilitySlots();
        let slotsList: any[] = [];
        if (res && Array.isArray((res as any).slots)) {
          slotsList = (res as any).slots;
        } else if (res && Array.isArray((res as any).data?.slots)) {
          slotsList = (res as any).data.slots;
        } else if (res && Array.isArray(res)) {
          slotsList = res;
        }

        if (slotsList.length > 0) {
          const slot = slotsList[0];
          if (slot._id) setSlotId(slot._id);
          if (Array.isArray(slot.days) && slot.days.length > 0) {
            setSelectedDays(slot.days.sort((a: number, b: number) => a - b));
          }

          let sHour = slot.openingsHours ?? slot.openingHour ?? slot.openingHours;
          let sMin = slot.openingsMinutes ?? slot.openingMinute ?? slot.openingMinutes ?? 0;
          let eHour = slot.closingHours ?? slot.closingHour ?? slot.closingHours;
          let eMin = slot.closingMinutes ?? slot.closingMinute ?? slot.closingMinutes ?? 0;

          if (sHour === undefined && slot.startTime) {
            const sd = new Date(slot.startTime > 1e11 ? slot.startTime : slot.startTime * 1000);
            sHour = sd.getHours();
            sMin = sd.getMinutes();
          }
          if (eHour === undefined && slot.endTime) {
            const ed = new Date(slot.endTime > 1e11 ? slot.endTime : slot.endTime * 1000);
            eHour = ed.getHours();
            eMin = ed.getMinutes();
          }

          if (sHour !== undefined) {
            const sTimeStr = `${String(sHour).padStart(2, "0")}:${String(sMin).padStart(2, "0")}`;
            setStartTime(sTimeStr);
          }
          if (eHour !== undefined) {
            const eTimeStr = `${String(eHour).padStart(2, "0")}:${String(eMin).padStart(2, "0")}`;
            setEndTime(eTimeStr);
          }
        }
      } catch (apiErr) {
        console.log("Error fetching availability slots:", apiErr);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAvailability();
    }, [loadAvailability])
  );

  const submit = async () => {
    if (selectedDays.length === 0) {
      showAlert("Required", "Please select at least one working day.");
      return;
    }

    try {
      setSubmitting(true);
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

      const slotObj: any = {
        days: selectedDays,
        openingsHours: sh === 24 ? 0 : sh,
        openingsMinutes: sm,
        closingHours: eh === 24 ? 0 : eh,
        closingMinutes: em,
        startTime: Math.floor(startDate.getTime() / 1000),
        endTime: Math.floor(endDate.getTime() / 1000),
        isEnabled: true,
      };

      if (slotId) {
        slotObj._id = slotId;
      }

      const payload = {
        slots: [slotObj],
        timeZone,
      };

      try {
        if (slotId || isFromSettings) {
          await api.updateAvailability(payload);
        } else {
          await api.addAvailability(payload);
        }
      } catch (err) {
        // Fallback to addAvailability
        await api.addAvailability(payload);
      }

      // Save locally
      await storage.set(StorageKeys.userAvailability, {
        selectedDays,
        startTime,
        endTime,
        slotId,
      });

      if (isFromSettings) {
        showAlert("Success", "Your availability schedule has been updated.");
        if (navigationRef.isReady()) {
          navigationRef.navigate("Main", { screen: "Settings" } as any);
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          (navigation as any).navigate("Settings");
        }
      } else {
        navigation.navigate("ThankYou");
      }
    } catch (e: any) {
      showAlert("Error", e.message || "Failed to update availability schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isFromSettings) {
      if (navigationRef.isReady()) {
        navigationRef.navigate("Main", { screen: "Settings" } as any);
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        (navigation as any).navigate("Settings");
      }
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("BankingLanguages");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Job Availability" onBackPress={handleBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <LoadingOverlay visible={loading || submitting} />

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
              Tap below to choose your start and end hours:
            </Text>

            {/* Start & End Time Pickers */}
            <View style={styles.timeCardsRow}>
              <TouchableOpacity
                style={styles.timeCard}
                onPress={() => openTimePicker("start")}
                activeOpacity={0.85}
              >
                <View style={styles.timeCardHeader}>
                  <Text style={styles.timeCardLabel}>START TIME</Text>
                  <Ionicons name="time" size={16} color={Colors.ButtonPrimaryColor} />
                </View>
                <Text style={styles.timeCardValue}>{formatTime12h(startTime)}</Text>
                <View style={styles.timeCardBadge}>
                  <Text style={styles.timeCardBadgeText}>Tap to set</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.timeCardArrow}>
                <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
              </View>

              <TouchableOpacity
                style={styles.timeCard}
                onPress={() => openTimePicker("end")}
                activeOpacity={0.85}
              >
                <View style={styles.timeCardHeader}>
                  <Text style={styles.timeCardLabel}>END TIME</Text>
                  <Ionicons name="time" size={16} color={Colors.ButtonPrimaryColor} />
                </View>
                <Text style={styles.timeCardValue}>{formatTime12h(endTime)}</Text>
                <View style={styles.timeCardBadge}>
                  <Text style={styles.timeCardBadgeText}>Tap to set</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Shift Presets */}
            <Text style={[styles.cardSectionSub, { marginTop: Spacing.md, marginBottom: 6 }]}>
              Quick Shift Presets:
            </Text>
            <View style={styles.timePresetsGrid}>
              {TIME_PRESETS.map((p, idx) => {
                const isActive = startTime === p.start && endTime === p.end;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.timePresetChip, isActive && styles.timePresetChipActive]}
                    onPress={() => applyPreset(p)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.timePresetChipText,
                        isActive && styles.timePresetChipTextActive,
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        {/* Action Button */}
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
      </KeyboardAvoidingView>

      {/* Native iOS Picker Modal */}
      {Platform.OS === "ios" && (
        <Modal
          visible={activePicker !== null}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setActivePicker(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setActivePicker(null)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  Select {activePicker === "start" ? "Start Time" : "End Time"}
                </Text>
                <TouchableOpacity onPress={confirmIosPicker}>
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>

              <RNDateTimePicker
                value={tempDate}
                mode="time"
                display="spinner"
                onChange={onNativePickerChange}
                textColor="#0F172A"
                style={{ height: 180 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Android DateTimePicker */}
      {Platform.OS === "android" && activePicker !== null && (
        <RNDateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          onChange={onNativePickerChange}
        />
      )}

      {/* Web TimePicker Modal */}
      {Platform.OS === "web" && (
        <Modal
          visible={activePicker !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActivePicker(null)}
        >
          <View style={styles.webModalOverlay}>
            <View style={styles.webModalCard}>
              <Text style={styles.webModalTitle}>
                Set {activePicker === "start" ? "Start Time" : "End Time"}
              </Text>

              <View style={styles.webTimeSelectRow}>
                {/* Hours 1-12 */}
                <ScrollView style={styles.webWheelCol} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
                    const currentHours = tempDate.getHours();
                    const current12h = currentHours % 12 === 0 ? 12 : currentHours % 12;
                    const isSelected = current12h === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[styles.webWheelItem, isSelected && styles.webWheelItemSelected]}
                        onPress={() => {
                          const isPm = tempDate.getHours() >= 12;
                          const newHours = isPm ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
                          const nextD = new Date(tempDate);
                          nextD.setHours(newHours);
                          setTempDate(nextD);
                        }}
                      >
                        <Text style={[styles.webWheelText, isSelected && styles.webWheelTextSelected]}>
                          {String(h).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.webColon}>:</Text>

                {/* Minutes 00, 15, 30, 45 */}
                <ScrollView style={styles.webWheelCol} showsVerticalScrollIndicator={false}>
                  {[0, 15, 30, 45].map((m) => {
                    const isSelected = tempDate.getMinutes() === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.webWheelItem, isSelected && styles.webWheelItemSelected]}
                        onPress={() => {
                          const nextD = new Date(tempDate);
                          nextD.setMinutes(m);
                          setTempDate(nextD);
                        }}
                      >
                        <Text style={[styles.webWheelText, isSelected && styles.webWheelTextSelected]}>
                          {String(m).padStart(2, "0")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* AM / PM Toggle */}
                <View style={styles.webAmPmCol}>
                  {["AM", "PM"].map((ampm) => {
                    const isSelected =
                      ampm === "AM" ? tempDate.getHours() < 12 : tempDate.getHours() >= 12;
                    return (
                      <TouchableOpacity
                        key={ampm}
                        style={[styles.webAmPmBtn, isSelected && styles.webAmPmBtnSelected]}
                        onPress={() => {
                          const currentH = tempDate.getHours();
                          const nextD = new Date(tempDate);
                          if (ampm === "AM" && currentH >= 12) {
                            nextD.setHours(currentH - 12);
                          } else if (ampm === "PM" && currentH < 12) {
                            nextD.setHours(currentH + 12);
                          }
                          setTempDate(nextD);
                        }}
                      >
                        <Text style={[styles.webAmPmText, isSelected && styles.webAmPmTextSelected]}>
                          {ampm}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.webModalActions}>
                <TouchableOpacity
                  style={styles.webCancelBtn}
                  onPress={() => setActivePicker(null)}
                >
                  <Text style={styles.webCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.webConfirmBtn} onPress={confirmIosPicker}>
                  <Text style={styles.webConfirmBtnText}>Apply Time</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  timeCardsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  timeCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: Spacing.md,
  },
  timeCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  timeCardLabel: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.5,
  },
  timeCardValue: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  timeCardBadge: {
    marginTop: 6,
    backgroundColor: "#EFF6FF",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  timeCardBadgeText: {
    fontSize: 9,
    fontWeight: FontWeights.semibold,
    color: Colors.ButtonPrimaryColor,
  },
  timeCardArrow: {
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  timePresetsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  timePresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timePresetChipActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  timePresetChipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.TitleColor,
  },
  timePresetChipTextActive: {
    color: "#FFFFFF",
    fontWeight: FontWeights.bold,
  },
  footerWrap: {
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
  // iOS Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  modalCancelText: {
    fontSize: FontSizes.sm,
    color: "#64748B",
    fontWeight: FontWeights.medium,
  },
  modalDoneText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  // Web Modal
  webModalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  webModalCard: {
    width: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  webModalTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  webTimeSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 160,
    gap: 8,
  },
  webWheelCol: {
    width: 60,
    height: 150,
  },
  webWheelItem: {
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  webWheelItemSelected: {
    backgroundColor: "#EFF6FF",
  },
  webWheelText: {
    fontSize: FontSizes.base,
    color: "#64748B",
  },
  webWheelTextSelected: {
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  webColon: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  webAmPmCol: {
    gap: 8,
  },
  webAmPmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  webAmPmBtnSelected: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  webAmPmText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.TitleColor,
  },
  webAmPmTextSelected: {
    color: "#FFFFFF",
  },
  webModalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: Spacing.lg,
  },
  webCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  webCancelBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "#64748B",
  },
  webConfirmBtn: {
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  webConfirmBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
  },
});

