import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useJobStore } from '../../store';
import { ProfileApi } from '../../api';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface MenuItem {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
}

const menuItems: MenuItem[] = [
  { label: 'Book a Service', iconName: 'cut-outline', route: 'HomeStack' },
  { label: 'My Services', iconName: 'calendar-outline', route: 'MyJobs' },
  { label: 'Notifications', iconName: 'notifications-outline', route: 'Notifications' },
  { label: 'Manage Account', iconName: 'person-circle-outline', route: 'MyProfile' },
  { label: 'Wallet', iconName: 'wallet-outline', route: 'Wallet' },
  { label: 'Payment Methods', iconName: 'card-outline', route: 'Payments' },
  { label: 'Invite Friends', iconName: 'gift-outline', route: 'ShareReferral', badge: 'Rewards' },
  { label: 'Promo Code', iconName: 'pricetag-outline', route: 'PromoCodes' },
  { label: 'Contact Support', iconName: 'headset-outline', route: 'ContactSupport' },
  { label: 'Terms & Conditions', iconName: 'document-text-outline', route: 'Terms' },
];

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { user, account, isGuest, logout, updateUserField } = useAuthStore();
  const { navigation, state } = props;

  useEffect(() => {
    if (!isGuest) {
      ProfileApi.fetchProfile()
        .then((res: any) => {
          const data = res?.data || res;
          if (data && typeof data.avgRating === 'number') {
            updateUserField('avgRating', data.avgRating);
          }
        })
        .catch(() => {});
    }
  }, [isGuest]);

  const handleLogout = async () => {
    await logout();
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.firstName) return `${user.firstName} ${user.lastName || ''}`.trim();
    if (account?.name) return account.name;
    if (account?.firstName) return `${account.firstName} ${account.lastName || ''}`.trim();
    return isGuest ? 'Guest User' : 'Customer Account';
  };

  const getUserSubText = () => {
    if (user?.phoneNumber || account?.phoneNumber) {
      const code = user?.phoneCode || account?.phoneCode || '';
      const phone = user?.phoneNumber || account?.phoneNumber || '';
      return `${code} ${phone}`.trim();
    }
    if (user?.email || account?.email) return user?.email || account?.email || '';
    return 'Member Account';
  };

  const getRatingValue = (): number => {
    const r = user?.avgRating ?? (account as any)?.avgRating;
    if (typeof r === 'number' && !isNaN(r)) return r;
    const parsed = parseFloat(String(r));
    return !isNaN(parsed) ? parsed : 0;
  };

  const getInitials = () => {
    const nameStr = getUserDisplayName();
    if (!nameStr || nameStr === 'Guest User' || nameStr === 'Customer Account') return 'H';
    const parts = nameStr.split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return nameStr.charAt(0).toUpperCase() || 'H';
  };

  const handleMenuItemPress = (route: string) => {
    if (route === 'HomeStack') {
      useJobStore.getState().resetCreateJob();
    }
    navigation.navigate(route as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials()}</Text>
            </View>
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {getUserDisplayName()}
            </Text>
            <Text style={styles.userPhone} numberOfLines={1}>
              {getUserSubText()}
            </Text>

            {!isGuest ? (
              <View style={styles.ratingRow}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const rating = getRatingValue();
                    return (
                      <Ionicons
                        key={star}
                        name={
                          rating >= star
                            ? 'star'
                            : rating >= star - 0.5
                            ? 'star-half'
                            : 'star-outline'
                        }
                        size={12}
                        color="#E5B652"
                        style={{ marginRight: 2 }}
                      />
                    );
                  })}
                </View>
                <Text style={styles.ratingValueText}>
                  {getRatingValue() > 0 ? getRatingValue().toFixed(1) : '0.0'}
                </Text>
              </View>
            ) : (
              <View style={styles.tagRow}>
                <View style={styles.memberTag}>
                  <Ionicons name="sparkles" size={10} color={Colors.ButtonPrimaryColor} style={{ marginRight: 3 }} />
                  <Text style={styles.memberTagText}>Guest</Text>
                </View>
              </View>
            )}
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
                onPress={() => handleMenuItemPress(item.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
                  <Ionicons
                    name={item.iconName}
                    size={20}
                    color={isFocused ? Colors.ButtonPrimaryColor : '#64748B'}
                  />
                </View>

                <Text style={[styles.menuLabel, isFocused && styles.menuLabelActive]}>
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

      {/* Footer Area - Logout Button */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.errorViewColor} style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Logout Account</Text>
        </TouchableOpacity>
        <Text style={styles.appVersionText}>Hairlines v1.0.0</Text>
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
    borderColor: '#F1F5F9',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
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
    fontFamily: Fonts.uberMoveBold,
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
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    flexWrap: 'wrap',
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValueText: {
    fontSize: 11,
    fontFamily: Fonts.uberMoveBold,
    color: '#854D0E',
    marginRight: 4,
  },
  memberTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  memberTagText: {
    fontSize: 9,
    fontFamily: Fonts.uberMoveBold,
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
    paddingVertical: 11,
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
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: '#334155',
  },
  menuLabelActive: {
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  badgeContainer: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: Fonts.uberMoveBold,
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
    fontFamily: Fonts.uberMoveBold,
    color: Colors.errorViewColor,
  },
  appVersionText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default CustomDrawerContent;
