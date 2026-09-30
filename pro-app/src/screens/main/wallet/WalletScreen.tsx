import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);

  const fetchWalletBalance = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await api.getUserWallet();
      setBalance(res?.walletAmount ?? 0);
    } catch (e: any) {
      if (!isRefresh) showAlert("Error", e.message || "Failed to load wallet balance");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWalletBalance(false);
    }, [fetchWalletBalance])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWalletBalance(true);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeTab");
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={t("drawer:wallet")}
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
              name="shield-checkmark"
              size={15}
              color="rgba(255, 255, 255, 0.95)"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.cardFooterText}>
              Direct deposits processed automatically to your verified bank account.
            </Text>
          </View>
        </View>

        {/* Payout Schedule Notice Card */}
        <View style={styles.payoutNoticeCard}>
          <View style={styles.payoutNoticeIcon}>
            <MaterialCommunityIcons name="calendar-sync" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.payoutNoticeContent}>
            <Text style={styles.payoutNoticeTitle}>Weekly Payout Schedule</Text>
            <Text style={styles.payoutNoticeDesc}>
              Earnings, client tips, and bonuses are batched every Sunday midnight and transferred directly to your bank account on Mondays.
            </Text>
          </View>
        </View>

        {/* Quick Action Financial Tools */}
        <Text style={styles.sectionTitle}>FINANCIAL & PAYOUT CONTROLS</Text>

        {/* 1. Earnings & Job History */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("Earnings")}
          activeOpacity={0.85}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name="cash-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Earnings & Performance</Text>
            <Text style={styles.featureDesc}>
              Track weekly revenues, daily breakdown charts, appointments count, and tips.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 2. Banking & Direct Payouts */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() =>
            (navigation as any).navigate("Onboarding", {
              screen: "BankingLanguages",
              params: { isFromSettings: true, returnScreen: "Wallet" },
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name="business-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Banking & Direct Deposit</Text>
            <Text style={styles.featureDesc}>
              Manage your linked bank routing number, account number, and SSN for payouts.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 3. Job History */}
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate("History")}
          activeOpacity={0.85}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name="time-outline" size={22} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Completed Job History</Text>
            <Text style={styles.featureDesc}>
              View individual appointment invoices, earned amounts, customer notes, and dates.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* 4. Share & Earn Referral Bonuses */}
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
              Share your partner referral code with colleagues to earn bonus rewards.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>
      <LoadingOverlay visible={loading && !refreshing} />
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
    marginBottom: Spacing.md,
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
    lineHeight: 16,
  },
  payoutNoticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  payoutNoticeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    marginTop: 2,
  },
  payoutNoticeContent: {
    flex: 1,
  },
  payoutNoticeTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  payoutNoticeDesc: {
    fontSize: FontSizes.xs,
    color: "#64748B",
    lineHeight: 18,
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

