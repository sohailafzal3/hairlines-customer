import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>
            ${walletAmount?.toFixed(2) || '0.00'}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.balanceHint}>
            Wallet balance can be used towards service bookings
          </Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>💰</Text>
            <Text style={styles.infoTitle}>Earn Credits</Text>
            <Text style={styles.infoDesc}>
              Invite friends and earn referral credits towards your next booking
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>🎁</Text>
            <Text style={styles.infoTitle}>Promo Codes</Text>
            <Text style={styles.infoDesc}>
              Apply promo codes at checkout to save on services
            </Text>
          </View>
        </View>
      </View>

      <VTLoading visible={loading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BGColor,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  menuIcon: {
    fontSize: FontSizes.xl,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  balanceCard: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  balanceLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: `${Colors.BGColor}CC`,
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.BGColor,
    marginBottom: Spacing.lg,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: `${Colors.BGColor}30`,
    marginBottom: Spacing.md,
  },
  balanceHint: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: `${Colors.BGColor}AA`,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: Spacing.base,
  },
  infoItem: {
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
    alignItems: 'center',
  },
  infoEmoji: {
    fontSize: FontSizes['2xl'],
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  infoDesc: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    textAlign: 'center',
  },
});

export default WalletScreen;
