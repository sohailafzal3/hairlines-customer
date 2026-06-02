import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuthStore } from '../../store';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing } from '../../theme/spacing';

const menuItems = [
  { label: 'Book a Service', icon: '🏠', route: 'HomeStack' },
  { label: 'My Services', icon: '📋', route: 'MyJobs' },
  { label: 'Notifications', icon: '🔔', route: 'Notifications' },
  { label: 'Manage Account', icon: '👤', route: 'MyProfile' },
  { label: 'Wallet', icon: '💰', route: 'Wallet' },
  { label: 'Payment', icon: '💳', route: 'Payments' },
  { label: 'Invite Friends', icon: '🎁', route: 'ShareReferral' },
  { label: 'Promo Code', icon: '🏷️', route: 'PromoCodes' },
  { label: 'Contact Support', icon: '✉️', route: 'ContactSupport' },
  { label: 'Terms & Conditions', icon: '📄', route: 'Terms' },
];

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuthStore();
  const { navigation } = props;

  const handleLogout = async () => {
    await logout();
    // Navigation will automatically switch due to auth state change
  };

  return (
    <SafeAreaView style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0) || 'U'}
              {user?.lastName?.charAt(0) || ''}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.phone}>{user?.phoneNumber || ''}</Text>
        </View>

        {/* Menu Items */}
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.route as any)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </DrawerContentScrollView>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutIcon}>🚪</Text>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BGColor,
  },
  scrollContent: {
    paddingTop: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: Colors.BGColor,
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
  },
  name: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
  },
  phone: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuIcon: {
    fontSize: FontSizes.base,
    marginRight: Spacing.base,
    width: 24,
  },
  menuLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.TitleColor,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.CardColor,
  },
  logoutIcon: {
    fontSize: FontSizes.base,
    marginRight: Spacing.base,
    width: 24,
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.errorViewColor,
  },
});

export default CustomDrawerContent;
