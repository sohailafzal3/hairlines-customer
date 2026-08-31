import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Service, SubServiceDetail } from "../../../types";

type Props = NativeStackScreenProps<HomeTabParamList, "ServicesSelection">;

export function ServicesSelectionScreen({ route, navigation }: Props) {
  const jobId = route.params?.jobId;
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api
      .fetchAllServices()
      .then((res) => setServices(res.services ?? []))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleSub = (serviceId: string, subId?: string) => {
    if (!subId) return;
    setSelected((prev) => {
      const current = prev[serviceId] ?? [];
      const next = current.includes(subId)
        ? current.filter((id) => id !== subId)
        : [...current, subId];
      return { ...prev, [serviceId]: next };
    });
  };

  const submit = async () => {
    if (!jobId) {
      navigation.goBack();
      return;
    }
    try {
      setLoading(true);
      const entries = Object.entries(selected).filter(([, subs]) => subs.length > 0);
      for (const [serviceId, subServices] of entries) {
        await api.addSubServices(jobId, serviceId, subServices);
      }
      navigation.goBack();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Add Services" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {services.map((service) => (
          <View key={service._id} style={styles.card}>
            <Text style={styles.serviceName}>{service.serviceName}</Text>
            {service.subServiceDetails?.map((sub: SubServiceDetail) => (
              <TouchableOpacity
                key={sub._id}
                onPress={() => toggleSub(service._id || "", sub._id)}
                style={styles.subRow}
              >
                <Text style={styles.subText}>{sub.subServiceName}</Text>
                <Text style={styles.check}>
                  {selected[service._id || ""]?.includes(sub._id || "") ? "✓" : "○"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <Button title="Add Selected" onPress={submit} />
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 8 },
  subRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  subText: { fontSize: 14, color: "#555" },
  check: { fontSize: 16, color: "#2E7D32", fontWeight: "700" },
});
