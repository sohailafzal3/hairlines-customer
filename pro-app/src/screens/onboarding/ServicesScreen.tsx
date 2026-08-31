import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { Service, SubServiceDetail } from "../../types/models";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Services">;

export function ServicesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    api
      .getAllServices()
      .then((res) => setServices(res.services ?? []))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleService = (id?: string) => {
    if (!id) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const submit = async () => {
    try {
      setLoading(true);
      const serviceIds = Array.from(selected);
      await api.selectServices({ services: serviceIds, userType: 2 });
      navigation.navigate("ServicesFor");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LoadingOverlay visible={loading} />
      <Text style={styles.title}>{t("onboarding:services")}</Text>
      {services.map((service) => (
        <View key={service._id} style={styles.card}>
          <TouchableOpacity onPress={() => toggleService(service._id)}>
            <View style={styles.row}>
              <Text style={styles.serviceName}>{service.serviceName}</Text>
              <Text style={styles.check}>
                {selected.has(service._id || "") ? "✓" : "○"}
              </Text>
            </View>
          </TouchableOpacity>
          {service.subServiceDetails?.map((sub: SubServiceDetail) => (
            <Text key={sub._id} style={styles.sub}>
              • {sub.subServiceName}
            </Text>
          ))}
        </View>
      ))}
      <Button title={t("common:next")} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff", flexGrow: 1 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: "#333" },
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: { fontSize: 16, fontWeight: "600", color: "#333" },
  check: { fontSize: 18, color: "#2E7D32", fontWeight: "700" },
  sub: { fontSize: 13, color: "#666", marginTop: 4 },
});
