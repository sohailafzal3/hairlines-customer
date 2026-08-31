import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Availability">;

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function AvailabilityScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const toggleDay = (index: number) => {
    setSelectedDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  };

  const submit = async () => {
    try {
      setLoading(true);
      const [sh, sm] = startTime.split(":").map(Number);
      const [eh, em] = endTime.split(":").map(Number);
      await api.addAvailability({
        days: selectedDays,
        openingHour: sh,
        openingMinute: sm,
        closingHour: eh,
        closingMinute: em,
      });
      navigation.navigate("ThankYou");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{t("onboarding:availability")}</Text>
      <Text style={styles.label}>Working Days</Text>
      <View style={styles.daysRow}>
        {days.map((day, i) => (
          <TouchableOpacity
            key={day}
            style={[
              styles.day,
              selectedDays.includes(i + 1) && styles.daySelected,
            ]}
            onPress={() => toggleDay(i + 1)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDays.includes(i + 1) && styles.dayTextSelected,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input label="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} />
      <Input label="End Time (HH:MM)" value={endTime} onChangeText={setEndTime} />
      <Button title={t("common:next")} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: "#333" },
  label: { fontSize: 14, fontWeight: "500", marginBottom: 8, color: "#333" },
  daysRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  day: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
    margin: 4,
  },
  daySelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  dayText: { fontSize: 12, color: "#333" },
  dayTextSelected: { color: "#fff", fontWeight: "700" },
});
