import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Service, SubServiceDetail } from "../../../types";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = NativeStackScreenProps<MainDrawerParamList, "CreateWorker">;

export function CreateWorkerScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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
    <View style={styles.container}>
      <Header title="Invite Worker" onBackPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LoadingOverlay visible={loading} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Worker Information</Text>
          <Input label="Full Name" placeholder="e.g. Alex Johnson" value={name} onChangeText={setName} />
          <Input label="Email Address" placeholder="alex@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Input label="Phone Number" placeholder="512345678" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        </View>

        <Text style={styles.section}>ASSIGN SERVICES</Text>
        {services.map((service) => (
          <View key={service._id} style={styles.serviceCard}>
            <Text style={styles.serviceName}>{service.serviceName}</Text>
            {service.subServiceDetails?.map((sub: SubServiceDetail) => {
              const isChecked = selected.has(sub._id || "");
              return (
                <TouchableOpacity
                  key={sub._id}
                  onPress={() => toggleSub(sub._id)}
                  style={styles.row}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.subText, isChecked && styles.subTextChecked]}>
                    {sub.subServiceName}
                  </Text>
                  <Ionicons
                    name={isChecked ? "checkbox" : "square-outline"}
                    size={22}
                    color={isChecked ? Colors.ButtonPrimaryColor : "#94A3B8"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Pinned Bottom Action Button */}
      <View
        style={[
          styles.footerWrap,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Button title="Send Invite to Worker" onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  content: {
    padding: Spacing.base,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    marginBottom: Spacing.base,
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.base,
  },
  section: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.5,
  },
  serviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  serviceName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  subText: {
    fontSize: FontSizes.sm,
    color: "#475569",
  },
  subTextChecked: {
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
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


