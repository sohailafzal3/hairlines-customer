import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTLoading } from '../../components/common';
import { ProfileApi } from '../../api';
import { useApi } from '../../hooks';
import { useUserStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'Wallet'>;
};

const WalletScreen: React.FC<Props> = ({ navigation }) => {
  const { walletAmount, setWalletAmount } = useUserStore();

  const {
    data: walletData,
    loading,
    execute: fetchWallet,
  } = useApi<any>(ProfileApi.fetchWallet);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const result = await fetchWallet();
    if (result?.walletAmount !== undefined) {
      setWalletAmount(result.walletAmount);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).openDrawer?.()}
          style={styles.menuButton}
          activeOpacity={0.8}
        >
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Luxury Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet" size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.cardBrandText}>HAIRLINES PAY</Text>
          </View>

          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ${walletAmount?.toFixed(2) || '0.00'}
          </Text>

          <View style={styles.cardDivider} />

          <View style={styles.cardFooterRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 6 }} />
            <Text style={styles.cardFooterText}>
              Automatically applied to your next service booking
            </Text>
          </View>
        </View>

        {/* Quick Features Section */}
        <Text style={styles.sectionTitle}>WAYS TO EARN & SAVE</Text>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('ShareReferral' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name="gift-outline" size={24} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Invite Friends & Earn Credits</Text>
            <Text style={styles.featureDesc}>
              Share your referral link with friends and get credits when they book.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('PromoCodes' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.featureIconContainer}>
            <Ionicons name="pricetag-outline" size={24} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={styles.featureTextWrapper}>
            <Text style={styles.featureTitle}>Apply Promo Codes</Text>
            <Text style={styles.featureDesc}>
              Redeem exclusive discount codes for instant savings at checkout.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>

      <VTLoading visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  walletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  cardBrandText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 2,
  },
  balanceLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: FontSizes['3xl'] + 4,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
    marginBottom: Spacing.lg,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: Spacing.md,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooterText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: 'rgba(255, 255, 255, 0.85)',
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureTextWrapper: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  featureTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    lineHeight: 18,
  },
});

export default WalletScreen;
