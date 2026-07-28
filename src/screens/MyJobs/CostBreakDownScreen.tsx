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
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'CostBreakDown'>;
  route: RouteProp<HomeStackParamList, 'CostBreakDown'>;
};

const CostBreakDownScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params || {};

  const {
    data: detail,
    loading,
    execute: fetchDetail,
  } = useApi<any>(JobsApi.fetchJobDetail);

  useEffect(() => {
    if (jobId) {
      fetchDetail(jobId);
    }
  }, [jobId]);

  const costData = detail?.costBreakDown || {
    totalJobAmount: 45.0,
    serviceCharges: 5.0,
    totalLineItemAmount: 50.0,
    discountAmount: 0.0,
    totalAmount: 50.0,
    currency: '$',
    serviceName: detail?.serviceName || 'Haircut & Styling',
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Breakdown</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Detailed receipt breakdown for your service</Text>

        {/* Receipt Container */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Ionicons name="receipt-outline" size={26} color={Colors.ButtonPrimaryColor} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceTitle}>{costData.serviceName}</Text>
              <Text style={styles.receiptSub}>Itemized Invoice Receipt</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Line Items */}
          <View style={styles.lineItemRow}>
            <Text style={styles.lineLabel}>Base Service Rate</Text>
            <Text style={styles.lineValue}>
              {costData.currency || '$'}{costData.totalJobAmount?.toFixed(2) || '45.00'}
            </Text>
          </View>

          <View style={styles.lineItemRow}>
            <Text style={styles.lineLabel}>Platform & Convenience Fee</Text>
            <Text style={styles.lineValue}>
              {costData.currency || '$'}{costData.serviceCharges?.toFixed(2) || '5.00'}
            </Text>
          </View>

          {costData.discountAmount > 0 && (
            <View style={styles.lineItemRow}>
              <Text style={styles.lineLabelDiscount}>Promo Discount</Text>
              <Text style={styles.lineValueDiscount}>
                -{costData.currency || '$'}{costData.discountAmount?.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.dashedDivider} />

          {/* Total Row */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Due</Text>
            <Text style={styles.totalValue}>
              {costData.currency || '$'}{costData.totalAmount?.toFixed(2) || '50.00'}
            </Text>
          </View>
        </View>

        {/* Payment Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={18} color="#22C55E" style={{ marginRight: 8 }} />
          <Text style={styles.securityText}>
            Secured by Stripe Encrypted Payment Gateway.
          </Text>
        </View>

        <VTButton
          title="Done"
          onPress={() => navigation.goBack()}
          style={styles.doneButton}
          textStyle={styles.doneButtonText}
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
  title: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginBottom: Spacing.xl,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  serviceTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  receiptSub: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: Spacing.md,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  lineLabel: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#334155',
  },
  lineValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  lineLabelDiscount: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#22C55E',
  },
  lineValueDiscount: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#22C55E',
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
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
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  securityText: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  doneButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default CostBreakDownScreen;
