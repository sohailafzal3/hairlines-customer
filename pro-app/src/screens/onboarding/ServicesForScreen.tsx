import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";

type Props = NativeStackScreenProps<OnboardingStackParamList, "ServicesFor">;

const options = [
  { label: "Regular customers only", value: 1 },
  { label: "Disabled customers only", value: 2 },
  { label: "Both", value: 3 },
];

export function ServicesForScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(3);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      await api.selectServiceFor({ serviceFor: selected, userType: 2 });
      navigation.navigate("Certificates");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Services For" onBackPress={() => navigation.goBack()} />
      <View style={styles.content}>
        <LoadingOverlay visible={loading} />
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.option,
              selected === opt.value && styles.optionSelected,
            ]}
            onPress={() => setSelected(opt.value)}
          >
            <Text
              style={[
                styles.optionText,
                selected === opt.value && styles.optionTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
        <Button title={t("common:next")} onPress={submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, flex: 1 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16, color: "#333" },
  option: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 12,
  },
  optionSelected: {
    borderColor: "#222D63",
    backgroundColor: "#EEF4FF",
  },
  optionText: { fontSize: 16, color: "#333" },
  optionTextSelected: { fontWeight: "700", color: "#222D63" },
});

