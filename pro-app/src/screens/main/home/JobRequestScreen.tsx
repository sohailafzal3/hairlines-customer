import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { HomeTabParamList } from "../../../navigation/types";
import { Button } from "../../../components/Button";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { JobStatus } from "../../../constants";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

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
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.urgentBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
            <Text style={styles.urgentText}>NEW SERVICE REQUEST</Text>
          </View>
        </View>

        <View style={styles.userSection}>
          <Avatar uri={job.userProfileImage} name={job.userName} size={64} />
          <Text style={styles.userName}>{job.userName || "Customer"}</Text>
          <Text style={styles.serviceName}>{job.serviceName || "Grooming Service"}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>SERVICE LOCATION</Text>
            <Text style={styles.value}>{job.address || job.primaryAddress || "Address provided upon acceptance"}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={18} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>SCHEDULED TIME</Text>
            <Text style={styles.value}>
              {job.scheduleTime ? new Date(job.scheduleTime).toLocaleString() : "Immediate (Now)"}
            </Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <Button
            title="ACCEPT REQUEST"
            onPress={() => respond(JobStatus.accepted)}
          />
          <View style={{ height: 10 }} />
          <Button
            title="DECLINE"
            variant="ghost"
            textStyle={{ color: Colors.errorViewColor }}
            style={{ borderColor: Colors.BorderColor }}
            onPress={() => respond(JobStatus.rejected)}
          />
        </View>
      </View>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    padding: Spacing.xl,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius["2xl"],
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeRow: {
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 1,
  },
  userSection: {
    alignItems: "center",
    marginBottom: Spacing.base,
  },
  userName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginTop: Spacing.sm,
  },
  serviceName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.ButtonPrimaryColor,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: Spacing.base,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  value: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
    lineHeight: 18,
  },
  buttons: { marginTop: Spacing.lg },
});

