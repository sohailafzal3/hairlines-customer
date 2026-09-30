import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Avatar } from "../../../components/Avatar";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { EmptyState } from "../../../components/EmptyState";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { PastJob } from "../../../types";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = DrawerScreenProps<MainDrawerParamList, "History">;

const PAGE_LIMIT = 15;

function formatJobDate(timestamp?: number): string {
  if (!timestamp) return "Completed";
  const date = new Date(timestamp > 9999999999 ? timestamp : timestamp * 1000);
  if (isNaN(date.getTime())) return "Completed";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryScreen({ route, navigation }: Props) {
  const weekNumber = route.params?.weekNumber;
  const weekYear = route.params?.weekYear;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [jobs, setJobs] = useState<PastJob[]>([]);

  const fetchJobs = useCallback(
    async (isRefresh = false) => {
      try {
        const currentOffset = isRefresh ? 0 : offset;
        const res = await api.getPastJobs(
          currentOffset,
          PAGE_LIMIT,
          weekNumber,
          weekYear
        );
        const list = res.spJobsFound || [];

        if (isRefresh) {
          setJobs(list);
          setOffset(list.length);
          setHasMore(list.length >= PAGE_LIMIT);
        } else {
          setJobs((prev) => {
            const existingIds = new Set(prev.map((j) => j.id || j._id || j.jobId));
            const newItems = list.filter(
              (j) => !existingIds.has(j.id || j._id || j.jobId)
            );
            return [...prev, ...newItems];
          });
          setOffset((prev) => prev + list.length);
          setHasMore(list.length >= PAGE_LIMIT);
        }
      } catch (e: any) {
        showAlert("Error", e.message || "Failed to load past jobs");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [offset, weekNumber, weekYear]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchJobs(true);
    }, [weekNumber, weekYear])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJobs(true);
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && !refreshing && hasMore) {
      setLoadingMore(true);
      fetchJobs(false);
    }
  };

  const handleJobPress = (item: PastJob) => {
    const jobId = item.id || item._id || item.jobId;
    if (jobId) {
      navigation.navigate("HomeTab", {
        screen: "JobDetails",
        params: { jobId, status: item.spJobStatus || item.status || 5 },
      } as any);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeTab");
    }
  };

  const renderItem = ({ item }: { item: PastJob }) => {
    const earnedAmount = item.spEarnedAmount ?? item.totalAmount ?? 0;
    const dateFormatted = formatJobDate(item.jobEndTime || item.jobStartTime);
    const serviceTitle = item.serviceName || "Barber & Styling Service";
    const clientName = item.userName || "Customer";
    const address = item.address || item.primaryAddress;

    return (
      <TouchableOpacity
        onPress={() => handleJobPress(item)}
        activeOpacity={0.85}
      >
        <Card style={styles.jobCard}>
          {/* Header Row */}
          <View style={styles.topRow}>
            <View style={styles.serviceRow}>
              <View style={styles.serviceIconContainer}>
                <MaterialCommunityIcons
                  name="content-cut"
                  size={18}
                  color={Colors.ButtonPrimaryColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.service} numberOfLines={1}>
                  {serviceTitle}
                </Text>
                <Text style={styles.dateText}>{dateFormatted}</Text>
              </View>
            </View>

            <View style={styles.earningBadge}>
              <Text style={styles.earnedText}>
                {formatCurrency(earnedAmount, item.currency)}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Customer & Address Row */}
          <View style={styles.bottomRow}>
            <View style={styles.userRow}>
              <Avatar
                uri={item.userProfileImage}
                name={clientName}
                size={34}
              />
              <View style={styles.userTextCol}>
                <Text style={styles.user} numberOfLines={1}>
                  {clientName}
                </Text>
                {Boolean(address) && (
                  <View style={styles.addressRow}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#64748B"
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.addressText} numberOfLines={1}>
                      {address}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.statusPill}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#059669"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.statusPillText}>Completed</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={weekNumber ? `Week ${weekNumber} History` : "Job History"}
        onBackPress={handleBack}
        right={
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            hitSlop={10}
            style={{ padding: 4 }}
          >
            <Ionicons name="menu" size={24} color={Colors.NavigationTitle} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.id || item._id || item.jobId || `${item.jobEndTime}-${index}`
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="time-outline"
              message={
                weekNumber
                  ? `No jobs found for Week ${weekNumber}, ${weekYear}.`
                  : "No completed jobs found yet. Once you complete client appointments, they will appear here."
              }
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
  listContent: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  jobCard: {
    marginVertical: 5,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.sm,
  },
  serviceIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  service: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  dateText: {
    fontSize: FontSizes.xs,
    color: "#64748B",
    marginTop: 2,
  },
  earningBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  earnedText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: "#059669",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.xs,
  },
  userTextCol: {
    marginLeft: 8,
    flex: 1,
  },
  user: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.TitleColor,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  addressText: {
    fontSize: FontSizes.xs,
    color: "#64748B",
    flex: 1,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusPillText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: "#059669",
  },
  footerLoading: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
});

