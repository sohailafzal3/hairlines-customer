import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, Card } from '../../components';
import { ProfileApi } from '../../api';
import { useUserStore } from '../../store';
import { VTLoading } from '../../components/common';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'Wallet'>;
};

const WalletScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { walletAmount, setWalletAmount } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res: any = await ProfileApi.fetchWallet();
      if (res?.walletAmount !== undefined) {
        setWalletAmount(res.walletAmount);
      }
    } catch (e) {
      console.log('Error fetching wallet:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="My Wallet"
        left={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              if ((navigation as any).openDrawer) {
                (navigation as any).openDrawer();
              } else if ((navigation.getParent() as any)?.openDrawer) {
                (navigation.getParent() as any).openDrawer();
              } else {
                navigation.dispatch(DrawerActions.openDrawer());
              }
            }}
          >
            <Ionicons name="menu" size={26} color={Colors.TitleColor} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 30 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.ButtonPrimaryColor]}
          />
        }
      >
        {/* Wallet Balance Hero Card */}
        <View style={styles.balanceHeroCard}>
          <View style={styles.balanceTopRow}>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet" size={24} color="#E5B652" />
            </View>
            <View style={styles.activeTag}>
              <Ionicons name="checkmark-circle" size={13} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.activeTagText}>Ready to use</Text>
            </View>
          </View>

          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ${walletAmount ? Number(walletAmount).toFixed(2) : '0.00'}
          </Text>

          <View style={styles.balanceDivider} />

          <View style={styles.balanceFooterRow}>
            <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.balanceFooterText}>
              Credits are automatically applied towards your appointment total at checkout.
            </Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionHeading}>Earn & Save</Text>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('ShareReferral')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconBadge, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="gift" size={22} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.actionTitle}>Invite Friends & Earn Credits</Text>
            <Text style={styles.actionSubtitle}>
              Share your referral link with friends and get credits when they book.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('PromoCodes')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconBadge, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="pricetag" size={22} color="#2563EB" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.actionTitle}>Promo Codes & Discounts</Text>
            <Text style={styles.actionSubtitle}>
              View active voucher codes or redeem special seasonal promotions.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Payments')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconBadge, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="card" size={22} color="#059669" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.actionTitle}>Payment Methods</Text>
            <Text style={styles.actionSubtitle}>
              Manage your saved credit / debit cards for seamless billing.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>

      <VTLoading visible={loading && !refreshing} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  balanceHeroCard: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: 20,
    padding: 22,
    marginBottom: Spacing.base,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeTagText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: '#34D399',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  balanceDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 14,
  },
  balanceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceFooterText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
    lineHeight: 16,
  },
  sectionHeading: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginTop: 10,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
});

export default WalletScreen;
