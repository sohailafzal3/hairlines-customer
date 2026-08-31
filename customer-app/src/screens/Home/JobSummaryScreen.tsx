import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { useJobStore } from '../../store';
import { CostBreakDown } from '../../models';

import { formatJobDate } from '../../utils/helpers';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'JobSummary'>;
};

const JobSummaryScreen: React.FC<Props> = ({ navigation }) => {
  const { createJob, selectedPromoCode, resetCreateJob } = useJobStore();
  const [costBreakdown, setCostBreakdown] = useState<CostBreakDown | null>(null);

  const { loading: estimateLoading, execute: fetchEstimate } = useApi<CostBreakDown>(JobsApi.estimateBreakdown);
  const { loading: posting, execute: postJob } = useApi(JobsApi.postJob);

  useEffect(() => {
    loadEstimate();
  }, []);

  const loadEstimate = async () => {
    const params: any = {
      subServiceId: createJob.subServiceId,
      latitude: createJob.latitude,
      longitude: createJob.longitude,
    };
    if (createJob.selectedSp?.id) {
      params.spProfileId = createJob.selectedSp.id;
    }
    if (selectedPromoCode?.code) {
      params.promoCode = selectedPromoCode.code;
    }
    const result = await fetchEstimate(params);
    if (result) {
      setCostBreakdown(result);
    }
  };

  const handlePostJob = async () => {
    Alert.alert(
      'Confirm Service Request',
      'Are you sure you want to confirm and post this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Booking',
          onPress: async () => {
            try {
              const params = {
                ...createJob,
                promoCode: selectedPromoCode?.code || '',
                userType: 1,
              };
              await postJob(params);
              Toast.show({
                type: 'success',
                text1: 'Booking Confirmed!',
                text2: 'Your request has been dispatched to available barbers.',
              });
              resetCreateJob();
              navigation.navigate('Categories');
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Booking Error',
                text2: error.message || 'Could not complete booking request.',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Summary</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="cut-outline" size={20} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>SERVICE DETAILS</Text>
          </View>
          <Text style={styles.cardValue}>{createJob.serviceName || 'Grooming Service'}</Text>
          <Text style={styles.cardSub}>{createJob.subServiceName || 'Standard Package'}</Text>
        </View>

        {/* Professional Details Card */}
        {createJob.selectedSp && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="person-outline" size={20} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>SELECTED BARBER</Text>
            </View>
            <Text style={styles.cardValue}>{createJob.selectedSp.name}</Text>
            <Text style={styles.cardSub}>⭐ {createJob.selectedSp.avgRating?.toFixed(1) || '5.0'} Rating</Text>
          </View>
        )}

        {/* Schedule & Location */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>WHEN & WHERE</Text>
          </View>
          <Text style={styles.cardValue}>
            {formatJobDate(createJob.jobStartTime, 'As Soon As Possible')}
          </Text>
          <Text style={styles.cardSub}>{createJob.primaryAddress || 'Service address specified'}</Text>
        </View>

        {/* Promo Code Pill */}
        <TouchableOpacity
          style={styles.promoPill}
          onPress={() => navigation.getParent()?.navigate('PromoCodes')}
          activeOpacity={0.8}
        >
          <Ionicons name="pricetag-outline" size={20} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
          <Text style={styles.promoText}>
            {selectedPromoCode ? `Promo Applied: ${selectedPromoCode.code}` : 'Apply Promo Code / Coupon'}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.ButtonPrimaryColor} />
        </TouchableOpacity>

        {/* Cost Breakdown Receipt */}
        <View style={styles.costCard}>
          <Text style={styles.costTitle}>PAYMENT RECEIPT SUMMARY</Text>

          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Base Service Charges</Text>
            <Text style={styles.costValue}>
              {costBreakdown?.currency || '$'}{costBreakdown?.serviceCharges?.toFixed(2) || '0.00'}
            </Text>
          </View>

          {costBreakdown?.totalLineItemAmount ? (
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Sub-Service Line Items</Text>
              <Text style={styles.costValue}>
                {costBreakdown.currency}{costBreakdown.totalLineItemAmount.toFixed(2)}
              </Text>
            </View>
          ) : null}

          {costBreakdown?.discountAmount ? (
            <View style={styles.costRow}>
              <Text style={styles.discountLabel}>Promo Discount</Text>
              <Text style={styles.discountValue}>
                -{costBreakdown.currency}{costBreakdown.discountAmount.toFixed(2)}
              </Text>
            </View>
          ) : null}

          {costBreakdown?.walletAmount ? (
            <View style={styles.costRow}>
              <Text style={styles.discountLabel}>Wallet Credits</Text>
              <Text style={styles.discountValue}>
                -{costBreakdown.currency}{costBreakdown.walletAmount.toFixed(2)}
              </Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>
              {costBreakdown?.currency || '$'}{costBreakdown?.totalAmount?.toFixed(2) || '0.00'}
            </Text>
          </View>
        </View>

        {/* Confirm Button */}
        <VTButton
          title={posting ? 'Posting Request...' : 'Confirm & Post Booking'}
          onPress={handlePostJob}
          loading={posting}
          style={styles.postButton}
          textStyle={styles.postButtonText}
        />
      </ScrollView>

      <VTLoading visible={estimateLoading && !costBreakdown} />
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
  backButton: {
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
  card: {
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
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardTitle: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  cardSub: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  promoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 45, 99, 0.2)',
  },
  promoText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  costCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  costTitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  costLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  costValue: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  discountLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#22C55E',
  },
  discountValue: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#22C55E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  totalValue: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  postButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  postButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default JobSummaryScreen;
