import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
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
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

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
            style={styles.mainActionBtn}
          />
        );
      case JobStatus.onTheWay:
        return (
          <Button
            title={t("home:arrived")}
            onPress={() => updateStatus(JobStatus.arrived)}
            style={styles.mainActionBtn}
          />
        );
      case JobStatus.arrived:
        return (
          <Button
            title={t("home:startService")}
            onPress={() => updateStatus(JobStatus.started)}
            style={styles.mainActionBtn}
          />
        );
      case JobStatus.started:
        return (
          <Button
            title={t("home:complete")}
            onPress={() => updateStatus(JobStatus.completed)}
            style={styles.mainActionBtn}
          />
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

  const statusName =
    (job.spJobStatus !== undefined ? JobStatus[job.spJobStatus] : null) ||
    "Upcoming";


  return (
    <View style={styles.container}>
      <Header title={t("job:details")} onBackPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Customer Profile Card */}
        <Card style={styles.userCard}>
          <View style={styles.row}>
            <Avatar uri={job.userProfileImage} name={job.userName} size={58} />
            <View style={styles.userInfo}>
              <View style={styles.userHeaderRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {job.userName || "Customer"}
                </Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{statusName}</Text>
                </View>
              </View>
              <Text style={styles.sub}>{job.serviceName}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={callUser}
              style={styles.contactBtn}
              activeOpacity={0.8}
            >
              <Ionicons
                name="call-outline"
                size={18}
                color={Colors.ButtonPrimaryColor}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.contactBtnText}>{t("job:call")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Chat", { jobId, title: job.userName })
              }
              style={styles.contactBtn}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={Colors.ButtonPrimaryColor}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.contactBtnText}>{t("job:chat")}</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Location & Instructions Card */}
        <Card style={styles.detailsCard}>
          <View style={styles.sectionRow}>
            <Ionicons
              name="location"
              size={20}
              color={Colors.ButtonPrimaryColor}
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Service Location</Text>
              <Text style={styles.sectionValue}>
                {job.streetAddress ? `${job.streetAddress}, ` : ""}
                {job.city || ""}{job.state ? `, ${job.state}` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.sectionRow}>
            <Ionicons
              name="reader-outline"
              size={20}
              color={Colors.ButtonPrimaryColor}
              style={{ marginRight: 8, marginTop: 2 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Special Instructions</Text>
              <Text style={styles.sectionValue}>
                {job.specialInstruction || "No special instructions provided."}
              </Text>
            </View>
          </View>
        </Card>

        {/* Pricing / Total Card */}
        <Card style={styles.priceCard}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Estimated Total</Text>
              <Text style={styles.totalPrice}>
                {formatCurrency(job.totalAmount, job.costBreakDown?.currency)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.breakdownBtn}
              onPress={() => navigation.navigate("CostBreakdown", { jobId })}
              activeOpacity={0.8}
            >
              <Text style={styles.breakdownBtnText}>
                {t("job:costBreakdown")}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={Colors.ButtonPrimaryColor}
              />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          {renderAction()}
          <Button
            title={t("home:cancel")}
            variant="ghost"
            style={styles.cancelBtn}
            textStyle={{ color: Colors.errorViewColor }}
            onPress={() =>
              navigation.navigate("CancellationReasons", { jobId })
            }
          />
        </View>
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  content: { padding: Spacing.base, paddingBottom: Spacing["3xl"] },
  userCard: {
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center" },
  userInfo: { flex: 1, marginLeft: 12 },
  userHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    flex: 1,
  },
  sub: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.ButtonPrimaryColor,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    textTransform: "uppercase",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: Spacing.base,
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: BorderRadius.lg,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  contactBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.TitleColor,
  },
  detailsCard: {
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
    lineHeight: 20,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: Spacing.md,
  },
  priceCard: {
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalPrice: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    marginTop: 2,
  },
  breakdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  breakdownBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  buttonGroup: {
    marginTop: Spacing.sm,
    gap: 10,
  },
  mainActionBtn: {
    width: "100%",
  },
  cancelBtn: {
    borderColor: Colors.BorderColor,
  },
});

