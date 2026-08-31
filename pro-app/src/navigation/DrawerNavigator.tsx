import React from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
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
import { useUser } from "../context/UserContext";
import { api } from "../services/api";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TERMS_URL } from "../constants";

const Drawer = createDrawerNavigator<MainDrawerParamList>();

function CustomDrawerContent(props: any) {
  const { user, clearUser } = useUser();

  const handleLogout = async () => {
    try {
      await api.logOut();
    } catch (e) {
      // ignore
    }
    await api.clearSession();
    await clearUser();
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      <View style={styles.profile}>
        {user.profileImage ? (
          <Image source={{ uri: user.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.initial}>
              {user.name ? user.name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{user.name || "Service Provider"}</Text>
        <Text style={styles.status}>
          {user.isApproved ? "Approved" : "Pending Approval"}
        </Text>
      </View>

      <DrawerItem
        label="Home"
        icon={({ color }) => <Ionicons name="home-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("HomeTab")}
      />
      <DrawerItem
        label="Notifications"
        icon={({ color }) => <Ionicons name="notifications-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("Notifications")}
      />
      <DrawerItem
        label="Profile"
        icon={({ color }) => <Ionicons name="person-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("Profile")}
      />
      <DrawerItem
        label="Wallet"
        icon={({ color }) => <Ionicons name="wallet-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("Wallet")}
      />
      <DrawerItem
        label="Payment History"
        icon={({ color }) => <Ionicons name="cash-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("Earnings")}
      />
      <DrawerItem
        label="Settings"
        icon={({ color }) => <Ionicons name="settings-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("Settings")}
      />
      <DrawerItem
        label="Workers"
        icon={({ color }) => <Ionicons name="people-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("Workers")}
      />
      <DrawerItem
        label="History"
        icon={({ color }) => <Ionicons name="time-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("History")}
      />
      <DrawerItem
        label="Share & Get Discount"
        icon={({ color }) => <Ionicons name="share-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("ShareReferral")}
      />
      <DrawerItem
        label="Terms & Services"
        icon={({ color }) => <Ionicons name="document-text-outline" size={22} color={color} />}
        onPress={() =>
          props.navigation.navigate("Terms", { url: TERMS_URL, title: "Terms & Services" })
        }
      />
      <DrawerItem
        label="Contact Support"
        icon={({ color }) => <Ionicons name="headset-outline" size={22} color={color} />}
        onPress={() => props.navigation.navigate("Support")}
      />
      <DrawerItem
        label="Logout"
        icon={({ color }) => <Ionicons name="log-out-outline" size={22} color={color} />}
        onPress={handleLogout}
      />
    </DrawerContentScrollView>
  );
}

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="HomeTab" component={HomeTabNavigator} />
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
  profile: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    marginBottom: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    backgroundColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 24, fontWeight: "700", color: "#555" },
  name: { fontSize: 16, fontWeight: "600", color: "#333" },
  status: { fontSize: 13, color: "#777", marginTop: 2 },
});
