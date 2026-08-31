import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { WeeklyEarnings, Week } from "../../../types";

type Props = DrawerScreenProps<MainDrawerParamList, "Earnings">;

export function EarningsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<WeeklyEarnings | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);

  useEffect(() => {
    const year = new Date().getFullYear().toString();
    api
      .getWeekList(year)
      .then((res) => setWeeks(res.weekList ?? []))
      .catch((e) => showAlert("Error", e.message));

    const currentWeek = "1";
    api
      .getEarnings(currentWeek, year)
      .then((res) => setEarnings(res))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Header title={t("drawer:earnings")} onMenuPress={() => navigation.openDrawer()} />
      <FlatList
        ListHeaderComponent={
          <Card>
            <Text style={styles.label}>Weekly Earnings</Text>
            <Text style={styles.total}>
              {formatCurrency(earnings?.totalSpEarning, earnings?.currency)}
            </Text>
            <Text style={styles.meta}>Jobs: {earnings?.totalJobCount ?? 0}</Text>
          </Card>
        }
        data={weeks}
        renderItem={({ item }) => (
          <TouchableOpacity>
            <Card>
              <Text style={styles.weekTitle}>{item.title}</Text>
            </Card>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => `${item.weekNumber}-${item.weekYear}`}
        contentContainerStyle={{ padding: 16 }}
      />
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  label: { fontSize: 14, color: "#777" },
  total: { fontSize: 30, fontWeight: "700", color: "#2E7D32", marginTop: 8 },
  meta: { fontSize: 14, color: "#666", marginTop: 4 },
  weekTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
});
