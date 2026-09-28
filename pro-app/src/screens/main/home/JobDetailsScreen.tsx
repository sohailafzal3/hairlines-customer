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

  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const detail = await api.getJobDetail(jobId);
      setJob(detail);
      if (detail.spJobStatus === JobStatus.started) {
        const currentTime = Date.now() / 1000;
        const elapsed = Math.max(
          0,
          Math.floor(currentTime - (detail.jobStartTime || currentTime)) -
            (detail.jobPauseStartTiming || 0)
        );
        setTimerSeconds(elapsed);
        setIsTimerRunning(detail.isJobStart ?? true);
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && job?.spJobStatus === JobStatus.started) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, job?.spJobStatus]);

  const togglePausePlay = async () => {
    try {
      setLoading(true);
      await api.pauseStartJob(jobId);
      setIsTimerRunning((prev) => !prev);
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimerDisplay = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = Math.floor(sec % 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
  };

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

  const handleStartService = () => {
    if (job?.isJobConsultant && !job?.isConsultantServiceSelected) {
      navigation.navigate("ServicesSelection", { jobId });
    } else {
      updateStatus(JobStatus.started);
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
            onPress={handleStartService}
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
        {/* Active Service Timer (Only visible when status is started) */}
        {job.spJobStatus === JobStatus.started && (
          <Card style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Ionicons name="stopwatch-outline" size={20} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.timerTitle}>SERVICE IN PROGRESS</Text>
            </View>
            <Text style={styles.timerValue}>{formatTimerDisplay(timerSeconds)}</Text>
            <TouchableOpacity
              style={[
                styles.timerToggleBtn,
                { backgroundColor: isTimerRunning ? "#FEE2E2" : "#DCFCE7" },
              ]}
              onPress={togglePausePlay}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isTimerRunning ? "pause" : "play"}
                size={16}
                color={isTimerRunning ? "#DC2626" : "#16A34A"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.timerToggleText,
                  { color: isTimerRunning ? "#DC2626" : "#16A34A" },
                ]}
              >
                {isTimerRunning ? "Pause Service" : "Resume Service"}
              </Text>
            </TouchableOpacity>
          </Card>
        )}

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

        {/* Appointment For Card (if booking for someone else or self) */}
        {job.memberName ? (
          <Card style={styles.detailsCard}>
            <View style={styles.sectionRow}>
              <Ionicons
                name="people-outline"
                size={20}
                color={Colors.ButtonPrimaryColor}
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionLabel}>Appointment For</Text>
                <Text style={styles.sectionValue}>
                  {job.memberName} {job.memberRelation ? `(${job.memberRelation})` : ""}
                </Text>
                {job.memberAge ? (
                  <Text style={[styles.sectionValue, { color: Colors.DescriptionTextDark, fontSize: FontSizes.xs, marginTop: 2 }]}>
                    Age: {job.memberAge} {job.memberHealth ? `• Health: ${job.memberHealth}` : ""}
                  </Text>
                ) : null}
              </View>
            </View>
          </Card>
        ) : null}

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
  timerCard: {
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    backgroundColor: "#F0FDF4",
    borderColor: "#86EFAC",
    borderWidth: 1,
    alignItems: "center",
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  timerTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    marginLeft: 6,
    letterSpacing: 1,
  },
  timerValue: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    fontVariant: ["tabular-nums"],
    marginVertical: 4,
  },
  timerToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginTop: 8,
  },
  timerToggleText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },
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

