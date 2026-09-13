import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { api } from "../../../services/api";
import { showAlert, formatCurrency } from "../../../utils/helpers";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";

type Props = DrawerScreenProps<MainDrawerParamList, "Wallet">;

export function WalletScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    api
      .getUserWallet()
      .then((res) => setBalance(res.walletAmount ?? 0))
      .catch((e) => showAlert("Error", e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title={t("drawer:wallet")}
        onMenuPress={() => navigation.openDrawer()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Luxury Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.cardBrandText}>HAIRLINES PRO BALANCE</Text>
          </View>

          <Text style={styles.balanceLabel}>Available Payout Balance</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>

          <View style={styles.cardDivider} />

          <View style={styles.cardFooterRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color="rgba(255, 255, 255, 0.85)"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.cardFooterText}>
              Direct deposits processed securely to your linked account
            </Text>
          </View>
        </View>

        {/* Quick Action Navigation */}
        <Text style={styles.sectionTitle}>FINANCIAL TOOLS</Text>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("Earnings")}
          activeOpacity={0.85}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name="cash-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Earnings & Job History</Text>
            <Text style={styles.featureDesc}>
              Track your weekly payouts, completed services, and tips breakdown.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("ShareReferral")}
          activeOpacity={0.85}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name="gift-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Invite Pros & Earn Rewards</Text>
            <Text style={styles.featureDesc}>
              Share your referral code with other service providers to receive partner bonuses.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>
      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing["3xl"],
  },
  balanceCard: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  walletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  cardBrandText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: "rgba(255, 255, 255, 0.9)",
    letterSpacing: 2,
  },
  balanceLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: "rgba(255, 255, 255, 0.75)",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: FontSizes["3xl"] + 4,
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
    marginBottom: Spacing.lg,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginBottom: Spacing.md,
  },
  cardFooterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardFooterText: {
    fontSize: FontSizes.xs,
    color: "rgba(255, 255, 255, 0.85)",
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  featureTextWrapper: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  featureTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FontSizes.xs + 1,
    color: Colors.DescriptionTextDark,
    lineHeight: 18,
  },
});

