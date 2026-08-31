import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Service, SubServiceDetail } from "../../../types";

type Props = NativeStackScreenProps<MainDrawerParamList, "CreateWorker">;

export function CreateWorkerScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    api
      .getMerchantServices()
      .then((res) => setServices(res.services ?? []))
      .catch((e) => showAlert("Error", e.message));
  }, []);

  const toggleSub = (id?: string) => {
    if (!id) return;
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const submit = async () => {
    if (!name || !phone) {
      showAlert("Error", "Name and phone are required");
      return;
    }
    try {
      setLoading(true);
      await api.sendInviteToMover({
        name,
        email,
        phoneNumber: phone,
        services: Array.from(selected),
      });
      navigation.goBack();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Invite Worker" onBackPress={() => navigation.goBack()} />
      <LoadingOverlay visible={loading} />
      <Input label="Name" value={name} onChangeText={setName} />
      <Input label="Email" value={email} onChangeText={setEmail} />
      <Input label="Phone" value={phone} onChangeText={setPhone} />
      <Text style={styles.section}>Assign Services</Text>
      {services.map((service) => (
        <View key={service._id} style={styles.card}>
          <Text style={styles.serviceName}>{service.serviceName}</Text>
          {service.subServiceDetails?.map((sub: SubServiceDetail) => (
            <TouchableOpacity
              key={sub._id}
              onPress={() => toggleSub(sub._id)}
              style={styles.row}
            >
              <Text style={styles.subText}>{sub.subServiceName}</Text>
              <Text style={styles.check}>
                {selected.has(sub._id || "") ? "✓" : "○"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <Button title="Send Invite" onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", flexGrow: 1 },
  section: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    color: "#333",
  },
  card: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  serviceName: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  subText: { fontSize: 14, color: "#555" },
  check: { fontSize: 16, color: "#2E7D32", fontWeight: "700" },
});
