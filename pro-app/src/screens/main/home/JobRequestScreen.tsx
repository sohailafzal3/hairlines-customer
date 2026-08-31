import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HomeTabParamList } from "../../../navigation/types";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { JobStatus } from "../../../constants";

type Props = NativeStackScreenProps<HomeTabParamList, "JobRequest">;

export function JobRequestScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const job = route.params.job;
  const [loading, setLoading] = useState(false);

  const respond = async (status: number) => {
    try {
      setLoading(true);
      await api.giveJobOffer(job.jobId || job.id, status);
      navigation.goBack();
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>{t("home:newOffer")}</Text>
        <Text style={styles.label}>Customer</Text>
        <Text style={styles.value}>{job.userName || "Customer"}</Text>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{job.address || job.primaryAddress || "N/A"}</Text>
        <Text style={styles.label}>Scheduled</Text>
        <Text style={styles.value}>
          {job.scheduleTime ? new Date(job.scheduleTime).toLocaleString() : "Now"}
        </Text>
      </Card>
      <View style={styles.buttons}>
        <Button
          title={t("home:accept")}
          onPress={() => respond(JobStatus.accepted)}
        />
        <View style={{ height: 12 }} />
        <Button
          title={t("home:reject")}
          variant="danger"
          onPress={() => respond(JobStatus.rejected)}
        />
      </View>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 24, justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: "#333" },
  label: { fontSize: 13, color: "#999", marginTop: 12 },
  value: { fontSize: 15, color: "#333", marginTop: 4 },
  buttons: { marginTop: 24 },
});
