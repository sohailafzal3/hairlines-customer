import React from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from "@react-navigation/drawer";
import { MainDrawerParamList } from "./types";
import { HomeTabNavigator } from "./HomeTabNavigator";
import { NotificationsScreen } from "../screens/main/notifications/NotificationsScreen";
import { MyProfileScreen } from "../screens/main/profile/MyProfileScreen";
import { WalletScreen } from "../screens/main/wallet/WalletScreen";
import { EarningsScreen } from "../screens/main/earnings/EarningsScreen";
import { SettingsScreen } from "../screens/main/settings/SettingsScreen";
import { ShareReferralScreen } from "../screens/main/settings/ShareReferralScreen";
import { WebViewScreen } from "../screens/main/settings/WebViewScreen";
import { ContactSupportScreen } from "../screens/main/settings/ContactSupportScreen";
import { WorkersListScreen } from "../screens/main/workers/WorkersListScreen";
import { CreateWorkerScreen } from "../screens/main/workers/CreateWorkerScreen";
import { HistoryScreen } from "../screens/main/history/HistoryScreen";
import { WorkModeScreen } from "../screens/main/workmode/WorkModeScreen";
import { AvailabilityScreen } from "../screens/onboarding/AvailabilityScreen";
import { CleanerAvailabilityScreen } from "../screens/main/availability/CleanerAvailabilityScreen";
import { useUser } from "../context/UserContext";
import { api } from "../services/api";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { TERMS_URL } from "../constants";
import { Colors } from "../theme/colors";
import { FontSizes, FontWeights } from "../theme/fonts";
import { BorderRadius, Spacing } from "../theme/spacing";

const Drawer = createDrawerNavigator<MainDrawerParamList>();

interface MenuItem {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  route: string;
  params?: any;
  badge?: string;
}

const menuItems: MenuItem[] = [
  { label: "Home", iconName: "home-outline", route: "HomeTab" },
  { label: "Notifications", iconName: "notifications-outline", route: "Notifications" },
  { label: "My Profile", iconName: "person-outline", route: "Profile" },
  { label: "Wallet & Balance", iconName: "wallet-outline", route: "Wallet" },
  { label: "Earnings & Payouts", iconName: "cash-outline", route: "Earnings" },
  { label: "Manage Workers", iconName: "people-outline", route: "Workers" },
  { label: "Job History", iconName: "time-outline", route: "History" },
  { label: "Settings", iconName: "settings-outline", route: "Settings" },
  { label: "Share & Earn", iconName: "gift-outline", route: "ShareReferral", badge: "Rewards" },
  {
    label: "Terms & Policies",
    iconName: "document-text-outline",
    route: "Terms",
    params: { url: TERMS_URL, title: "Terms & Services" },
  },
  { label: "Help & Support", iconName: "headset-outline", route: "Support" },
];

function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, clearUser } = useUser();
  const { navigation, state } = props;

  const handleLogout = async () => {
    try {
      await api.logOut();
    } catch (e) {
      // ignore
    }
    await api.clearSession();
    await clearUser();
  };

  const getUserDisplayName = () => {
    if (user.name) return user.name;
    const combined = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    if (combined) return combined;
    return "Service Provider";
  };

  const getUserSubText = () => {
    if (user.phoneNumber) {
      return `${user.phoneCode || ""} ${user.phoneNumber}`.trim();
    }
    if (user.email) return user.email;
    return "Hairlines Professional";
  };

  const getInitials = () => {
    const nameStr = getUserDisplayName();
    const parts = nameStr.split(" ");
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return nameStr.charAt(0).toUpperCase() || "P";
  };

  const getUserRating = () => {
    if (user.avgRating && user.avgRating > 0) return user.avgRating.toFixed(1);
    return "0.0";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
            )}
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {getUserDisplayName()}
            </Text>
            <Text style={styles.userPhone} numberOfLines={1}>
              {getUserSubText()}
            </Text>

            <View style={styles.tagRow}>
              <View style={styles.proTag}>
                <Ionicons
                  name="shield-checkmark"
                  size={10}
                  color={Colors.ButtonPrimaryColor}
                  style={{ marginRight: 3 }}
                />
                <Text style={styles.proTagText}>
                  {user.isApproved ? "Verified Pro" : "Pending"}
                </Text>
              </View>

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={10} color="#854D0E" style={{ marginRight: 3 }} />
                <Text style={styles.ratingText}>{getUserRating()} ★</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Navigation Menu Options */}
        <View style={styles.menuSection}>
          {menuItems
            .filter((item) => {
              if (item.route === "Workers") {
                // Manage Workers is ONLY visible for Company providers (accountType === 2 or has companyName and not a company worker)
                const isCompany =
                  user.accountType === 2 ||
                  (Boolean(user.companyName) && !user.isCompanyWorker);
                return isCompany;
              }
              return true;
            })
            .map((item, index) => {
              const isFocused = state?.routes[state.index]?.name === item.route;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, isFocused && styles.menuItemActive]}
                  onPress={() => navigation.navigate(item.route, item.params)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      isFocused && styles.iconContainerActive,
                    ]}
                  >
                    <Ionicons
                      name={item.iconName}
                      size={20}
                      color={isFocused ? Colors.ButtonPrimaryColor : "#64748B"}
                    />
                  </View>

                  <Text
                    style={[styles.menuLabel, isFocused && styles.menuLabelActive]}
                  >
                    {item.label}
                  </Text>

                  {item.badge && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}

                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isFocused ? Colors.ButtonPrimaryColor : "#CBD5E1"}
                    style={styles.arrowIcon}
                  />
                </TouchableOpacity>
              );
            })}
        </View>
      </DrawerContentScrollView>

      {/* Footer Area - Logout */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={Colors.errorViewColor}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.logoutText}>Logout Account</Text>
        </TouchableOpacity>
        <Text style={styles.appVersionText}>Hairlines Pro v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: "82%",
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      <Drawer.Screen name="HomeTab" component={HomeTabNavigator} />
      <Drawer.Screen name="WorkMode" component={WorkModeScreen} />
      <Drawer.Screen name="Availability" component={AvailabilityScreen} />
      <Drawer.Screen name="CleanerAvailability" component={CleanerAvailabilityScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="Profile" component={MyProfileScreen} />
      <Drawer.Screen name="Wallet" component={WalletScreen} />
      <Drawer.Screen name="Earnings" component={EarningsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="ShareReferral" component={ShareReferralScreen} />
      <Drawer.Screen name="Terms" component={WebViewScreen} />
      <Drawer.Screen name="Support" component={ContactSupportScreen} />
      <Drawer.Screen name="Workers" component={WorkersListScreen} />
      <Drawer.Screen name="CreateWorker" component={CreateWorkerScreen} />
      <Drawer.Screen name="History" component={HistoryScreen} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: Colors.ButtonTextColor,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: "#0F172A",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    color: "#64748B",
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  proTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9EE",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(229, 182, 82, 0.35)",
  },
  proTagText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: "#854D0E",
    textTransform: "uppercase",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  ratingText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: "#854D0E",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: Spacing.md,
  },
  menuSection: {
    width: "100%",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: "#FEF9EE",
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  iconContainerActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: "#334155",
  },
  menuLabelActive: {
    fontWeight: FontWeights.bold,
    color: "#854D0E",
  },
  badgeContainer: {
    backgroundColor: Colors.errorViewColor,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
  },
  arrowIcon: {
    marginLeft: 4,
  },
  footerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.errorViewColor,
  },
  appVersionText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});

