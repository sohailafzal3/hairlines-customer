import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header } from '../../components';
import { VTButton, VTTextField } from '../../components/common';
import { JobsApi, PaymentsApi, ProfileApi } from '../../api';
import { useJobStore, useAuthStore } from '../../store';
import { CostBreakDown, CreditCards, StripeCustomer } from '../../models';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'JobSummary'>;
};

const JobSummaryScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createJob, selectedPromoCode, setPromoCode, resetCreateJob } = useJobStore();
  const { user } = useAuthStore();

  const [costBreakdown, setCostBreakdown] = useState<CostBreakDown | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  // Cards
  const [cards, setCards] = useState<CreditCards[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [loadingCards, setLoadingCards] = useState(false);

  // Promo Code Modal
  const [isPromoModalVisible, setIsPromoModalVisible] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Success Modal
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [postedJobId, setPostedJobId] = useState('');

  useEffect(() => {
    loadEstimate();
    loadCards();
  }, [selectedPromoCode]);

  const loadEstimate = async () => {
    try {
      setEstimateLoading(true);
      const params: any = {
        subServiceId: createJob.subServiceId,
        latitude: createJob.latitude || 37.7749,
        longitude: createJob.longitude || -122.4194,
      };
      if (createJob.worker?.id || createJob.selectedSp?.id) {
        params.spProfileId = createJob.worker?.id || createJob.selectedSp?.id;
      }
      if (selectedPromoCode?.code) {
        params.promoCode = selectedPromoCode.code;
      }
      const result: any = await JobsApi.estimateBreakdown(params);
      const breakdown = result?.costBreakDown || result?.data || result;
      if (breakdown) {
        setCostBreakdown(breakdown);
      }
    } catch (e) {
      console.warn('Estimate fetch failed:', e);
    } finally {
      setEstimateLoading(false);
    }
  };

  const loadCards = async () => {
    try {
      setLoadingCards(true);
      const res: any = await PaymentsApi.fetchCustomer();
      const customerCards: CreditCards[] = res?.customer?.cards || res?.cards || [];
      if (Array.isArray(customerCards) && customerCards.length > 0) {
        setCards(customerCards);
        const def = customerCards.find((c) => c.isDefault) || customerCards[0];
        if (def) setSelectedCardId(def.cardId);
      }
    } catch (e) {
      console.log('Cards fetch error:', e);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    try {
      setApplyingPromo(true);
      const res: any = await ProfileApi.applyPromoCode(promoInput.trim());
      setPromoCode({
        id: res?.id || 1,
        code: promoInput.trim(),
        title: res?.title || promoInput.trim(),
        discountType: res?.discountType || 1,
        discountPercentage: res?.discountPercentage || 10,
        amount: res?.amount || 10,
      });
      setIsPromoModalVisible(false);
      setPromoInput('');
      Toast.show({ type: 'success', text1: 'Promo Code Applied!' });
    } catch (e: any) {
      Alert.alert('Invalid Code', e.message || 'Promo code could not be applied');
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode(null);
  };

  const handlePostJob = async () => {
    Alert.alert(
      'Confirm Appointment',
      `Are you ready to book ${createJob.subServiceName || 'this service'} with ${createJob.worker?.name || createJob.selectedSp?.name || 'our verified stylist'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Book',
          onPress: async () => {
            try {
              setPosting(true);
              const spId = createJob.worker?.id || createJob.selectedSp?.id || '';
              const sp = createJob.selectedSp || createJob.worker;

              // When atSpLocation=true, iOS uses the SP's own address & lat/lng (ApiClient.swift:451-455)
              const useSpLocation = !!createJob.atSpLocation;
              const jobLat = useSpLocation ? (sp?.permanentAddressLat ?? createJob.latitude ?? 37.7749) : (createJob.latitude ?? 37.7749);
              const jobLng = useSpLocation ? (sp?.permanentAddressLong ?? createJob.longitude ?? -122.4194) : (createJob.longitude ?? -122.4194);
              const jobPrimaryAddress = useSpLocation ? (sp?.spPrimaryAddress || createJob.primaryAddress || '') : (createJob.primaryAddress || '');
              const jobCity = useSpLocation ? (sp?.spCity || createJob.city || '') : (createJob.city || '');
              const jobState = useSpLocation ? (sp?.spState || createJob.state || '') : (createJob.state || '');
              const jobCountry = useSpLocation ? (sp?.spCountry || createJob.country || '') : (createJob.country || '');

              const params = {
                subServiceId: createJob.subServiceId,
                subServiceTypeId: createJob.subServiceTypeId || '',
                subServiceTypeRate: createJob.subServiceTypeRate || 0,
                jobStartTime: createJob.jobStartTime || new Date().toISOString(),
                latitude: jobLat,
                longitude: jobLng,
                spProfileId: spId,
                specialInstruction: createJob.specialInstruction || '',
                primaryAddress: jobPrimaryAddress,
                streetAddressLine1: createJob.streetAddressLine1 || '',
                streetAddressLine2: useSpLocation ? '' : (createJob.streetAddressLine2 || ''),
                city: jobCity,
                state: jobState,
                country: jobCountry,
                workDescription: createJob.descriptionText || '',
                promoCode: selectedPromoCode?.code || '',
                jobId: createJob.jobId || '',
                provideServiceInPremises: !!createJob.atSpLocation,
                provideServiceInUserPremises: !!createJob.atUserLocation,
                stylePreferenceImage: createJob.stylePreferenceImage || '',
                isJobOfferedFor: createJob.isJobOfferedFor ?? 0,
                serviceFor: createJob.serviceFor ?? 0,
                barberGender: createJob.barberGender ?? -1,
                bookingType: createJob.bookingType || 0,
                ...(createJob.memberId ? { memberId: createJob.memberId } : {}),
              };

              const res: any = await JobsApi.postJob(params);
              const newJobId = res?.jobId || res?.data?.jobId || res?._id || '';
              setPostedJobId(newJobId);
              setIsSuccessModalVisible(true);
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Booking Failed',
                text2: error.message || 'Please check your connection and try again',
              });
            } finally {
              setPosting(false);
            }
          },
        },
      ]
    );
  };

  const handleFinishSuccess = () => {
    setIsSuccessModalVisible(false);
    resetCreateJob();
    navigation.getParent()?.navigate('MyJobs' as any);
  };

  const formattedStartTime = createJob.jobStartTime
    ? new Date(createJob.jobStartTime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Immediate / Next Available';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header title="Appointment Summary" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 100, 120) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Service Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="content-cut" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.cardSubtitle}>Service Details</Text>
              <Text style={styles.cardTitle}>{createJob.subServiceName || 'Hair Styling'}</Text>
            </View>
          </View>
          {createJob.descriptionText ? (
            <Text style={styles.descriptionText} numberOfLines={3}>
              "{createJob.descriptionText}"
            </Text>
          ) : null}
        </View>

        {/* Selected Stylist Card */}
        {(createJob.worker || createJob.selectedSp) && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#E5B652' }]}>
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cardSubtitle}>Selected Hairstylist</Text>
                <Text style={styles.cardTitle}>
                  {createJob.worker?.name || createJob.selectedSp?.name}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {createJob.worker?.avgRating || createJob.selectedSp?.avgRating || 5.0}
                    {(createJob.worker as any)?.totalReviews || createJob.worker?.totalJobDone ? ` (${(createJob.worker as any)?.totalReviews || createJob.worker?.totalJobDone} reviews)` : ''}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Schedule & Location Card */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={Colors.ButtonPrimaryColor} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>{formattedStartTime}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={Colors.ButtonPrimaryColor} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>
                {createJob.atSpLocation ? 'Stylist Studio / Salon' : createJob.primaryAddress || 'Your Address'}
              </Text>
            </View>
          </View>
        </View>

        {/* Promo Code Section */}
        <View style={styles.card}>
          <View style={styles.promoHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="pricetag-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionHeading}>Promo Code</Text>
            </View>
            {selectedPromoCode ? (
              <TouchableOpacity onPress={handleRemovePromo}>
                <Text style={styles.removePromoText}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {selectedPromoCode ? (
            <View style={styles.appliedPromoBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.appliedPromoCode}>{selectedPromoCode.code}</Text>
              <Text style={styles.appliedPromoDiscount}>Discount applied</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addPromoBtn}
              onPress={() => setIsPromoModalVisible(true)}
            >
              <Text style={styles.addPromoBtnText}>+ Apply Promo Code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment Method Section */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="card-outline" size={18} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.sectionHeading}>Payment Method</Text>
          </View>

          {loadingCards ? (
            <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
          ) : cards.length > 0 ? (
            cards.map((c) => {
              const isSelected = selectedCardId === c.cardId;
              return (
                <TouchableOpacity
                  key={c.cardId}
                  style={[styles.cardItem, isSelected && styles.cardItemActive]}
                  onPress={() => setSelectedCardId(c.cardId)}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? Colors.ButtonPrimaryColor : '#94A3B8'}
                  />
                  <Ionicons name="card" size={20} color="#222D63" style={{ marginLeft: 10 }} />
                  <Text style={styles.cardItemText}>•••• {c.last4} ({c.brand || 'Card'})</Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.noCardRow}>
              <Text style={styles.noCardText}>Default in-app payment / Card on file</Text>
            </View>
          )}
        </View>

        {/* Cost Breakdown Card */}
        <View style={styles.costCard}>
          <Text style={styles.costTitle}>Estimated Cost Breakdown</Text>

          {estimateLoading ? (
            <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Service Charges</Text>
                <Text style={styles.costValue}>
                  ${costBreakdown?.serviceCharges ? Number(costBreakdown.serviceCharges).toFixed(2) : '35.00'}
                </Text>
              </View>

              {!!costBreakdown?.deliveryCharges && (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Travel / Travel Fee</Text>
                  <Text style={styles.costValue}>${Number(costBreakdown.deliveryCharges).toFixed(2)}</Text>
                </View>
              )}

              {!!costBreakdown?.discountAmount && (
                <View style={styles.costRow}>
                  <Text style={[styles.costLabel, { color: '#059669' }]}>Promo Discount</Text>
                  <Text style={[styles.costValue, { color: '#059669' }]}>
                    -${Number(costBreakdown.discountAmount).toFixed(2)}
                  </Text>
                </View>
              )}

              {!!costBreakdown?.tax && (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Taxes & Fees</Text>
                  <Text style={styles.costValue}>${Number(costBreakdown.tax).toFixed(2)}</Text>
                </View>
              )}

              <View style={styles.costDivider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Estimated</Text>
                <Text style={styles.totalValue}>
                  ${costBreakdown?.totalAmount ? Number(costBreakdown.totalAmount).toFixed(2) : '35.00'}
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Pinned Bottom Confirm Button */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom + 12, 16) },
        ]}
      >
        <VTButton
          title="Confirm & Book Appointment"
          onPress={handlePostJob}
          loading={posting}
        />
      </View>

      {/* Modal: Promo Code Input */}
      <Modal
        visible={isPromoModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsPromoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.promoModalCard}>
            <Text style={styles.promoModalTitle}>Apply Promo Code</Text>
            <VTTextField
              placeholder="Enter promo code (e.g. HAIRLINES10)"
              value={promoInput}
              onChangeText={setPromoInput}
              autoCapitalize="characters"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.promoCancelBtn}
                onPress={() => setIsPromoModalVisible(false)}
              >
                <Text style={styles.promoCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.promoApplyBtn}
                onPress={handleApplyPromo}
                disabled={applyingPromo || !promoInput.trim()}
              >
                {applyingPromo ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.promoApplyBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Booking Success */}
      <Modal
        visible={isSuccessModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleFinishSuccess}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successCheckCircle}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Booking Placed!</Text>
            <Text style={styles.successSub}>
              Your appointment request has been confirmed. The hairstylist has been notified and you can track real-time status in My Appointments.
            </Text>
            <View style={{ width: '100%', marginTop: 24 }}>
              <VTButton title="View My Appointments" onPress={handleFinishSuccess} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.TitleColor,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 8,
    paddingLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  sectionHeading: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginLeft: 8,
  },
  promoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  removePromoText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.errorViewColor,
  },
  appliedPromoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  appliedPromoCode: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginLeft: 6,
  },
  appliedPromoDiscount: {
    fontSize: 12,
    color: '#047857',
    marginLeft: 8,
  },
  addPromoBtn: {
    paddingVertical: 8,
  },
  addPromoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ButtonPrimaryColor,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginTop: 6,
  },
  cardItemActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}08`,
  },
  cardItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginLeft: 8,
  },
  noCardRow: {
    paddingVertical: 6,
  },
  noCardText: {
    fontSize: 13,
    color: '#64748B',
  },
  costCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  costTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginBottom: 12,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  costLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  costValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TitleColor,
  },
  costDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  totalValue: {
    fontSize: FontSizes.xl,
    fontWeight: '900',
    color: Colors.ButtonPrimaryColor,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  promoModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  promoModalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginBottom: 14,
  },
  promoCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  promoCancelBtnText: {
    color: '#64748B',
    fontWeight: '700',
  },
  promoApplyBtn: {
    flex: 1,
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  promoApplyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  successCheckCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default JobSummaryScreen;
