import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { EmptyState } from "../../../components/EmptyState";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { WeeklyEarnings, Week } from "../../../types";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = DrawerScreenProps<MainDrawerParamList, "Earnings">;

export function EarningsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<WeeklyEarnings | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>("1");

  const year = new Date().getFullYear().toString();

  const fetchWeekEarnings = async (weekNum: string) => {
    try {
      setLoading(true);
      const res = await api.getEarnings(weekNum, year);
      setEarnings(res);
      setSelectedWeek(weekNum);
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api
      .getWeekList(year)
      .then((res) => {
        const list = res.weekList ?? [];
        setWeeks(list);
        if (list.length > 0 && list[0]?.weekNumber) {
          fetchWeekEarnings(list[0].weekNumber);
        } else {
          fetchWeekEarnings("1");
        }
      })
      .catch((e) => {
        showAlert("Error", e.message);
        setLoading(false);
      });
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title={t("drawer:earnings")}
        onMenuPress={() => navigation.openDrawer()}
      />

      <FlatList
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Main Earnings Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="trending-up" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.summarySub}>WEEKLY PERFORMANCE</Text>
              </View>

              <Text style={styles.totalAmount}>
                {formatCurrency(earnings?.totalSpEarning, earnings?.currency)}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Ionicons name="briefcase-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.statLabel}>
                    Jobs: <Text style={styles.statValue}>{earnings?.totalJobCount ?? 0}</Text>
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Ionicons name="gift-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.statLabel}>
                    Tips: <Text style={styles.statValue}>{formatCurrency(earnings?.gratuity, earnings?.currency)}</Text>
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>PAST WEEKS BREAKDOWN</Text>
          </View>
        }
        data={weeks}
        renderItem={({ item }) => {
          const weekNum = item.weekNumber || "1";
          const isSelected = selectedWeek === weekNum;
          return (
            <TouchableOpacity
              onPress={() => fetchWeekEarnings(weekNum)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.weekCard,
                  isSelected && styles.weekCardSelected,
                ]}
              >
                <View style={styles.weekRow}>
                  <View style={[styles.calIcon, isSelected && styles.calIconActive]}>
                    <Ionicons
                      name="calendar"
                      size={18}
                      color={isSelected ? Colors.ButtonPrimaryColor : "#64748B"}
                    />
                  </View>
                  <Text style={[styles.weekTitle, isSelected && styles.weekTitleSelected]}>
                    {item.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isSelected ? Colors.ButtonPrimaryColor : "#CBD5E1"}
                  />
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}

        keyExtractor={(item) => `${item.weekNumber}-${item.weekYear}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="cash-outline"
              message="No weekly earnings recorded yet."
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
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing["3xl"],
  },
  headerSection: {
    paddingTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  summaryCard: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  summarySub: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 2,
  },
  totalAmount: {
    fontSize: FontSizes["3xl"] + 4,
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  statBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: "rgba(255, 255, 255, 0.85)",
  },
  statValue: {
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  weekCard: {
    marginVertical: 4,
    padding: Spacing.md,
  },
  weekCardSelected: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: "#EEF4FF",
  },
  weekRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  calIconActive: {
    backgroundColor: "#FFFFFF",
  },
  weekTitle: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.TitleColor,
  },
  weekTitleSelected: {
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
});

