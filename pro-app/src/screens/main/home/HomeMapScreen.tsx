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
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Job } from "../../../types/models";
import { JobStatus } from "../../../constants";

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

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("JobDetails", { jobId: item.id, status: item.spJobStatus })
      }
    >
      <Card>
        <View style={styles.row}>
          <Avatar uri={item.userProfileImage} name={item.userName} />
          <View style={styles.jobInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.service}>{item.serviceName}</Text>
            <Text style={styles.address}>{item.primaryAddress}</Text>
          </View>
          <Text style={styles.status}>{JobStatus[item.spJobStatus]}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title={t("home:title")} onMenuPress={() => (navigation.getParent() as any)?.openDrawer()} />
      <View style={styles.onlineRow}>
        <Text style={styles.onlineText}>{online ? t("common:online") : t("common:offline")}</Text>
        <Switch value={online} onValueChange={toggleOnline} />
      </View>
      <MapView style={styles.map} region={region} onRegionChangeComplete={setRegion}>
        {jobs.map(
          (job) =>
            job.latitude &&
            job.longitude && (
              <Marker
                key={job.id}
                coordinate={{ latitude: job.latitude, longitude: job.longitude }}
                title={job.serviceName}
              />
            )
        )}
      </MapView>
      <View style={styles.list}>
        <Text style={styles.sectionTitle}>Scheduled Jobs</Text>
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={styles.empty}>{t("home:noJobs")}</Text>}
        />
      </View>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
  },
  onlineText: { fontSize: 16, fontWeight: "600", color: "#333" },
  list: { flex: 1 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 12,
    color: "#333",
  },
  row: { flexDirection: "row", alignItems: "center" },
  jobInfo: { flex: 1, marginHorizontal: 12 },
  userName: { fontSize: 15, fontWeight: "600", color: "#333" },
  service: { fontSize: 13, color: "#666", marginTop: 2 },
  address: { fontSize: 12, color: "#999", marginTop: 2 },
  status: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
    textTransform: "capitalize",
  },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});
