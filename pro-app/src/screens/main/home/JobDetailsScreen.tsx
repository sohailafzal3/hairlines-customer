import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { JobDetail } from "../../../types";
import { JobStatus } from "../../../constants";

type Props = NativeStackScreenProps<HomeTabParamList, "JobDetails">;

export function JobDetailsScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { jobId } = route.params;
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetail | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const detail = await api.getJobDetail(jobId);
      setJob(detail);
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId]);

  const updateStatus = async (status: number) => {
    try {
      setLoading(true);
      await api.updateJobStatus(jobId, status);
      if (status === JobStatus.completed && job?.userProfileId) {
        navigation.navigate("RateUser", {
          jobId,
          userProfileId: job.userProfileId,
          name: job.userName,
          image: job.userProfileImage,
        });
        return;
      }
      await load();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderAction = () => {
    const status = job?.spJobStatus ?? 0;
    switch (status) {
      case JobStatus.accepted:
        return (
          <Button
            title={t("home:startDriving")}
            onPress={() => updateStatus(JobStatus.onTheWay)}
          />
        );
      case JobStatus.onTheWay:
        return (
          <Button
            title={t("home:arrived")}
            onPress={() => updateStatus(JobStatus.arrived)}
          />
        );
      case JobStatus.arrived:
        return (
          <Button
            title={t("home:startService")}
            onPress={() => updateStatus(JobStatus.started)}
          />
        );
      case JobStatus.started:
        return (
          <Button title={t("home:complete")} onPress={() => updateStatus(JobStatus.completed)} />
        );
      default:
        return null;
    }
  };

  const callUser = () => {
    if (job?.userPhoneNumber) Linking.openURL(`tel:${job.userPhoneNumber}`);
  };

  if (!job) {
    return (
      <View style={styles.container}>
        <Header title={t("job:details")} onBackPress={() => navigation.goBack()} />
        <LoadingOverlay visible={loading} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t("job:details")} onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <View style={styles.row}>
            <Avatar uri={job.userProfileImage} name={job.userName} size={56} />
            <View style={styles.userInfo}>
              <Text style={styles.name}>{job.userName}</Text>
              <Text style={styles.sub}>{job.serviceName}</Text>
            </View>
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={callUser} style={styles.iconBtn}>
              <Text style={styles.iconText}>{t("job:call")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Chat", { jobId, title: job.userName })
              }
              style={styles.iconBtn}
            >
              <Text style={styles.iconText}>{t("job:chat")}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <Text style={styles.label}>Address</Text>
          <Text style={styles.value}>
            {job.streetAddress}, {job.city}, {job.state}
          </Text>
          <Text style={styles.label}>Instructions</Text>
          <Text style={styles.value}>{job.specialInstruction || "None"}</Text>
        </Card>

        <Card>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.total}>
            {formatCurrency(job.totalAmount, job.costBreakDown?.currency)}
          </Text>
          <Button
            title={t("job:costBreakdown")}
            variant="ghost"
            onPress={() => navigation.navigate("CostBreakdown", { jobId })}
          />
        </Card>

        {renderAction()}
        <View style={{ height: 10 }} />
        <Button
          title={t("home:cancel")}
          variant="danger"
          onPress={() => navigation.navigate("CancellationReasons", { jobId })}
        />
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 32 },
  row: { flexDirection: "row", alignItems: "center" },
  userInfo: { marginLeft: 12 },
  name: { fontSize: 17, fontWeight: "700", color: "#333" },
  sub: { fontSize: 14, color: "#666", marginTop: 2 },
  actionsRow: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "space-around",
  },
  iconBtn: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  iconText: { fontWeight: "600", color: "#333" },
  label: { fontSize: 13, color: "#999", marginTop: 10 },
  value: { fontSize: 15, color: "#333", marginTop: 4 },
  total: { fontSize: 24, fontWeight: "700", color: "#2E7D32", marginVertical: 8 },
});
