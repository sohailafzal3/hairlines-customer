import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  RefreshControl,
} from "react-native";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Button } from "../../../components/Button";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { useUser } from "../../../context/UserContext";
import { api } from "../../../services/api";
import * as Clipboard from "expo-clipboard";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = DrawerScreenProps<MainDrawerParamList, "ShareReferral">;

export function ShareReferralScreen({ navigation }: Props) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [referralInfo, setReferralInfo] = useState<any>(null);

  const code = user.referralCode || "HAIRPRO";

  const loadReferralData = useCallback(async () => {
    try {
      const res = await api.getReferralInfo();
      if (res) {
        setReferralInfo(res);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReferralData();
    }, [loadReferralData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReferralData();
  };

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    showAlert("Copied", `Referral code "${code}" copied to clipboard!`);
  };

  const share = async () => {
    const message = `Join Hairlines Pro using my partner code ${code} and start growing your beauty & styling business! Download now: https://hairlines.app`;
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          await (navigator as any).share({
            title: "Hairlines Pro Referral",
            text: message,
          });
        } else {
          await Clipboard.setStringAsync(code);
          showAlert(
            "Referral Code",
            `Referral code "${code}" copied to clipboard!`
          );
        }
      } else {
        await Share.share({
          message,
          title: "Hairlines Pro Referral",
        });
      }
    } catch (error: any) {
      if (
        error.message &&
        !error.message.includes("dismissed") &&
        !error.message.includes("canceled")
      ) {
        showAlert("Notice", error.message);
      }
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Settings");
    }
  };

  const totalReferrals = referralInfo?.totalReferrals ?? 0;
  const totalEarned = referralInfo?.totalEarnings ?? referralInfo?.totalReward ?? 0;

  return (
    <View style={styles.container}>
      <Header
        title="Invite & Earn"
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.ButtonPrimaryColor]}
            tintColor={Colors.ButtonPrimaryColor}
          />
        }
      >
        {/* Banner Section */}
        <View style={styles.iconCircle}>
          <Ionicons name="gift" size={36} color={Colors.ButtonPrimaryColor} />
        </View>

        <Text style={styles.title}>Invite Stylists & Barbers</Text>
        <Text style={styles.subtitle}>
          Share your partner code with fellow beauty professionals. Earn bonus commission rewards when they register and start accepting bookings!
        </Text>

        {/* Code Box */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>YOUR UNIQUE REFERRAL CODE</Text>
          <Text style={styles.code}>{code}</Text>

          <TouchableOpacity
            style={styles.copyPill}
            onPress={copy}
            activeOpacity={0.8}
          >
            <Ionicons
              name="copy-outline"
              size={14}
              color={Colors.ButtonPrimaryColor}
              style={{ marginRight: 4 }}
            />
            <Text style={styles.copyPillText}>Tap to Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Summary Card */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{totalReferrals}</Text>
            <Text style={styles.statLabel}>Pros Joined</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>
              {formatCurrency(totalEarned)}
            </Text>
            <Text style={styles.statLabel}>Referral Rewards</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <Button
          title="Share Referral Code"
          onPress={share}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <Button
          title="Copy Code"
          variant="secondary"
          onPress={copy}
          style={{ width: "100%", marginBottom: Spacing.xl }}
        />

        {/* How It Works Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsHeading}>How It Works</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDesc}>
                Send your unique code or link to barbers, stylists, and salon professionals.
              </Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Colleague Signs Up</Text>
              <Text style={styles.stepDesc}>
                They register their Hairlines Pro account using your referral code.
              </Text>
            </View>
          </View>

          <View style={[styles.stepRow, { marginBottom: 0 }]}>
            <View style={[styles.stepNumCircle, { backgroundColor: "#ECFDF5" }]}>
              <Text style={[styles.stepNumText, { color: "#059669" }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Earn Bonus Cash</Text>
              <Text style={styles.stepDesc}>
                You receive instant reward credits added to your payout balance upon their completed bookings.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <LoadingOverlay visible={loading && !refreshing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  content: {
    padding: Spacing.xl,
    alignItems: "center",
    flexGrow: 1,
    paddingBottom: Spacing["3xl"],
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  codeCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: "#EEF4FF",
    borderStyle: "dashed",
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.base,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  codeLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  code: {
    fontSize: FontSizes["3xl"] + 2,
    fontWeight: FontWeights.heavy,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 4,
    marginBottom: Spacing.md,
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  copyPillText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  statsCard: {
    width: "100%",
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.DescriptionTextDark,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: Spacing.md,
  },
  stepsCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepsHeading: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: Spacing.base,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.base,
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepNumText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    lineHeight: 18,
  },
});


