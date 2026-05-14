import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Hairlines! Use my referral code ${user?.referralCode || ''} and get a discount on your first service. Download the app: ${kUserAppUrl}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Text style={styles.illustrationEmoji}>🎁</Text>
          <Text style={styles.illustrationTitle}>Share & Earn</Text>
          <Text style={styles.illustrationDesc}>
            Invite your friends to Hairlines and earn credits when they complete their first booking
          </Text>
        </View>

        {/* Referral Code */}
        <View style={styles.codeContainer}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{user?.referralCode || '------'}</Text>
          </View>
        </View>

        {/* Stats */}
        {referralInfo && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{referralInfo.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>Friends Invited</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${referralInfo.totalEarnings || 0}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
          </View>
        )}

        <VTButton title="Share with Friends" onPress={handleShare} style={styles.shareButton} />
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
    padding: Spacing.xl,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  illustrationEmoji: {
    fontSize: FontSizes['3xl'],
    marginBottom: Spacing.lg,
  },
  illustrationTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
    marginBottom: Spacing.sm,
  },
  illustrationDesc: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  codeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  codeLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.DescriptionTextLight,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  codeBox: {
    backgroundColor: Colors.TextFieldColor,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.CardColor,
    minWidth: 200,
    alignItems: 'center',
  },
  codeText: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.CardColor,
    padding: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.CardColor,
  },
  statValue: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  shareButton: {
    marginTop: Spacing.lg,
  },
});

export default ShareReferralScreen;
