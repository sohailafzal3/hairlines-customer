import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, Button } from '../../components';
import { ProfileApi } from '../../api';
import { useAuthStore } from '../../store';
import { kUserAppUrl } from '../../constants';
import { VTLoading } from '../../components/common';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'ShareReferral'>;
};

const ShareReferralScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [referralInfo, setReferralInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const referralCode = user?.referralCode || 'HAIRLINES';

  useEffect(() => {
    loadReferralInfo();
  }, []);

  const loadReferralInfo = async () => {
    try {
      setLoading(true);
      const res: any = await ProfileApi.getReferralInfo();
      if (res) {
        setReferralInfo(res);
      }
    } catch (e) {
      console.log('Referral info error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Hairlines! Use my referral code ${referralCode} and get a discount on your first barber or beauty appointment. Download now: ${kUserAppUrl}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCopy = () => {
    Toast.show({
      type: 'success',
      text1: 'Referral Code Copied!',
      text2: `Code "${referralCode}" copied to clipboard`,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Invite Friends"
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
          { paddingBottom: 80 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gift Illustration Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.giftIconCircle}>
            <Ionicons name="gift" size={38} color="#E5B652" />
          </View>
          <Text style={styles.heroTitle}>Give $10, Get $10</Text>
          <Text style={styles.heroSubtitle}>
            Share Hairlines with friends and family. They'll receive $10 off their first booking, and you'll earn $10 in wallet credits when they complete their appointment!
          </Text>
        </View>

        {/* Referral Code Container */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Personal Referral Code</Text>
          <TouchableOpacity style={styles.codeBox} onPress={handleCopy} activeOpacity={0.75}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <View style={styles.copyPill}>
              <Ionicons name="copy-outline" size={14} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
              <Text style={styles.copyPillText}>Copy</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats Summary Card */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>{referralInfo?.totalReferrals || 0}</Text>
            <Text style={styles.statLabel}>Friends Joined</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statCol}>
            <Text style={styles.statNumber}>
              ${referralInfo?.totalEarnings ? Number(referralInfo.totalEarnings).toFixed(2) : '0.00'}
            </Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {/* How It Works Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsHeading}>How It Works</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.stepTitle}>Send an Invite</Text>
              <Text style={styles.stepDesc}>Share your unique code via WhatsApp, SMS, or Social Media.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.stepTitle}>Friends Book & Save</Text>
              <Text style={styles.stepDesc}>They apply your code and get an instant discount on their cut.</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepNumCircle}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.stepTitle}>You Earn Credits</Text>
              <Text style={styles.stepDesc}>Wallet credits are automatically deposited directly to your account.</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Share Button */}
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title="Share Referral Link" onPress={handleShare} />
      </View>

      <VTLoading visible={loading} />
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
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: Spacing.base,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  giftIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.ButtonPrimaryColor,
    letterSpacing: 2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  copyPillText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.TitleColor,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: FontWeights.semibold,
    marginTop: 2,
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepsHeading: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: `${Colors.ButtonPrimaryColor}14`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: Spacing.base,
  },
});

export default ShareReferralScreen;
