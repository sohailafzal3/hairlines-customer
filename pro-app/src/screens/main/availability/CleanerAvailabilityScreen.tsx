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
import { EmptyState } from "../../../components/EmptyState";
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

const DAYS = [
  { id: 1, short: "M", label: "Mon", full: "Monday" },
  { id: 2, short: "T", label: "Tue", full: "Tuesday" },
  { id: 3, short: "W", label: "Wed", full: "Wednesday" },
  { id: 4, short: "T", label: "Thu", full: "Thursday" },
  { id: 5, short: "F", label: "Fri", full: "Friday" },
  { id: 6, short: "S", label: "Sat", full: "Saturday" },
  { id: 7, short: "S", label: "Sun", full: "Sunday" },
];

const TIME_PRESETS = [
  { label: "9 AM - 5 PM", start: "09:00", end: "17:00" },
  { label: "8 AM - 6 PM", start: "08:00", end: "18:00" },
  { label: "10 AM - 7 PM", start: "10:00", end: "19:00" },
  { label: "8 AM - 8 PM", start: "08:00", end: "20:00" },
];

export function CleanerAvailabilityScreen({ route, navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUser();

  const isFromSettings = route?.params?.isFromSettings ?? true;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<Slot[]>([]);

  // Add / Edit Slot Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [newSelectedDays, setNewSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("17:00");

  // Date/Time Picker State
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Format HH:mm (24h) to 12h format
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

  // Convert Unix time or hour/min from slot into 24h string
  const getSlotTimeString = (slot: Slot, isEnd = false) => {
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

  // Load Availability Slots from Backend
  const loadAvailability = useCallback(async () => {
    try {
      setLoading(true);

      // Check cache first
      try {
        const cached = await storage.get<Slot[]>("cleaner_availability_slots");
        if (Array.isArray(cached) && cached.length > 0) {
          setSlots(cached);
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
        await storage.set("cleaner_availability_slots", remoteSlots);
      } else if (slots.length === 0) {
        // Default seed slot
        const defaultSlot: Slot = {
          id: "default_1",
          _id: "default_1",
          days: [1, 2, 3, 4, 5],
          openingHour: 9,
          openingMinute: 0,
          closingHour: 17,
          closingMinute: 0,
          isEnabled: true,
        };
        setSlots([defaultSlot]);
      }
    } catch (err: any) {
      if (err?.response?.status !== 401) {
        console.warn("Failed to load cleaner availability slots:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  // Toggle slot active/inactive switch
  const handleToggleSlot = (index: number) => {
    setSlots((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, isEnabled: !s.isEnabled } : s))
    );
  };

  // Delete slot
  const handleDeleteSlot = (index: number) => {
    Alert.alert(
      "Delete Schedule",
      "Are you sure you want to delete this availability slot?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setSlots((prev) => prev.filter((_, idx) => idx !== index));
          },
        },
      ]
    );
  };

  // Open slot builder
  const handleOpenAddSlot = () => {
    setEditingSlotId(null);
    setNewSelectedDays([1, 2, 3, 4, 5]);
    setNewStartTime("09:00");
    setNewEndTime("17:00");
    setModalVisible(true);
  };

  const handleOpenEditSlot = (slot: Slot, index: number) => {
    setEditingSlotId(slot._id || slot.id || String(index));
    setNewSelectedDays(slot.days || [1, 2, 3, 4, 5]);
    setNewStartTime(getSlotTimeString(slot, false));
    setNewEndTime(getSlotTimeString(slot, true));
    setModalVisible(true);
  };

  const toggleModalDay = (dayId: number) => {
    setNewSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
    );
  };

  const handleSaveSlotFromModal = () => {
    if (newSelectedDays.length === 0) {
      showAlert("Required", "Please choose at least one working day for this schedule.");
      return;
    }

    const [sh, sm] = newStartTime.split(":").map((v) => Number(v) || 0);
    const [eh, em] = newEndTime.split(":").map((v) => Number(v) || 0);

    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0);
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0);

    const slotPayload: Slot = {
      id: editingSlotId || `slot_${Date.now()}`,
      _id: editingSlotId || `slot_${Date.now()}`,
      days: newSelectedDays,
      openingHour: sh,
      openingMinute: sm,
      closingHour: eh,
      closingMinute: em,
      startTime: Math.floor(startDate.getTime() / 1000),
      endTime: Math.floor(endDate.getTime() / 1000),
      isEnabled: true,
    };

    if (editingSlotId) {
      setSlots((prev) =>
        prev.map((s, idx) =>
          (s._id === editingSlotId || s.id === editingSlotId || String(idx) === editingSlotId)
            ? slotPayload
            : s
        )
      );
    } else {
      setSlots((prev) => [...prev, slotPayload]);
    }

    setModalVisible(false);
  };

  // Submit all availability slots to backend API
  const handleSaveAllAvailability = async () => {
    if (slots.length === 0) {
      showAlert("Required", "Please configure at least one availability schedule slot.");
      return;
    }

    try {
      setSubmitting(true);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

      const formattedSlots = slots.map((s) => {
        const [sh, sm] = getSlotTimeString(s, false).split(":").map((v) => Number(v) || 0);
        const [eh, em] = getSlotTimeString(s, true).split(":").map((v) => Number(v) || 0);
        const today = new Date();
        const sDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), sh, sm, 0);
        const eDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), eh, em, 0);

        return {
          _id: s._id?.startsWith("slot_") || s._id?.startsWith("default_") ? undefined : s._id,
          days: s.days || [1, 2, 3, 4, 5],
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
      } catch (putErr) {
        await api.addAvailability(payload);
      }

      await storage.set("cleaner_availability_slots", slots);

      if (!isFromSettings) {
        await updateUser({ signUpStepCompleted: Math.max(user.signUpStepCompleted, 7) });
        showAlert("Success", "Availability schedule configured successfully.");
        navigation.navigate("ThankYou");
      } else {
        showAlert("Success", "Cleaner availability schedule updated successfully.");
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

  const openTimePicker = (type: "start" | "end") => {
    const currentTimeStr = type === "start" ? newStartTime : newEndTime;
    setTempDate(parseTimeToDate(currentTimeStr));
    setActivePicker(type);
  };

  const onNativePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") {
      setActivePicker(null);
      if (event.type === "set" && selected) {
        const timeStr = formatDateToTime24(selected);
        if (activePicker === "start") {
          setNewStartTime(timeStr);
        } else if (activePicker === "end") {
          setNewEndTime(timeStr);
        }
      }
    } else if (selected) {
      setTempDate(selected);
    }
  };

  const confirmIosPicker = () => {
    const timeStr = formatDateToTime24(tempDate);
    if (activePicker === "start") {
      setNewStartTime(timeStr);
    } else if (activePicker === "end") {
      setNewEndTime(timeStr);
    }
    setActivePicker(null);
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

  return (
    <View style={styles.container}>
      <Header
        title="Cleaner Availability"
        onBackPress={handleBack}
        right={
          <TouchableOpacity
            style={styles.addHeaderBtn}
            onPress={handleOpenAddSlot}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={22} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.addHeaderText}>Add Slot</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading || submitting} />

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIconCircle}>
            <Ionicons name="time" size={20} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Working Shifts & Availability</Text>
            <Text style={styles.infoSub}>
              Clients can only book appointments during active schedule slots. You can toggle slots on/off anytime.
            </Text>
          </View>
        </View>

        {/* Schedule List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            ACTIVE SHIFT SLOTS ({slots.length})
          </Text>
          <TouchableOpacity onPress={handleOpenAddSlot} style={styles.addSlotPill}>
            <Ionicons name="add-circle-outline" size={16} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.addSlotPillText}>Add Schedule</Text>
          </TouchableOpacity>
        </View>

        {slots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon="calendar-outline"
              message="No availability slots yet. Tap '+ Add Slot' to configure your working hours."
            />
            <TouchableOpacity style={styles.emptyActionBtn} onPress={handleOpenAddSlot}>
              <Text style={styles.emptyActionBtnText}>Add Schedule Slot</Text>
            </TouchableOpacity>
          </View>
        ) : (
          slots.map((slot, index) => {
            const start12 = formatTime12h(getSlotTimeString(slot, false));
            const end12 = formatTime12h(getSlotTimeString(slot, true));
            const isEnabled = slot.isEnabled ?? true;
            const slotDays = slot.days || [];

            return (
              <View key={slot._id || slot.id || index} style={styles.slotCard}>
                <View style={styles.slotTopRow}>
                  <View style={styles.timeBadgeRow}>
                    <View style={[styles.clockCircle, !isEnabled && styles.clockCircleDisabled]}>
                      <Ionicons
                        name="time-outline"
                        size={16}
                        color={isEnabled ? Colors.ButtonPrimaryColor : "#94A3B8"}
                      />
                    </View>
                    <View>
                      <Text style={[styles.slotTimeText, !isEnabled && styles.slotTimeTextDisabled]}>
                        {start12} – {end12}
                      </Text>
                      <Text style={styles.slotStatusSub}>
                        {isEnabled ? "Active & Accept Bookings" : "Inactive (Off-duty)"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.slotActionsRow}>
                    <Switch
                      value={isEnabled}
                      onValueChange={() => handleToggleSlot(index)}
                      trackColor={{ false: "#E2E8F0", true: "#86EFAC" }}
                      thumbColor={isEnabled ? "#16A34A" : "#FFFFFF"}
                      style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
                    />
                    <TouchableOpacity
                      onPress={() => handleDeleteSlot(index)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Day Pills Mon-Sun */}
                <View style={styles.daysRow}>
                  {DAYS.map((day) => {
                    const isSelected = slotDays.includes(day.id);
                    return (
                      <View
                        key={day.id}
                        style={[
                          styles.dayPill,
                          isSelected && (isEnabled ? styles.dayPillActive : styles.dayPillActiveDisabled),
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayPillText,
                            isSelected && styles.dayPillTextActive,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Edit Button */}
                <TouchableOpacity
                  style={styles.editCardBtn}
                  onPress={() => handleOpenEditSlot(slot, index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={14} color={Colors.ButtonPrimaryColor} />
                  <Text style={styles.editCardBtnText}>Edit Hours or Days</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Add Another Slot Button */}
        {slots.length > 0 && (
          <TouchableOpacity
            style={styles.addMoreBtn}
            onPress={handleOpenAddSlot}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.addMoreBtnText}>Add Another Working Slot</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Floating Save/Update CTA */}
      <View
        style={[
          styles.footerWrap,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button
          title={isFromSettings ? "UPDATE AVAILABILITY" : "CONTINUE"}
          onPress={handleSaveAllAvailability}
          loading={submitting}
        />
      </View>

      {/* Modal: Add / Edit Slot */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContentCard, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>
                {editingSlotId ? "Edit Availability Slot" : "Add Availability Slot"}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Working Days */}
              <View style={styles.modalSection}>
                <View style={styles.modalSectionHeader}>
                  <Text style={styles.modalSectionTitle}>Working Days</Text>
                  <View style={styles.quickSelectRow}>
                    <TouchableOpacity
                      onPress={() => setNewSelectedDays([1, 2, 3, 4, 5])}
                      style={styles.quickSelectBtn}
                    >
                      <Text style={styles.quickSelectText}>Mon-Fri</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setNewSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                      style={styles.quickSelectBtn}
                    >
                      <Text style={styles.quickSelectText}>All Days</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalDaysGrid}>
                  {DAYS.map((day) => {
                    const isSelected = newSelectedDays.includes(day.id);
                    return (
                      <TouchableOpacity
                        key={day.id}
                        style={[styles.modalDayChip, isSelected && styles.modalDayChipActive]}
                        onPress={() => toggleModalDay(day.id)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.modalDayChipText,
                            isSelected && styles.modalDayChipTextActive,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Working Hours */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Working Hours</Text>
                <View style={styles.modalTimeRow}>
                  <TouchableOpacity
                    style={styles.modalTimeBox}
                    onPress={() => openTimePicker("start")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.timeBoxLabel}>START TIME</Text>
                    <Text style={styles.timeBoxValue}>{formatTime12h(newStartTime)}</Text>
                    <View style={styles.timeBoxBadge}>
                      <Ionicons name="pencil" size={10} color={Colors.ButtonPrimaryColor} />
                      <Text style={styles.timeBoxBadgeText}>Change</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.timeArrow}>
                    <Ionicons name="arrow-forward" size={18} color="#94A3B8" />
                  </View>

                  <TouchableOpacity
                    style={styles.modalTimeBox}
                    onPress={() => openTimePicker("end")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.timeBoxLabel}>END TIME</Text>
                    <Text style={styles.timeBoxValue}>{formatTime12h(newEndTime)}</Text>
                    <View style={styles.timeBoxBadge}>
                      <Ionicons name="pencil" size={10} color={Colors.ButtonPrimaryColor} />
                      <Text style={styles.timeBoxBadgeText}>Change</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Presets */}
                <Text style={styles.presetsLabel}>Quick Presets:</Text>
                <View style={styles.presetsRow}>
                  {TIME_PRESETS.map((p, idx) => {
                    const active = newStartTime === p.start && newEndTime === p.end;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.presetChip, active && styles.presetChipActive]}
                        onPress={() => {
                          setNewStartTime(p.start);
                          setNewEndTime(p.end);
                        }}
                      >
                        <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleSaveSlotFromModal}
              >
                <Text style={styles.modalApplyText}>
                  {editingSlotId ? "Apply Changes" : "Add To Schedule"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
                  Select {activePicker === "start" ? "Start Time" : "End Time"}
                </Text>
                <TouchableOpacity onPress={confirmIosPicker}>
                  <Text style={styles.pickerDone}>Done</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: Spacing.base,
  },
  addHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9EE",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(229, 182, 82, 0.4)",
  },
  addHeaderText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    marginLeft: 2,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    marginBottom: Spacing.lg,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  infoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF9EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSizes.sm + 1,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  infoSub: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.6,
  },
  addSlotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addSlotPillText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  slotCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.md,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  slotTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  timeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  clockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF9EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  clockCircleDisabled: {
    backgroundColor: "#F1F5F9",
  },
  slotTimeText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  slotTimeTextDisabled: {
    color: "#94A3B8",
  },
  slotStatusSub: {
    fontSize: FontSizes.xs - 1,
    color: Colors.DescriptionTextDark,
    marginTop: 2,
  },
  slotActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: "#FEF2F2",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    gap: 4,
  },
  dayPill: {
    flex: 1,
    height: 34,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  dayPillActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  dayPillActiveDisabled: {
    backgroundColor: "#94A3B8",
  },
  dayPillText: {
    fontSize: 11,
    fontWeight: FontWeights.semibold,
    color: "#64748B",
  },
  dayPillTextActive: {
    color: "#FFFFFF",
    fontWeight: FontWeights.bold,
  },
  editCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  editCardBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: Colors.ButtonPrimaryColor,
    borderStyle: "dashed",
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
    gap: 8,
  },
  addMoreBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  footerWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  modalContentCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    padding: Spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalHeaderTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  modalSection: {
    marginBottom: Spacing.lg,
  },
  modalSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  modalSectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  quickSelectRow: {
    flexDirection: "row",
    gap: 6,
  },
  quickSelectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#F1F5F9",
  },
  quickSelectText: {
    fontSize: FontSizes.xs - 1,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  modalDaysGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  modalDayChip: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  modalDayChipActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  modalDayChipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: "#64748B",
  },
  modalDayChipTextActive: {
    color: "#FFFFFF",
    fontWeight: FontWeights.bold,
  },
  modalTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  modalTimeBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    padding: Spacing.md,
  },
  timeBoxLabel: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timeBoxValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 4,
  },
  timeBoxBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeBoxBadgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  timeArrow: {
    paddingHorizontal: 8,
  },
  presetsLabel: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  presetChipActive: {
    backgroundColor: "#FEF9EE",
    borderColor: Colors.ButtonPrimaryColor,
  },
  presetChipText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: "#475569",
  },
  presetChipTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
  },
  modalFooter: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: "#64748B",
  },
  modalApplyBtn: {
    flex: 2,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: "center",
    alignItems: "center",
  },
  modalApplyText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
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
    color: Colors.TitleColor,
  },
  pickerDone: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  emptyActionBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
  },
  emptyActionBtnText: {
    color: "#FFFFFF",
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
});
