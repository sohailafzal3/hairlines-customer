import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Service, SubServiceDetail } from "../../../types";
import { Colors } from "../../../theme/colors";

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
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("HomeMap");
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
      navigation.navigate("HomeMap");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Add Services" onBackPress={handleBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {services.map((service) => (
          <View key={service._id} style={styles.card}>
            <Text style={styles.serviceName}>{service.serviceName}</Text>
            {service.subServiceDetails?.map((sub: SubServiceDetail) => (
              <TouchableOpacity
                key={sub._id}
                onPress={() => toggleSub(service._id || "", sub._id)}
                style={styles.subRow}
                activeOpacity={0.7}
              >
                <Text style={styles.subText}>{sub.subServiceName}</Text>
                <Ionicons
                  name={
                    selected[service._id || ""]?.includes(sub._id || "")
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={22}
                  color={
                    selected[service._id || ""]?.includes(sub._id || "")
                      ? Colors.RadioActive
                      : "#94A3B8"
                  }
                />
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <Button title="Add Selected Services" onPress={submit} />
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 8 },
  subRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  subText: { fontSize: 14, color: "#334155" },
});

