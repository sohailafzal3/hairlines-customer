import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { CancellationReason } from "../../../types";

type Props = NativeStackScreenProps<HomeTabParamList, "CancellationReasons">;

export function CancellationReasonsScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { jobId } = route.params;
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [other, setOther] = useState("");

  useEffect(() => {
    api
      .fetchCancellationReasons()
      .then((res) => setReasons(res.reasonList ?? []))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    try {
      setLoading(true);
      await api.cancelJob(jobId, selected, other);
      navigation.popTo("HomeMap");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Cancel Job" onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Why are you cancelling?</Text>
        {reasons.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[
              styles.reason,
              selected === r.id && styles.reasonSelected,
            ]}
            onPress={() => setSelected(r.id || "")}
          >
            <Text style={styles.reasonText}>{r.reason}</Text>
          </TouchableOpacity>
        ))}
        <Input
          label="Other reason (optional)"
          value={other}
          onChangeText={setOther}
        />
        <Button title="Cancel Job" variant="danger" onPress={submit} />
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16, color: "#333" },
  reason: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    marginBottom: 8,
  },
  reasonSelected: {
    borderColor: "#C62828",
    backgroundColor: "#FFEBEE",
  },
  reasonText: { fontSize: 15, color: "#333" },
});
