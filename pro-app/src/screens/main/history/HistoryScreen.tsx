import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { EmptyState } from "../../../components/EmptyState";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { PastJob } from "../../../types";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { Spacing } from "../../../theme/spacing";

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
    <Card style={styles.jobCard}>
      <View style={styles.topRow}>
        <Text style={styles.service}>{item.serviceName}</Text>
        <Text style={styles.earned}>
          {formatCurrency(item.spEarnedAmount, item.currency)}
        </Text>
      </View>
      <View style={styles.userRow}>
        <Ionicons name="person-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
        <Text style={styles.user}>{item.userName || "Customer"}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Job History" onBackPress={() => navigation.goBack()} />
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || `${item.jobEndTime}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="time-outline"
              message="No completed jobs found yet."
            />
          ) : null
        }
      />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  listContent: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  jobCard: {
    marginVertical: 5,
    padding: Spacing.base,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  service: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    flex: 1,
  },
  earned: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  user: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
  },
});

