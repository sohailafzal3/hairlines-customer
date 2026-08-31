import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { PastJob } from "../../../types";

type Props = NativeStackScreenProps<MainDrawerParamList, "History">;

export function HistoryScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<PastJob[]>([]);

  useEffect(() => {
    api
      .getPastJobs(0, 20)
      .then((res) => setJobs(res.spJobsFound ?? []))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }: { item: PastJob }) => (
    <Card>
      <Text style={styles.service}>{item.serviceName}</Text>
      <Text style={styles.user}>{item.userName}</Text>
      <Text style={styles.earned}>
        Earned: {formatCurrency(item.spEarnedAmount, item.currency)}
      </Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="History" onBackPress={() => navigation.goBack()} />
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || `${item.jobEndTime}`}
        contentContainerStyle={{ padding: 16 }}
      />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  service: { fontSize: 16, fontWeight: "600", color: "#333" },
  user: { fontSize: 14, color: "#666", marginTop: 2 },
  earned: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2E7D32",
    marginTop: 8,
  },
});
