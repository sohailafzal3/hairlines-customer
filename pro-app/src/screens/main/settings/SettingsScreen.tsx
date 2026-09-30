import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { MainDrawerParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";
import { TERMS_URL } from "../../../constants";
import { useUser } from "../../../context/UserContext";

type Props = DrawerScreenProps<MainDrawerParamList, "Settings">;

interface SettingItem {
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  action: () => void;
  badge?: string;
}

export function SettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  const isCompany =
    user.accountType === 2 ||
    (Boolean(user.companyName) && !user.isCompanyWorker);

  const serviceSettings: SettingItem[] = [
    {
      label: "Job Availability",
      sub: "Configure working days and daily hours",
      icon: "calendar-outline",
      action: () =>
        (navigation as any).navigate("Onboarding", {
          screen: "Availability",
          params: { isFromSettings: true },
        }),
    },
    {
      label: "Tools & Equipment",
      sub: "Manage your professional equipment checklist",
      icon: "construct-outline",
      action: () =>
        (navigation as any).navigate("HomeTab", {
          screen: "ToolsAndEquipment",
          params: { isFromSettings: true },
        }),
    },
    {
      label: "Edit Services & Rates",
      sub: "Select offered services and customize dollar ($) pricing",
      icon: "cut-outline",
      action: () =>
        (navigation as any).navigate("Onboarding", {
          screen: "Services",
          params: { isFromSettings: true },
        }),
    },
    {
      label: "Service Category / Roles",
      sub: "Barber, Stylist, or Cleaning Pro category",
      icon: "apps-outline",
      action: () =>
        (navigation as any).navigate("Onboarding", {
          screen: "ServicesFor",
          params: { isFromSettings: true },
        }),
    },
  ];

  const accountSettings: SettingItem[] = [
    {
      label: "Banking & Direct Payouts",
      sub: "Routing number, bank account & SSN details",
      icon: "card-outline",
      action: () =>
        (navigation as any).navigate("Onboarding", {
          screen: "BankingLanguages",
          params: { isFromSettings: true },
        }),
    },
    {
      label: "Photo ID Verification",
      sub: "Government issued identity documents",
      icon: "id-card-outline",
      action: () =>
        (navigation as any).navigate("Onboarding", {
          screen: "IdentityDocuments",
          params: { isFromSettings: true },
        }),
    },
    {
      label: "Professional Licenses",
      sub: "Certificates, licensing & expiry dates",
      icon: "ribbon-outline",
      action: () =>
        (navigation as any).navigate("Onboarding", {
          screen: "Certificates",
          params: { isFromSettings: true },
        }),
    },
    ...(isCompany
      ? [
          {
            label: "Manage Team Workers",
            sub: "Invite and manage company service providers",
            icon: "people-outline" as const,
            action: () => navigation.navigate("Workers"),
          },
        ]
      : []),
  ];

  const generalSettings: SettingItem[] = [
    {
      label: "Share & Earn Referral",
      sub: "Invite friends and earn partner rewards",
      icon: "gift-outline",
      badge: "Rewards",
      action: () => navigation.navigate("ShareReferral"),
    },
    {
      label: "Terms & Policies",
      sub: "Terms of service and privacy statement",
      icon: "document-text-outline",
      action: () =>
        navigation.navigate("Terms", {
          url: TERMS_URL,
          title: "Terms & Policies",
        }),
    },
    {
      label: "Help & Support",
      sub: "Contact customer care & support center",
      icon: "headset-outline",
      action: () => navigation.navigate("Support"),
    },
  ];

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("HomeTab");
    }
  };

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.card}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <TouchableOpacity
              key={item.label}
              style={[styles.row, !isLast && styles.rowBorder]}
              onPress={item.action}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={Colors.ButtonPrimaryColor}
                />
              </View>

              <View style={styles.textWrap}>
                <View style={styles.titleRow}>
                  <Text style={styles.label}>{item.label}</Text>
                  {item.badge && (
                    <View style={styles.badgeWrap}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.subText}>{item.sub}</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#CBD5E1"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header
        title={t("drawer:settings")}
        onBackPress={handleBack}
        right={
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.headerMenuBtn}
          >
            <Ionicons name="menu" size={24} color={Colors.NavigationTitle} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderSection("SERVICE & WORKING HOURS", serviceSettings)}
        {renderSection("ACCOUNT & VERIFICATION", accountSettings)}
        {renderSection("GENERAL & SUPPORT", generalSettings)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  headerMenuBtn: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  sectionWrap: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  textWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: FontSizes.sm + 1,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  badgeWrap: {
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
  },
  subText: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 2,
    lineHeight: 16,
  },
});


