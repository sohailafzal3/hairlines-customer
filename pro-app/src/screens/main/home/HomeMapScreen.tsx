import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { EmptyState } from "../../../components/EmptyState";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Job } from "../../../types/models";
import { JobStatus } from "../../../constants";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = NativeStackScreenProps<HomeTabParamList, "HomeMap">;

export function HomeMapScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [region, setRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, jobsRes, unhandled] = await Promise.all([
        api.getSPStatus(),
        api.getJobs(0, 0, 20),
        api.getUnhandledJob(),
      ]);
      setOnline(statusRes.isSpOnline ?? false);
      setJobs(jobsRes.jobList ?? []);
      if (unhandled.isUnhandledJobExist) {
        navigation.navigate("JobRequest", { job: unhandled });
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleOnline = async (value: boolean) => {
    try {
      await api.updateStatus(value ? 1 : 0);
      setOnline(value);
    } catch (e: any) {
      showAlert("Error", e.message);
    }
  };

  const renderJob = ({ item }: { item: Job }) => {
    const statusText = JobStatus[item.spJobStatus] || "Upcoming";
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("JobDetails", {
            jobId: item.id,
            status: item.spJobStatus,
          })
        }
      >
        <Card style={styles.jobCard}>
          <View style={styles.row}>
            <Avatar uri={item.userProfileImage} name={item.userName} size={46} />
            <View style={styles.jobInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.userName || "Customer"}
              </Text>
              <Text style={styles.service} numberOfLines={1}>
                {item.serviceName}
              </Text>
              <View style={styles.addressRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={Colors.DescriptionTextDark}
                  style={{ marginRight: 2 }}
                />
                <Text style={styles.address} numberOfLines={1}>
                  {item.primaryAddress || "Location provided upon booking"}
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={t("home:title")}
        onMenuPress={() => (navigation.getParent() as any)?.openDrawer()}
      />

      {/* Online Status Bar */}
      <View style={styles.onlineBar}>
        <View style={styles.onlineLeft}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: online ? "#22C55E" : "#94A3B8" },
            ]}
          />
          <View>
            <Text style={styles.onlineText}>
              {online ? "You are Online" : "You are Offline"}
            </Text>
            <Text style={styles.onlineSubtext}>
              {online
                ? "Available for instant bookings"
                : "Switch on to receive requests"}
            </Text>
          </View>
        </View>
        <Switch
          value={online}
          onValueChange={toggleOnline}
          trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
          thumbColor={online ? "#16A34A" : "#FFFFFF"}
        />
      </View>

      {/* Interactive Map */}
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {jobs.map(
          (job) =>
            job.latitude &&
            job.longitude && (
              <Marker
                key={job.id}
                coordinate={{
                  latitude: job.latitude,
                  longitude: job.longitude,
                }}
                title={job.serviceName}
              />
            )
        )}
      </MapView>

      {/* Bottom Scheduled Jobs Panel */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Upcoming Scheduled Jobs</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{jobs.length}</Text>
          </View>
        </View>

        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              message="No jobs scheduled yet. Go online to receive job requests!"
            />
          }
        />
      </View>

      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  onlineBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.BorderColor,
  },
  onlineLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  onlineText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  onlineSubtext: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
  },
  map: { flex: 1 },
  listContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderColor,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 4,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  countBadge: {
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  jobCard: {
    marginVertical: 6,
    padding: Spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center" },
  jobInfo: { flex: 1, marginHorizontal: 10 },
  userName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  service: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.ButtonPrimaryColor,
    marginTop: 1,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  address: {
    fontSize: 11,
    color: Colors.DescriptionTextDark,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    textTransform: "uppercase",
  },
});

