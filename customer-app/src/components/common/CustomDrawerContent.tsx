import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface MenuItem {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Book a Service', iconName: 'cut-outline', route: 'HomeStack' },
  { label: 'My Bookings', iconName: 'calendar-outline', route: 'MyJobs' },
  { label: 'Notifications', iconName: 'notifications-outline', route: 'Notifications' },
  { label: 'Manage Account', iconName: 'person-outline', route: 'MyProfile' },
  { label: 'Wallet & Balance', iconName: 'wallet-outline', route: 'Wallet' },
  { label: 'Payment Methods', iconName: 'card-outline', route: 'Payments' },
  { label: 'Invite & Earn', iconName: 'gift-outline', route: 'ShareReferral', badge: 'Free $10' },
  { label: 'Promo Codes', iconName: 'pricetag-outline', route: 'PromoCodes' },
  { label: 'Help & Support', iconName: 'headset-outline', route: 'ContactSupport' },
  { label: 'Terms & Policies', iconName: 'document-text-outline', route: 'Terms' },
];

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, logout } = useAuthStore();
  const { navigation, state } = props;

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your Hairlines account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    const combined = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    if (combined) return combined;
    return 'Valued Customer';
  };

  const getUserSubText = () => {
    if (user?.phoneNumber) {
      return `${user.countryCode || ''} ${user.phoneNumber}`.trim();
    }
    if (user?.email) return user.email;
    return 'Hairlines Customer';
  };

  const getInitials = () => {
    const nameStr = getUserDisplayName();
    const parts = nameStr.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return nameStr.charAt(0).toUpperCase() || 'C';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Customer Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {user?.profileImage ? (
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
                <Text style={styles.proTagText}>Customer</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Navigation Menu Options */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            const isFocused = state?.routes[state.index]?.name === item.route;

            return (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, isFocused && styles.menuItemActive]}
                onPress={() => navigation.navigate(item.route as any)}
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
                    color={isFocused ? Colors.ButtonPrimaryColor : '#64748B'}
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
                  color={isFocused ? Colors.ButtonPrimaryColor : '#CBD5E1'}
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
        <Text style={styles.appVersionText}>Hairlines Customer v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
  },
  avatarWrapper: {
    position: 'relative',
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    color: '#64748B',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: Spacing.md,
  },
  menuSection: {
    width: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#EEF4FF',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconContainerActive: {
    backgroundColor: '#FFFFFF',
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
    color: '#334155',
  },
  menuLabelActive: {
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  badgeContainer: {
    backgroundColor: Colors.ButtonPrimaryRight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  arrowIcon: {
    marginLeft: 4,
  },
  footerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.errorViewColor,
  },
  appVersionText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default CustomDrawerContent;

