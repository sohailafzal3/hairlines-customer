import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, Card } from '../../components';
import { JobsApi } from '../../api';
import { CostBreakDown, JobDetail } from '../../models';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'CostBreakDown'>;
  route: RouteProp<HomeStackParamList, 'CostBreakDown'>;
};

const CostBreakDownScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { jobId } = route.params;
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<JobDetail | null>(null);

  useEffect(() => {
    loadBreakdown();
  }, [jobId]);

  const loadBreakdown = async () => {
    try {
      setLoading(true);
      const res: any = await JobsApi.fetchJobDetail(jobId);
      const data: JobDetail = res?.job || res?.data || res;
      setJob(data);
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load breakdown',
        text2: e.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const cost: CostBreakDown | undefined = job?.costBreakDown;
  const currency = cost?.currency || '$';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header title="Cost Breakdown" onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={Colors.ButtonPrimaryColor} />
          <Text style={styles.loadingText}>Loading breakdown receipt...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 30 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Total Hero Card */}
          <View style={styles.totalHeroCard}>
            <Text style={styles.totalHeroLabel}>Total Paid / Charged</Text>
            <Text style={styles.totalHeroAmount}>
              {currency}{cost?.totalAmount ? Number(cost.totalAmount).toFixed(2) : '35.00'}
            </Text>
            <View style={styles.paymentMethodPill}>
              <Ionicons name="card" size={14} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.paymentMethodText}>Paid via Card on File</Text>
            </View>
          </View>

          {/* Itemized Base Breakdown */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Service Charges</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                {job?.subServiceName || job?.serviceName || 'Grooming Service'}
              </Text>
              <Text style={styles.rowValue}>
                {currency}{cost?.serviceCharges ? Number(cost.serviceCharges).toFixed(2) : '35.00'}
              </Text>
            </View>

            {!!cost?.deliveryCharges && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Travel / Travel Fee</Text>
                <Text style={styles.rowValue}>{currency}{Number(cost.deliveryCharges).toFixed(2)}</Text>
              </View>
            )}

            {!!cost?.tax && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Taxes & Regulatory Fees</Text>
                <Text style={styles.rowValue}>{currency}{Number(cost.tax).toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Extra Line Items if added during service */}
          {cost?.lineItems && cost.lineItems.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Additional Services & Add-ons</Text>
              {cost.lineItems.map((item, idx) => (
                <View key={item.id || `line_${idx}`} style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{item.itemName}</Text>
                    <Text style={styles.qtyText}>Qty: {item.itemQuantity || 1}</Text>
                  </View>
                  <Text style={styles.rowValue}>
                    {currency}{Number(item.itemPrice || 0).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Discounts & Credits */}
          {(!!cost?.discountAmount || !!cost?.referralDiscount || !!cost?.walletAmount) && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Discounts & Credits</Text>

              {!!cost?.discountAmount && (
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: '#059669' }]}>Promo Code Discount</Text>
                  <Text style={[styles.rowValue, { color: '#059669' }]}>
                    -{currency}{Number(cost.discountAmount).toFixed(2)}
                  </Text>
                </View>
              )}

              {!!cost?.referralDiscount && (
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: '#059669' }]}>Referral Credit</Text>
                  <Text style={[styles.rowValue, { color: '#059669' }]}>
                    -{currency}{Number(cost.referralDiscount).toFixed(2)}
                  </Text>
                </View>
              )}

              {!!cost?.walletAmount && (
                <View style={styles.row}>
                  <Text style={[styles.rowLabel, { color: '#059669' }]}>Wallet Balance Applied</Text>
                  <Text style={[styles.rowValue, { color: '#059669' }]}>
                    -{currency}{Number(cost.walletAmount).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Tip / Gratuity if any */}
          {!!cost?.gratuity && (
            <View style={styles.sectionCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Stylist Tip / Gratuity</Text>
                <Text style={styles.rowValue}>{currency}{Number(cost.gratuity).toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Security / Guarantee Banner */}
          <View style={styles.guaranteeBanner}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.guaranteeText}>
              Hairlines Guarantee protects every booking with full pricing transparency and secure payments.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  totalHeroCard: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    padding: 24,
    alignItems: 'center',
    marginBottom: Spacing.base,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  totalHeroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
  },
  totalHeroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    marginVertical: 6,
  },
  paymentMethodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: '#059669',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: FontWeights.medium,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  qtyText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  guaranteeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.ButtonPrimaryColor}08`,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: `${Colors.ButtonPrimaryColor}20`,
  },
  guaranteeText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    marginLeft: 10,
    lineHeight: 16,
  },
});

export default CostBreakDownScreen;
