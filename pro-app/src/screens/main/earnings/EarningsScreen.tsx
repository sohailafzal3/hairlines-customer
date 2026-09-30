import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { EmptyState } from "../../../components/EmptyState";
import { Button } from "../../../components/Button";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { WeeklyEarnings } from "../../../types";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = DrawerScreenProps<MainDrawerParamList, "Earnings">;

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface MonthWeekItem {
  weekNumber: number;
  weekYear: number;
  weekIndexInMonth: number;
  title: string;
  subtitle: string;
  startDateStr: string;
  endDateStr: string;
}

function getISOWeekInfo(d: Date): { weekNumber: number; weekYear: number } {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3); // Nearest Thursday
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber =
    1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const weekYear = new Date(firstThursday).getFullYear();
  return { weekNumber, weekYear };
}

function getWeeksForMonth(year: number, month: number): MonthWeekItem[] {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const weeks: MonthWeekItem[] = [];
  const seenWeeks = new Set<number>();

  let currentDay = 1;
  let weekIndex = 1;

  while (currentDay <= lastDay) {
    const date = new Date(year, month, currentDay);
    const { weekNumber, weekYear } = getISOWeekInfo(date);

    if (!seenWeeks.has(weekNumber)) {
      seenWeeks.add(weekNumber);

      const dayOfWeek = (date.getDay() + 6) % 7; // Mon=0 .. Sun=6
      const monday = new Date(year, month, currentDay - dayOfWeek);
      const sunday = new Date(year, month, currentDay - dayOfWeek + 6);

      const startStr = `${MONTH_SHORT[monday.getMonth()]} ${monday.getDate()}`;
      const endStr = `${MONTH_SHORT[sunday.getMonth()]} ${sunday.getDate()}`;
      const subtitle = `${startStr} - ${endStr}, ${sunday.getFullYear()}`;

      weeks.push({
        weekNumber,
        weekYear,
        weekIndexInMonth: weekIndex,
        title: `Week ${weekIndex}`,
        subtitle,
        startDateStr: startStr,
        endDateStr: endStr,
      });
      weekIndex++;
    }
    currentDay += 7;
  }

  // Ensure last day of month is included
  const lastDate = new Date(year, month, lastDay);
  const lastWeekInfo = getISOWeekInfo(lastDate);
  if (!seenWeeks.has(lastWeekInfo.weekNumber)) {
    seenWeeks.add(lastWeekInfo.weekNumber);
    const dayOfWeek = (lastDate.getDay() + 6) % 7;
    const monday = new Date(year, month, lastDay - dayOfWeek);
    const sunday = new Date(year, month, lastDay - dayOfWeek + 6);
    const startStr = `${MONTH_SHORT[monday.getMonth()]} ${monday.getDate()}`;
    const endStr = `${MONTH_SHORT[sunday.getMonth()]} ${sunday.getDate()}`;
    const subtitle = `${startStr} - ${endStr}, ${sunday.getFullYear()}`;

    weeks.push({
      weekNumber: lastWeekInfo.weekNumber,
      weekYear: lastWeekInfo.weekYear,
      weekIndexInMonth: weekIndex,
      title: `Week ${weekIndex}`,
      subtitle,
      startDateStr: startStr,
      endDateStr: endStr,
    });
  }

  return weeks;
}

export function EarningsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWeek, setSelectedWeek] = useState<MonthWeekItem | null>(null);
  const [earnings, setEarnings] = useState<WeeklyEarnings | null>(null);

  const [weeklyTransactions, setWeeklyTransactions] = useState<any[]>([]);

  const selectedYear = selectedDate.getFullYear();
  const selectedMonthIndex = selectedDate.getMonth();
  const selectedMonthName = MONTH_NAMES[selectedMonthIndex];

  // Calculate the weeks belonging to the selected month
  const monthWeeks = useMemo(() => {
    return getWeeksForMonth(selectedYear, selectedMonthIndex);
  }, [selectedYear, selectedMonthIndex]);

  const fetchWeekEarnings = async (week: MonthWeekItem, isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setSelectedWeek(week);
      const [earningRes, transRes] = await Promise.all([
        api.getEarnings(String(week.weekNumber), String(week.weekYear)).catch(() => null),
        api.getWeeklyTransactions(String(week.weekNumber), String(week.weekYear)).catch(() => ({ spJobsFound: [] })),
      ]);
      setEarnings(earningRes);
      setWeeklyTransactions(transRes?.spJobsFound || []);
    } catch (e: any) {
      if (!isRefresh) showAlert("Error", e.message || "Failed to load weekly earnings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (selectedWeek) {
      setRefreshing(true);
      await fetchWeekEarnings(selectedWeek, true);
    }
  };

  // When month changes or on mount, select current or first week
  useEffect(() => {
    if (monthWeeks.length > 0) {
      const today = new Date();
      const currentWeekInfo = getISOWeekInfo(today);
      const matchingCurrentWeek = monthWeeks.find(
        (w) =>
          w.weekNumber === currentWeekInfo.weekNumber &&
          w.weekYear === currentWeekInfo.weekYear
      );

      const targetWeek = matchingCurrentWeek || monthWeeks[0];
      fetchWeekEarnings(targetWeek);
    }
  }, [monthWeeks]);

  const handlePrevMonth = () => {
    setSelectedDate((prev) => {
      const newD = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return newD;
    });
  };

  const handleNextMonth = () => {
    setSelectedDate((prev) => {
      const newD = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return newD;
    });
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeTab");
    }
  };

  const dayEarnings = earnings?.weekDayEarnings || [];
  const maxDayEarning = Math.max(
    ...dayEarnings.map((d) => d.spEarning || 0),
    1
  );

  return (
    <View style={styles.container}>
      <Header
        title="Payment History"
        onBackPress={handleBack}
        right={
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            hitSlop={10}
            style={styles.headerRightBtn}
          >
            <Ionicons name="menu" size={24} color={Colors.NavigationTitle} />
          </TouchableOpacity>
        }
      />

      <FlatList
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Month Selector Bar with Previous / Next Buttons */}
            <View style={styles.monthSelectorContainer}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                style={styles.monthArrowBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-back" size={20} color={Colors.TitleColor} />
              </TouchableOpacity>

              <View style={styles.monthCenterInfo}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={Colors.ButtonPrimaryColor}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.monthTitleText}>
                  {selectedMonthName} {selectedYear}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNextMonth}
                style={styles.monthArrowBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="chevron-forward" size={20} color={Colors.TitleColor} />
              </TouchableOpacity>
            </View>

            {/* Main Earnings Card for Selected Week */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name="trending-up" size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summarySub}>
                    {selectedWeek ? `${selectedWeek.title.toUpperCase()} • ${selectedWeek.subtitle.toUpperCase()}` : "WEEKLY PERFORMANCE"}
                  </Text>
                </View>
              </View>

              <Text style={styles.totalAmount}>
                {formatCurrency(earnings?.totalSpEarning, earnings?.currency)}
              </Text>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Ionicons
                    name="briefcase-outline"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.statLabel}>
                    Appointments:{" "}
                    <Text style={styles.statValue}>
                      {earnings?.totalJobCount ?? 0}
                    </Text>
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Ionicons
                    name="gift-outline"
                    size={14}
                    color="#FFFFFF"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.statLabel}>
                    Tips:{" "}
                    <Text style={styles.statValue}>
                      {formatCurrency(earnings?.gratuity, earnings?.currency)}
                    </Text>
                  </Text>
                </View>

                {Boolean(earnings?.refferalEarning && earnings.refferalEarning > 0) && (
                  <View style={styles.statBox}>
                    <Ionicons
                      name="star-outline"
                      size={14}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.statLabel}>
                      Bonus:{" "}
                      <Text style={styles.statValue}>
                        {formatCurrency(earnings?.refferalEarning, earnings?.currency)}
                      </Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Daily Breakdown Chart */}
            {dayEarnings.length > 0 && (
              <View style={styles.dailyCard}>
                <Text style={styles.dailyTitle}>
                  DAILY BREAKDOWN ({selectedWeek?.startDateStr} - {selectedWeek?.endDateStr})
                </Text>
                <View style={styles.barsContainer}>
                  {dayEarnings.map((dayItem, idx) => {
                    const amount = dayItem.spEarning || 0;
                    const heightPercent = Math.max(
                      (amount / maxDayEarning) * 100,
                      8
                    );
                    const dayLabel = DAYS_OF_WEEK[idx] || `D${idx + 1}`;
                    const isNonZero = amount > 0;

                    return (
                      <View key={idx} style={styles.barColumn}>
                        <Text style={styles.barAmountText}>
                          {isNonZero ? `$${Math.round(amount)}` : ""}
                        </Text>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${heightPercent}%`,
                                backgroundColor: isNonZero
                                  ? Colors.ButtonPrimaryColor
                                  : "#CBD5E1",
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.barDayText,
                            isNonZero && styles.barDayTextActive,
                          ]}
                        >
                          {dayLabel}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* View Weekly Job Details Button */}
            <Button
              title={selectedWeek ? `View ${selectedWeek.title} Job History` : "View Weekly Job Details"}
              variant="secondary"
              onPress={() => {
                if (selectedWeek) {
                  navigation.navigate("History", {
                    weekNumber: String(selectedWeek.weekNumber),
                    weekYear: String(selectedWeek.weekYear),
                  });
                } else {
                  navigation.navigate("History");
                }
              }}
              style={styles.detailsBtn}
            />

            <View style={styles.breakdownHeaderRow}>
              <Text style={styles.sectionTitle}>
                {selectedMonthName.toUpperCase()} {selectedYear} WEEKLY BREAKDOWN
              </Text>
              <Text style={styles.sectionSubtitle}>
                Select a week to view performance
              </Text>
            </View>
          </View>
        }
        data={monthWeeks}
        renderItem={({ item }) => {
          const isSelected =
            selectedWeek?.weekNumber === item.weekNumber &&
            selectedWeek?.weekYear === item.weekYear;

          return (
            <TouchableOpacity
              onPress={() => fetchWeekEarnings(item)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.weekCard,
                  isSelected && styles.weekCardSelected,
                ]}
              >
                <View style={styles.weekRow}>
                  <View
                    style={[
                      styles.calIcon,
                      isSelected && styles.calIconActive,
                    ]}
                  >
                    <Ionicons
                      name="calendar"
                      size={18}
                      color={
                        isSelected ? Colors.ButtonPrimaryColor : "#64748B"
                      }
                    />
                  </View>
                  <View style={styles.weekTextContainer}>
                    <Text
                      style={[
                        styles.weekTitle,
                        isSelected && styles.weekTitleSelected,
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.weekSubTitle}>{item.subtitle}</Text>
                  </View>
                  <View style={[styles.activePill, isSelected && styles.activePillSelected]}>
                    <Text style={[styles.activePillText, isSelected && styles.activePillTextSelected]}>
                      {isSelected ? "Selected" : "View"}
                    </Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) =>
          `${item.weekNumber}-${item.weekYear}-${item.weekIndexInMonth}`
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.ButtonPrimaryColor]}
            tintColor={Colors.ButtonPrimaryColor}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="cash-outline"
              message={`No weeks recorded for ${selectedMonthName} ${selectedYear}.`}
            />
          ) : null
        }
      />
      <LoadingOverlay visible={loading && !refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  headerRightBtn: {
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing["3xl"],
  },
  headerSection: {
    paddingTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  monthSelectorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  monthArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  monthCenterInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  monthTitleText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  summaryCard: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.base,
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
    letterSpacing: 1.2,
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
  dailyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  dailyTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 110,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barAmountText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    marginBottom: 4,
    minHeight: 12,
  },
  barTrack: {
    width: 14,
    height: 60,
    backgroundColor: "#F1F5F9",
    borderRadius: 7,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 7,
  },
  barDayText: {
    fontSize: 10,
    fontWeight: FontWeights.medium,
    color: "#94A3B8",
    marginTop: 6,
  },
  barDayTextActive: {
    color: Colors.TitleColor,
    fontWeight: FontWeights.bold,
  },
  detailsBtn: {
    marginBottom: Spacing.lg,
  },
  breakdownHeaderRow: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: FontSizes.xs,
    color: "#94A3B8",
  },
  weekCard: {
    marginVertical: 4,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
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
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  calIconActive: {
    backgroundColor: "#DBEAFE",
  },
  weekTextContainer: {
    flex: 1,
  },
  weekTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  weekTitleSelected: {
    color: Colors.ButtonPrimaryColor,
  },
  weekSubTitle: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
  },
  activePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F1F5F9",
  },
  activePillSelected: {
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  activePillText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: "#64748B",
  },
  activePillTextSelected: {
    color: "#FFFFFF",
    fontWeight: FontWeights.bold,
  },
});



