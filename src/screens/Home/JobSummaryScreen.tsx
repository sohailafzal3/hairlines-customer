import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { useJobStore, useAuthStore } from '../../store';
import { CostBreakDown } from '../../models';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'JobSummary'>;
};

const JobSummaryScreen: React.FC<Props> = ({ navigation }) => {
  const { createJob, selectedPromoCode, resetCreateJob } = useJobStore();
  const { user } = useAuthStore();
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
      'Confirm Booking',
      'Are you sure you want to post this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
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
                text1: 'Job Posted!',
                text2: 'Your service request has been sent to available workers.',
              });
              resetCreateJob();
              navigation.navigate('Categories');
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Booking Failed',
                text2: error.message || 'Please try again',
              });
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Booking Summary</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Service Details */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Service</Text>
          <Text style={styles.cardValue}>{createJob.serviceName}</Text>
          <Text style={styles.cardSub}>{createJob.subServiceName}</Text>
        </View>

        {/* Worker Details */}
        {createJob.selectedSp && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Selected Worker</Text>
            <Text style={styles.cardValue}>{createJob.selectedSp.name}</Text>
            <Text style={styles.cardSub}>⭐ {createJob.selectedSp.avgRating}</Text>
          </View>
        )}

        {/* Date/Location */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>When & Where</Text>
          <Text style={styles.cardValue}>
            {createJob.jobStartTime
              ? new Date(createJob.jobStartTime).toLocaleString()
              : 'Not set'}
          </Text>
          <Text style={styles.cardSub}>{createJob.primaryAddress || 'Address not set'}</Text>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.costCard}>
          <Text style={styles.costTitle}>Cost Breakdown</Text>

          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Service Charges</Text>
            <Text style={styles.costValue}>
              {costBreakdown?.currency || '$'}
              {costBreakdown?.serviceCharges || 0}
            </Text>
          </View>

          {costBreakdown?.totalLineItemAmount ? (
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Line Items</Text>
              <Text style={styles.costValue}>
                {costBreakdown.currency}
                {costBreakdown.totalLineItemAmount}
              </Text>
            </View>
          ) : null}

          {costBreakdown?.discountAmount ? (
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, styles.discountText]}>Discount</Text>
              <Text style={[styles.costValue, styles.discountText]}>
                -{costBreakdown.currency}
                {costBreakdown.discountAmount}
              </Text>
            </View>
          ) : null}

          {costBreakdown?.referralDiscount ? (
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, styles.discountText]}>Referral Discount</Text>
              <Text style={[styles.costValue, styles.discountText]}>
                -{costBreakdown.currency}
                {costBreakdown.referralDiscount}
              </Text>
            </View>
          ) : null}

          {costBreakdown?.walletAmount ? (
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, styles.discountText]}>Wallet Credit</Text>
              <Text style={[styles.costValue, styles.discountText]}>
                -{costBreakdown.currency}
                {costBreakdown.walletAmount}
              </Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.costRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>
              {costBreakdown?.currency || '$'}
              {costBreakdown?.totalAmount || 0}
            </Text>
          </View>
        </View>

        {/* Promo Code */}
        <TouchableOpacity
          style={styles.promoRow}
          onPress={() => navigation.getParent()?.navigate('PromoCodes')}
        >
          <Text style={styles.promoLabel}>
            {selectedPromoCode ? `Promo: ${selectedPromoCode.code}` : 'Apply Promo Code'}
          </Text>
          <Text style={styles.promoArrow}>→</Text>
        </TouchableOpacity>

        <VTButton
          title={posting ? 'Posting...' : 'Confirm & Post Job'}
          onPress={handlePostJob}
          loading={posting}
          style={styles.postButton}
        />
      </ScrollView>

      <VTLoading visible={estimateLoading && !costBreakdown} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BGColor,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  back: {
    fontSize: FontSizes['2xl'],
    color: Colors.TitleColor,
  },
  title: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  card: {
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  cardLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
    marginBottom: Spacing.xs,
  },
  cardValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  cardSub: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  costCard: {
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  costTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.md,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  costLabel: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  costValue: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
  },
  discountText: {
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.CardColor,
    marginVertical: Spacing.md,
  },
  totalLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  totalValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: `${Colors.ButtonPrimaryColor}08`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  promoLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryColor,
  },
  promoArrow: {
    fontSize: FontSizes.lg,
    color: Colors.ButtonPrimaryColor,
  },
  postButton: {
    marginTop: Spacing.lg,
  },
});

export default JobSummaryScreen;
