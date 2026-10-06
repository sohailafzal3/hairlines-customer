import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  Switch,
  Alert,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import RNDateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { storage } from "../../../utils/storage";
import { StorageKeys } from "../../../constants";
import { useUser } from "../../../context/UserContext";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";
import { Slot } from "../../../types/models";
import { navigationRef } from "../../../navigation/navigationRef";

const DAYS_DATA = [
  { id: 1, name: "Mon", fullName: "Monday" },
  { id: 2, name: "Tue", fullName: "Tuesday" },
  { id: 3, name: "Wed", fullName: "Wednesday" },
  { id: 4, name: "Thu", fullName: "Thursday" },
  { id: 5, name: "Fri", fullName: "Friday" },
  { id: 6, name: "Sat", fullName: "Saturday" },
  { id: 7, name: "Sun", fullName: "Sunday" },
];

export function JobAvailabilityScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUser();

  const isFromSettings =
    route?.params?.isFromSettings ?? (user.isSignUpCompleted || false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State: Currently selected working days
  const [selectedDayIds, setSelectedDayIds] = useState<number[]>([1, 2, 3, 4, 5]);

  // Form State: From and To times (24h format HH:mm)
  const [fromTime, setFromTime] = useState<string>("09:00");
  const [toTime, setToTime] = useState<string>("17:00");

  // Slots List: Multiple schedules matching iOS dataSource.slots
  const [slots, setSlots] = useState<Slot[]>([]);

  // Time Picker State
  const [activePicker, setActivePicker] = useState<"from" | "to" | null>(null);
  const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());

  // Format HH:mm (24h) to 12h (e.g. 09:00 AM)
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

  // Convert Slot fields into 24h string
  const getSlotTimeString = (slot: Slot, isEnd: boolean) => {
    const hour = isEnd
      ? slot.closingHour ?? (slot as any).closingHours
      : slot.openingHour ?? (slot as any).openingsHours;
    const minute = isEnd
      ? slot.closingMinute ?? (slot as any).closingMinutes ?? 0
      : slot.openingMinute ?? (slot as any).openingsMinutes ?? 0;

    if (hour !== undefined && hour !== null) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }

    const unix = isEnd ? slot.closingUnixTime || slot.endTime : slot.openingUnixTime || slot.startTime;
    if (unix) {
      const ms = unix > 1e11 ? unix : unix * 1000;
      const d = new Date(ms);
      return formatDateToTime24(d);
    }

    return isEnd ? "17:00" : "09:00";
  };

  // Load Availability from Backend API
  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);

      // Check local cache
      try {
        const cached = await storage.get<Slot[]>(StorageKeys.userAvailability);
        if (Array.isArray(cached) && cached.length > 0) {
          setSlots(cached);
          if (cached[0]?.days?.length) {
            setSelectedDayIds(cached[0].days);
          }
          if (cached[0]) {
            setFromTime(getSlotTimeString(cached[0], false));
            setToTime(getSlotTimeString(cached[0], true));
          }
        }
      } catch {}

      const res = await api.getAvailabilitySlots();
      let remoteSlots: Slot[] = [];

      if (res && Array.isArray((res as any).slots)) {
        remoteSlots = (res as any).slots;
      } else if (res && Array.isArray((res as any).data?.slots)) {
        remoteSlots = (res as any).data.slots;
      } else if (res && Array.isArray(res)) {
        remoteSlots = res as Slot[];
      }

      if (remoteSlots.length > 0) {
        setSlots(remoteSlots);
        await storage.set(StorageKeys.userAvailability, remoteSlots);

        const first = remoteSlots[0];
        if (Array.isArray(first.days) && first.days.length > 0) {
          setSelectedDayIds(first.days.sort((a, b) => a - b));
        }
        setFromTime(getSlotTimeString(first, false));
        setToTime(getSlotTimeString(first, true));
      } else if (slots.length === 0) {
        // Default initial slot (Monday - Friday, 9:00 AM - 5:00 PM)
        const initialSlot: Slot = {
          id: "slot_init",
          _id: "slot_init",
          days: [1, 2, 3, 4, 5],
          openingHour: 9,
          openingMinute: 0,
          closingHour: 17,
          closingMinute: 0,
          isEnabled: true,
        };
        setSlots([initialSlot]);
      }
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        console.warn("Failed to load availability slots:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Toggle Day Selection
  const handleToggleDay = (dayId: number) => {
    setSelectedDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId].sort((a, b) => a - b)
    );
  };

  // Add Schedule Button Tapped (matching SlotTableViewCell addScheduleButton)
  const handleAddSchedule = () => {
    if (selectedDayIds.length === 0) {
      showAlert("Required", "Please select at least one working day.");
      return;
    }

    const [sh, sm] = fromTime.split(":").map((v) => Number(v) || 0);
    const [eh, em] = toTime.split(":").map((v) => Number(v) || 0);

    const today = new Date();
    const sDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0);
    const eDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0);

    const newSlot: Slot = {
      id: `slot_${Date.now()}`,
      _id: `slot_${Date.now()}`,
      days: [...selectedDayIds],
      openingHour: sh,
      openingMinute: sm,
      closingHour: eh,
      closingMinute: em,
      startTime: Math.floor(sDate.getTime() / 1000),
      endTime: Math.floor(eDate.getTime() / 1000),
      isEnabled: true,
    };

    setSlots((prev) => [...prev, newSlot]);
    showAlert("Slot Added", "New availability schedule slot has been added to your list.");
  };

  // Toggle Slot Active Switch (matching JobAvailabilityListingTableViewCell switch)
  const handleToggleSlotSwitch = (index: number) => {
    setSlots((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  // Delete Slot Action
  const handleDeleteSlot = (index: number) => {
    Alert.alert("Delete Slot", "Are you sure you want to delete this schedule slot?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setSlots((prev) => prev.filter((_, idx) => idx !== index));
        },
      },
    ]);
  };

  // Time Picker Handlers
  const openTimePicker = (type: "from" | "to") => {
    const current = type === "from" ? fromTime : toTime;
    setTempPickerDate(parseTimeToDate(current));
    setActivePicker(type);
  };

  const onNativePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setActivePicker(null);
      if (event.type === "set" && selected) {
        const timeStr = formatDateToTime24(selected);
        if (activePicker === "from") {
          setFromTime(timeStr);
        } else if (activePicker === "to") {
          setToTime(timeStr);
        }
      }
    } else if (selected) {
      setTempPickerDate(selected);
    }
  };

  const confirmIosPicker = () => {
    const timeStr = formatDateToTime24(tempPickerDate);
    if (activePicker === "from") {
      setFromTime(timeStr);
    } else if (activePicker === "to") {
      setToTime(timeStr);
    }
    setActivePicker(null);
  };

  // Save / Update Slots to Backend (matching continueButtonTapped)
  const handleSaveOrContinue = async () => {
    // If no slots exist yet, create one from current day/time fields
    let currentSlots = [...slots];
    if (currentSlots.length === 0) {
      if (selectedDayIds.length === 0) {
        showAlert("Required", "Please select at least one working day.");
        return;
      }
      const [sh, sm] = fromTime.split(":").map((v) => Number(v) || 0);
      const [eh, em] = toTime.split(":").map((v) => Number(v) || 0);
      const today = new Date();
      const sDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0);
      const eDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0);
      currentSlots = [
        {
          id: `slot_${Date.now()}`,
          _id: `slot_${Date.now()}`,
          days: selectedDayIds,
          openingHour: sh,
          openingMinute: sm,
          closingHour: eh,
          closingMinute: em,
          startTime: Math.floor(sDate.getTime() / 1000),
          endTime: Math.floor(eDate.getTime() / 1000),
          isEnabled: true,
        },
      ];
      setSlots(currentSlots);
    }

    try {
      setSubmitting(true);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const formattedSlots = currentSlots.map((s) => {
        const [sh, sm] = getSlotTimeString(s, false).split(":").map((v) => Number(v) || 0);
        const [eh, em] = getSlotTimeString(s, true).split(":").map((v) => Number(v) || 0);
        const today = new Date();
        const sDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0);
        const eDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0);

        return {
          _id: s._id?.startsWith("slot_") ? undefined : s._id,
          days: s.days || selectedDayIds,
          openingsHours: sh === 24 ? 0 : sh,
          openingsMinutes: sm,
          closingHours: eh === 24 ? 0 : eh,
          closingMinutes: em,
          startTime: Math.floor(sDate.getTime() / 1000),
          endTime: Math.floor(eDate.getTime() / 1000),
          isEnabled: s.isEnabled ?? true,
        };
      });

      const payload = {
        slots: formattedSlots,
        timeZone,
      };

      try {
        await api.updateAvailability(payload);
      } catch (err) {
        await api.addAvailability(payload);
      }

      await storage.set(StorageKeys.userAvailability, currentSlots);

      if (!isFromSettings) {
        await updateUser({ signUpStepCompleted: Math.max(user.signUpStepCompleted, 7) });
        showAlert("Success", "Availability schedule configured successfully.");
        navigation.navigate("ThankYou");
      } else {
        showAlert("Success", "Availability updated successfully.");
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else if (navigationRef.isReady()) {
          navigationRef.navigate("Main", { screen: "Settings" } as any);
        }
      }
    } catch (e: any) {
      showAlert("Error", e.message || "Failed to update availability schedule.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (isFromSettings) {
      (navigation as any).navigate("Settings");
    } else {
      (navigation as any).navigate("BankingLanguages");
    }
  };

  // Summary string of selected days: "Every Monday, Tuesday, ..."
  const selectedDaysSummaryText =
    selectedDayIds.length > 0
      ? `Every ${DAYS_DATA.filter((d) => selectedDayIds.includes(d.id))
          .map((d) => d.fullName)
          .join(", ")}`
      : "";

  return (
    <View style={styles.container}>
      {/* Navigation Header matching iOS JobAvailabilityViewController */}
      <Header
        title="Job Availability"
        onBackPress={handleBack}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 85, 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading || submitting} />

        {/* 1. Working Days Section (matching WorkingDaysTableViewCell.xib) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderLabel}>Select Working Days</Text>

          {/* 7 Days Row */}
          <View style={styles.daysRow}>
            {DAYS_DATA.map((day) => {
              const isSelected = selectedDayIds.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                  onPress={() => handleToggleDay(day.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextSelected,
                    ]}
                  >
                    {day.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* "Every Monday, Tuesday..." Label */}
          {selectedDaysSummaryText ? (
            <Text style={styles.selectedDaysSummary} numberOfLines={2}>
              {selectedDaysSummaryText}
            </Text>
          ) : null}

          {/* Section Divider Line */}
          <View style={styles.sectionDivider} />
        </View>

        {/* 2. Weekly Schedule / Time Slot Section (matching SlotTableViewCell.xib) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderLabel}>Weekly Schedule</Text>

          {/* From & To Time Input Boxes */}
          <View style={styles.timeInputsRow}>
            {/* From Input */}
            <TouchableOpacity
              style={styles.timeInputBox}
              onPress={() => openTimePicker("from")}
              activeOpacity={0.8}
            >
              <Text style={styles.timeInputTag}>From</Text>
              <Text style={styles.timeInputValue}>{formatTime12h(fromTime)}</Text>
            </TouchableOpacity>

            {/* To Input */}
            <TouchableOpacity
              style={styles.timeInputBox}
              onPress={() => openTimePicker("to")}
              activeOpacity={0.8}
            >
              <Text style={styles.timeInputTag}>To</Text>
              <Text style={styles.timeInputValue}>{formatTime12h(toTime)}</Text>
            </TouchableOpacity>
          </View>

          {/* Add Schedule Button (matching SlotTableViewCell.addScheduleButton) */}
          <TouchableOpacity
            style={styles.addScheduleButton}
            onPress={handleAddSchedule}
            activeOpacity={0.7}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.addScheduleButtonText}>Add Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Configured Slots Listing (matching JobAvailabilityListingTableViewCell.xib) */}
        {slots.length > 0 && (
          <View style={styles.listingSection}>
            <Text style={styles.listingHeaderLabel}>
              Configured Schedules ({slots.length})
            </Text>

            {slots.map((slot, index) => {
              const start12 = formatTime12h(getSlotTimeString(slot, false));
              const end12 = formatTime12h(getSlotTimeString(slot, true));
              const isEnabled = slot.isEnabled ?? true;
              const slotDays = slot.days || [];

              return (
                <View
                  key={slot._id || slot.id || index}
                  style={[styles.listingCell, !isEnabled && styles.listingCellDisabled]}
                >
                  <View style={styles.listingContentWrap}>
                    {/* Time Label: "09:00 AM to 01:00 PM" */}
                    <Text style={styles.listingTimeText}>
                      <Text style={styles.listingTimeBold}>{start12}</Text>
                      <Text style={styles.listingTimeTo}> to </Text>
                      <Text style={styles.listingTimeBold}>{end12}</Text>
                    </Text>

                    {/* Small Days Badges Collection */}
                    <View style={styles.listingDaysRow}>
                      {DAYS_DATA.map((d) => {
                        const hasDay = slotDays.includes(d.id);
                        if (!hasDay) return null;
                        return (
                          <View key={d.id} style={styles.listingDayBadge}>
                            <Text style={styles.listingDayBadgeText}>{d.name}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Switch & Delete Controls */}
                  <View style={styles.listingActionsWrap}>
                    <Switch
                      value={isEnabled}
                      onValueChange={() => handleToggleSlotSwitch(index)}
                      trackColor={{ false: "#E2E8F0", true: "#FDE68A" }}
                      thumbColor={isEnabled ? Colors.ButtonPrimaryColor : "#FFFFFF"}
                      style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                    />
                    <TouchableOpacity
                      onPress={() => handleDeleteSlot(index)}
                      style={styles.listingDeleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={17} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Continue / Update Button (matching TradesMenButton continueButton) */}
      <View
        style={[
          styles.bottomButtonContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title={isSignUpCompletedMode(isFromSettings) ? "UPDATE" : "CONTINUE"}
          onPress={handleSaveOrContinue}
          loading={submitting}
          style={styles.submitButton}
        />
      </View>

      {/* Native iOS Picker Modal */}
      {Platform.OS === "ios" && (
        <Modal
          visible={activePicker !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setActivePicker(null)}
        >
          <View style={styles.pickerBackdrop}>
            <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={() => setActivePicker(null)}>
                  <Text style={styles.pickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>
                  Select {activePicker === "from" ? "Start Time" : "End Time"}
                </Text>
                <TouchableOpacity onPress={confirmIosPicker}>
                  <Text style={styles.pickerDone}>Done</Text>
                </TouchableOpacity>
              </View>

              <RNDateTimePicker
                value={tempPickerDate}
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

      {/* Android Native Picker */}
      {Platform.OS === "android" && activePicker !== null && (
        <RNDateTimePicker
          value={tempPickerDate}
          mode="time"
          display="default"
          onChange={onNativePickerChange}
        />
      )}
    </View>
  );
}

function isSignUpCompletedMode(isFromSettings: boolean) {
  return isFromSettings;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  sectionHeaderLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#323136",
    marginBottom: 14,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dayButton: {
    width: 42,
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#DDD",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  dayButtonSelected: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  dayButtonText: {
    fontSize: 12,
    color: "#323136",
    fontWeight: "400",
  },
  dayButtonTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  selectedDaysSummary: {
    fontSize: 12,
    color: "#999999",
    lineHeight: 18,
    marginBottom: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginTop: 6,
  },
  timeInputsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  timeInputBox: {
    flex: 1,
    height: 64,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
  },
  timeInputTag: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 2,
  },
  timeInputValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#323136",
  },
  addScheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  addIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: "center",
    alignItems: "center",
  },
  addScheduleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#323136",
  },
  listingSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  listingHeaderLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listingCell: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
  },
  listingCellDisabled: {
    opacity: 0.6,
    backgroundColor: "#F8FAFC",
  },
  listingContentWrap: {
    flex: 1,
  },
  listingTimeText: {
    fontSize: 15,
    marginBottom: 6,
  },
  listingTimeBold: {
    color: "#1E293B",
    fontWeight: "600",
  },
  listingTimeTo: {
    color: "#94A3B8",
    fontWeight: "400",
  },
  listingDaysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  listingDayBadge: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listingDayBadgeText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "500",
  },
  listingActionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  listingDeleteBtn: {
    padding: 6,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitButton: {
    height: 50,
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: 4,
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.base,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  pickerCancel: {
    fontSize: FontSizes.sm,
    color: "#64748B",
  },
  pickerTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: "#1E293B",
  },
  pickerDone: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
});
