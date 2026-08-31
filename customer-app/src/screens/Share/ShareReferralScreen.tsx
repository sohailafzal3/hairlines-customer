import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { ProfileApi } from '../../api';
import { useApi } from '../../hooks';
import { useAuthStore } from '../../store';
import { kUserAppUrl } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'ShareReferral'>;
};

const ShareReferralScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [referralInfo, setReferralInfo] = useState<any>(null);

  const { loading, execute: fetchReferral } = useApi(ProfileApi.getReferralInfo);

  useEffect(() => {
    loadReferralInfo();
  }, []);

  const loadReferralInfo = async () => {
    const result = await fetchReferral();
    if (result) {
      setReferralInfo(result);
    }
  };

  const referralCode = user?.referralCode || 'HAIRLINES20';

  const handleCopyCode = async () => {
    try {
      await Share.share({
        message: `My Hairlines referral code is: ${referralCode}`,
      });
      Toast.show({
        type: 'success',
        text1: 'Referral Code Ready!',
        text2: `Code "${referralCode}" ready to share.`,
      });
    } catch (e) {
      // Fallback
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Hairlines! Use my referral code ${referralCode} to get exclusive discounts on grooming services. Download: ${kUserAppUrl}`,
      });
    } catch (error) {
      console.error('Share error:', error);
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
        <Text style={styles.headerTitle}>Invite & Earn</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Illustration */}
        <View style={styles.bannerCard}>
          <View style={styles.giftIconCircle}>
            <Ionicons name="gift" size={32} color={Colors.ButtonPrimaryColor} />
          </View>
          <Text style={styles.bannerTitle}>Give $10, Get $10</Text>
          <Text style={styles.bannerDesc}>
            Invite your friends to Hairlines. They get $10 off their first booking, and you get $10 in wallet credits!
          </Text>
        </View>

        {/* Referral Code Container */}
        <Text style={styles.sectionLabel}>YOUR PERSONAL REFERRAL CODE</Text>

        <View style={styles.codeCard}>
          <View style={styles.codeTextWrapper}>
            <Text style={styles.codeText}>{referralCode}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
            activeOpacity={0.8}
          >
            <Ionicons name="copy-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.copyButtonText}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <Text style={styles.sectionLabel}>REFERRAL REWARDS SUMMARY</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="people-outline" size={22} color={Colors.ButtonPrimaryColor} style={{ marginBottom: 4 }} />
            <Text style={styles.statValue}>{referralInfo?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Friends Invited</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={22} color="#22C55E" style={{ marginBottom: 4 }} />
            <Text style={styles.statValue}>${referralInfo?.totalEarnings || 0}</Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </View>
        </View>

        <VTButton
          title="Share Referral Link"
          onPress={handleShare}
          style={styles.shareButton}
          textStyle={styles.shareButtonText}
        />
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
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  giftIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bannerTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: Spacing.xs,
  },
  bannerDesc: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.ButtonPrimaryColor,
  },
  codeTextWrapper: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  codeText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  copyButtonText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statValue: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginVertical: 2,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  shareButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default ShareReferralScreen;
