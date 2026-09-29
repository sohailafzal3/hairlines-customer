import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Linking,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header } from '../../components';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { JobDetail } from '../../models';
import { JobStatus } from '../../constants';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'JobDetails'>;
  route: RouteProp<HomeStackParamList, 'JobDetails'>;
};

interface CancellationReason {
  _id?: string;
  id?: string;
  reason?: string;
  reasonText?: string;
}

const statusOrder = [
  { status: JobStatus.Accepted, title: 'Accepted' },
  { status: JobStatus.Started, title: 'On The Way' },
  { status: JobStatus.Arrived, title: 'Arrived' },
  { status: JobStatus.StartJob, title: 'In Progress' },
  { status: JobStatus.Completed, title: 'Completed' },
];

const JobDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { jobId } = route.params;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Cancellation Modal
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState('');
  const [otherReasonText, setOtherReasonText] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Rating Modal
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [tipAmount, setTipAmount] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const res: any = await JobsApi.fetchJobDetail(jobId);
      const data: JobDetail = res?.job || res?.data || res;
      setJob(data);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed to load details', text2: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCancelModal = async () => {
    setIsCancelModalVisible(true);
    try {
      const res: any = await JobsApi.fetchCancellationReasons();
      const list = res?.reasons || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setReasons(list);
        setSelectedReasonId(list[0]._id || list[0].id || '');
      } else {
        setReasons([
          { _id: '1', reason: 'Change of plans / Schedule conflict' },
          { _id: '2', reason: 'Stylist is delayed / Not responding' },
          { _id: '3', reason: 'Booked by mistake' },
          { _id: '4', reason: 'Other reason' },
        ]);
        setSelectedReasonId('1');
      }
    } catch (e) {
      setReasons([
        { _id: '1', reason: 'Change of plans / Schedule conflict' },
        { _id: '2', reason: 'Stylist is delayed / Not responding' },
        { _id: '3', reason: 'Booked by mistake' },
        { _id: '4', reason: 'Other reason' },
      ]);
      setSelectedReasonId('1');
    }
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await JobsApi.cancelJob(jobId, selectedReasonId, otherReasonText);
      setIsCancelModalVisible(false);
      Toast.show({ type: 'success', text1: 'Appointment Cancelled' });
      await loadJob();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const handleRateSubmit = async () => {
    try {
      setSubmittingRating(true);
      const spId = job?.spProfileId || job?.worker?.id || '';
      await JobsApi.rateSP({
        jobId,
        spProfileId: spId,
        rating: ratingStars,
        review: reviewText.trim(),
        gratuity: tipAmount,
      });
      setIsRatingModalVisible(false);
      Alert.alert('Thank you!', 'Your rating and feedback have been submitted.');
      await loadJob();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCall = () => {
    const phone = job?.worker?.phoneNumber || job?.spPhoneNumber;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Contact', 'Hairstylist phone number not available');
    }
  };

  const handleChat = () => {
    const spName = job?.worker?.name || job?.spName || 'Hairstylist';
    navigation.navigate('Chat', { jobId, spName });
  };

  const currentStatus = job?.status ?? 0;
  const isCancelled = currentStatus === JobStatus.Cancelled || currentStatus === JobStatus.Rejected;
  const isCompleted = currentStatus === JobStatus.Completed || currentStatus === JobStatus.Finished;
  const canCancel = !isCancelled && !isCompleted && currentStatus <= JobStatus.Arrived;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <Header title="Appointment Details" onBackPress={() => navigation.goBack()} />

      {loading ? (
        <VTLoading visible />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 40, 60) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Tracker Card */}
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Live Status</Text>

            {isCancelled ? (
              <View style={styles.cancelledBanner}>
                <Ionicons name="close-circle" size={24} color="#DC2626" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.cancelledTitle}>Appointment Cancelled</Text>
                  <Text style={styles.cancelledSub}>This appointment has been cancelled.</Text>
                </View>
              </View>
            ) : (
              <View style={styles.stepperContainer}>
                {statusOrder.map((step, idx) => {
                  const isDone = currentStatus >= step.status;
                  const isCurrent = currentStatus === step.status;

                  return (
                    <View key={step.status} style={styles.stepItem}>
                      <View style={styles.stepIndicatorRow}>
                        <View
                          style={[
                            styles.stepDot,
                            isDone && styles.stepDotDone,
                            isCurrent && styles.stepDotCurrent,
                          ]}
                        >
                          {isDone ? (
                            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                          ) : (
                            <View style={styles.stepDotInner} />
                          )}
                        </View>
                        {idx < statusOrder.length - 1 && (
                          <View
                            style={[
                              styles.stepLine,
                              currentStatus > step.status && styles.stepLineDone,
                            ]}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.stepText,
                          isDone && styles.stepTextDone,
                          isCurrent && styles.stepTextCurrent,
                        ]}
                      >
                        {step.title}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Stylist Profile & Actions Card */}
          <View style={styles.card}>
            <View style={styles.workerRow}>
              <View style={styles.workerAvatarContainer}>
                {job?.worker?.profileImage ? (
                  <Image source={{ uri: job.worker.profileImage }} style={styles.workerAvatar} />
                ) : (
                  <Ionicons name="person" size={28} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.workerName}>
                  {job?.worker?.name || job?.spName || 'Professional Stylist'}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{job?.worker?.avgRating || 5.0}</Text>
                  {job?.companyName && (
                    <Text style={styles.companyTag}> • {job.companyName}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Call / Chat Action Buttons */}
            {!isCancelled && (
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleChat} activeOpacity={0.8}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.ButtonPrimaryColor} />
                  <Text style={styles.actionBtnText}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnCall]} onPress={handleCall} activeOpacity={0.8}>
                  <Ionicons name="call-outline" size={18} color="#059669" />
                  <Text style={[styles.actionBtnText, { color: '#059669' }]}>Call Stylist</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Service & Appointment Details */}
          <View style={styles.card}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="content-cut" size={18} color={Colors.ButtonPrimaryColor} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Service Offered</Text>
                <Text style={styles.detailValue}>
                  {job?.serviceName || job?.subServiceName || 'Haircut & Grooming'}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {job?.jobStartTime ? new Date(job.jobStartTime).toLocaleString() : 'As scheduled'}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>
                  {job?.atSpLocation ? 'Stylist Studio / Salon' : job?.primaryAddress || 'Address on file'}
                </Text>
              </View>
            </View>

            {job?.workDescription ? (
              <>
                <View style={styles.cardDivider} />
                <View style={styles.detailRow}>
                  <Ionicons name="document-text-outline" size={18} color={Colors.ButtonPrimaryColor} />
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>"{job.workDescription}"</Text>
                  </View>
                </View>
              </>
            ) : null}

            {job?.stylePreferenceImage ? (
              <>
                <View style={styles.cardDivider} />
                <Text style={[styles.detailLabel, { marginBottom: 6 }]}>Style Reference Photo</Text>
                <Image source={{ uri: job.stylePreferenceImage }} style={styles.styleRefImage} />
              </>
            ) : null}
          </View>

          {/* Total & Cost Breakdown Link */}
          <View style={styles.card}>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.detailLabel}>Total Amount</Text>
                <Text style={styles.totalPrice}>
                  ${job?.totalAmount ? Number(job.totalAmount).toFixed(2) : '35.00'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.costBreakdownBtn}
                onPress={() => navigation.navigate('CostBreakDown', { jobId })}
              >
                <Text style={styles.costBreakdownText}>View Cost Breakdown</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.ButtonPrimaryColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Rate Button if Completed */}
          {isCompleted && (
            <TouchableOpacity
              style={styles.rateBtn}
              onPress={() => setIsRatingModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="star" size={18} color="#F59E0B" />
              <Text style={styles.rateBtnText}>Rate & Review Service</Text>
            </TouchableOpacity>
          )}

          {/* Cancel Button if eligible */}
          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleOpenCancelModal}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Cancel Appointment</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}

      {/* Modal: Cancellation Reasons */}
      <Modal
        visible={isCancelModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCancelModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.cancelModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Appointment</Text>
              <TouchableOpacity onPress={() => setIsCancelModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Please select a reason for cancelling this appointment:
            </Text>

            <ScrollView style={{ maxHeight: 220, marginVertical: 10 }}>
              {reasons.map((r) => {
                const rId = r._id || r.id || '';
                const isSelected = selectedReasonId === rId;
                return (
                  <TouchableOpacity
                    key={rId}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionActive]}
                    onPress={() => setSelectedReasonId(rId)}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? Colors.ButtonPrimaryColor : '#94A3B8'}
                    />
                    <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                      {r.reason || r.reasonText}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={styles.otherInput}
              placeholder="Additional notes (optional)..."
              value={otherReasonText}
              onChangeText={setOtherReasonText}
            />

            <View style={{ marginTop: 16 }}>
              <VTButton
                title="Confirm Cancellation"
                onPress={handleConfirmCancel}
                loading={cancelling}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Rate & Review */}
      <Modal
        visible={isRatingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.cancelModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Your Hairstylist</Text>
              <TouchableOpacity onPress={() => setIsRatingModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRatingStars(s)}>
                  <Ionicons
                    name={s <= ratingStars ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Write a review for your stylist..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={3}
            />

            <View style={{ marginTop: 16 }}>
              <VTButton
                title="Submit Review"
                onPress={handleRateSubmit}
                loading={submittingRating}
              />
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
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: FontSizes.base,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginBottom: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  stepDotDone: {
    backgroundColor: '#059669',
  },
  stepDotCurrent: {
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  stepLine: {
    position: 'absolute',
    top: 10,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  stepLineDone: {
    backgroundColor: '#059669',
  },
  stepText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  stepTextDone: {
    color: '#059669',
  },
  stepTextCurrent: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: '800',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  cancelledSub: {
    fontSize: 12,
    color: '#991B1B',
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workerAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  workerAvatar: {
    width: '100%',
    height: '100%',
  },
  workerName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginLeft: 4,
  },
  companyTag: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnCall: {
    backgroundColor: '#ECFDF5',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.ButtonPrimaryColor,
    marginLeft: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailInfo: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  styleRefImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginTop: 4,
    resizeMode: 'cover',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: '#059669',
    marginTop: 2,
  },
  costBreakdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  costBreakdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ButtonPrimaryColor,
    marginRight: 4,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rateBtnText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  cancelModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  reasonOptionActive: {
    backgroundColor: '#F8FAFC',
  },
  reasonText: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 10,
    flex: 1,
  },
  reasonTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: '700',
  },
  otherInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 13,
    color: Colors.TitleColor,
    marginTop: 6,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  reviewInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: Colors.TitleColor,
    textAlignVertical: 'top',
    height: 80,
  },
});

export default JobDetailsScreen;
