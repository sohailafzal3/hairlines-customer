import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { JobDetail } from '../../models';
import { JobStatus } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'JobDetails'>;
  route: RouteProp<HomeStackParamList, 'JobDetails'>;
};

const statusSteps = [
  JobStatus.Accepted,
  JobStatus.Arrived,
  JobStatus.StartJob,
  JobStatus.Completed,
];

const statusLabels: Record<number, string> = {
  [JobStatus.Open]: 'Open',
  [JobStatus.Accepted]: 'Accepted',
  [JobStatus.Started]: 'Started',
  [JobStatus.Arrived]: 'Arrived',
  [JobStatus.StartJob]: 'In Progress',
  [JobStatus.Completed]: 'Completed',
  [JobStatus.Finished]: 'Finished',
  [JobStatus.Rejected]: 'Rejected',
  [JobStatus.Cancelled]: 'Cancelled',
};

const getStatusColor = (status: number): { bg: string; text: string } => {
  switch (status) {
    case JobStatus.Open:
      return { bg: '#EEF4FF', text: Colors.ButtonPrimaryColor };
    case JobStatus.Accepted:
    case JobStatus.Completed:
    case JobStatus.Finished:
      return { bg: '#DCFCE7', text: '#16A34A' };
    case JobStatus.Started:
    case JobStatus.Arrived:
    case JobStatus.StartJob:
      return { bg: '#FEF3C7', text: '#D97706' };
    case JobStatus.Rejected:
    case JobStatus.Cancelled:
      return { bg: '#FEE2E2', text: '#EF4444' };
    default:
      return { bg: '#F1F5F9', text: '#64748B' };
  }
};

const JobDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { jobId } = route.params;
  const [job, setJob] = useState<JobDetail | null>(null);

  const {
    data: jobDetail,
    loading,
    execute: fetchJobDetail,
  } = useApi<JobDetail>(JobsApi.fetchJobDetail);

  const { execute: cancelJob, loading: cancelling } = useApi(JobsApi.cancelJob);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  useEffect(() => {
    if (jobDetail) {
      setJob(jobDetail);
    }
  }, [jobDetail]);

  const loadJob = async () => {
    await fetchJobDetail(jobId);
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelJob(jobId, '', 'Cancelled by customer');
              Toast.show({
                type: 'success',
                text1: 'Booking Cancelled',
              });
              await loadJob();
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: 'Cancel Failed',
                text2: error.message,
              });
            }
          },
        },
      ]
    );
  };

  const handleMessage = () => {
    navigation.navigate('Chat', {
      jobId,
      spName: job?.name,
    });
  };

  const handleCall = () => {
    Alert.alert('Calling Professional', `Connecting call to ${job?.name || 'Barber'}...`);
  };

  const handleViewCost = () => {
    navigation.navigate('CostBreakDown', { jobId });
  };

  const getStepStatus = (step: number) => {
    if (!job) return 'pending';
    const currentStatus = job.spJobStatus;
    if (currentStatus === JobStatus.Cancelled || currentStatus === JobStatus.Rejected) {
      return 'failed';
    }
    const stepIndex = statusSteps.indexOf(step);
    const currentIndex = statusSteps.indexOf(currentStatus);
    if (currentIndex >= stepIndex) return 'completed';
    return 'pending';
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
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {job && (
          <>
            {/* SP Info Card */}
            <View style={styles.spCard}>
              {job.profileImage ? (
                <Image source={{ uri: job.profileImage }} style={styles.spImage} />
              ) : (
                <View style={styles.spImagePlaceholder}>
                  <Text style={styles.spImageText}>{job.name?.charAt(0) || 'W'}</Text>
                </View>
              )}

              <View style={styles.spInfo}>
                <Text style={styles.spName}>{job.name || 'Service Provider'}</Text>
                <Text style={styles.spService}>{job.serviceName || 'Grooming Service'}</Text>
                {job.avgRating > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#EAB308" style={{ marginRight: 4 }} />
                    <Text style={styles.spRating}>{job.avgRating.toFixed(1)}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.spJobStatus).bg }]}>
                <Text style={[styles.statusText, { color: getStatusColor(job.spJobStatus).text }]}>
                  {statusLabels[job.spJobStatus] || 'Pending'}
                </Text>
              </View>
            </View>

            {/* Quick Actions Card */}
            <View style={styles.actionsCard}>
              <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={handleMessage} activeOpacity={0.8}>
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.ButtonPrimaryColor} />
                  </View>
                  <Text style={styles.actionLabel}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleCall} activeOpacity={0.8}>
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="call-outline" size={20} color={Colors.ButtonPrimaryColor} />
                  </View>
                  <Text style={styles.actionLabel}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={handleViewCost} activeOpacity={0.8}>
                  <View style={styles.actionIconCircle}>
                    <Ionicons name="receipt-outline" size={20} color={Colors.ButtonPrimaryColor} />
                  </View>
                  <Text style={styles.actionLabel}>Receipt</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Status Timeline */}
            {job.spJobStatus !== JobStatus.Cancelled && job.spJobStatus !== JobStatus.Rejected && (
              <View style={styles.timelineCard}>
                <Text style={styles.sectionLabel}>SERVICE PROGRESS</Text>
                <View style={styles.timeline}>
                  {statusSteps.map((step, index) => {
                    const stepStatus = getStepStatus(step);
                    const isLast = index === statusSteps.length - 1;
                    return (
                      <View key={step} style={styles.timelineStep}>
                        <View style={styles.stepRow}>
                          <View style={[styles.stepDot, stepStatus === 'completed' && styles.stepDotCompleted]} />
                          {!isLast && (
                            <View style={[styles.stepLine, stepStatus === 'completed' && styles.stepLineCompleted]} />
                          )}
                        </View>
                        <Text style={[styles.stepLabel, stepStatus === 'completed' && styles.stepLabelCompleted]}>
                          {statusLabels[step]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Job Info Details */}
            <View style={styles.infoCard}>
              <Text style={styles.sectionLabel}>APPOINTMENT SUMMARY</Text>

              <InfoRow icon="cut-outline" label="Service" value={job.serviceName} />
              <InfoRow icon="location-outline" label="Address" value={job.primaryAddress} />
              <InfoRow icon="calendar-outline" label="Date & Time" value={job.jobStartTime || job.expectedJobStartTime || 'Scheduled'} />
              <InfoRow icon="cash-outline" label="Total Amount" value={`${job.currency || '$'}${job.totalAmount || '0.00'}`} />
              {job.specialInstruction ? (
                <InfoRow icon="information-circle-outline" label="Instructions" value={job.specialInstruction} />
              ) : null}
            </View>

            {/* Cancel Button */}
            {[JobStatus.Open, JobStatus.Accepted].includes(job.spJobStatus) && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel} activeOpacity={0.8}>
                <Ionicons name="close-circle-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.cancelText}>Cancel Booking</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <VTLoading visible={loading || cancelling} />
    </SafeAreaView>
  );
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as any} size={18} color="#64748B" style={{ marginRight: 10, marginTop: 2 }} />
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

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
  spCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  spImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  spImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.ButtonPrimaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spImageText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  spInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.xs,
  },
  spName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  spService: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  spRating: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#854D0E',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    textTransform: 'uppercase',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
  },
  stepDotCompleted: {
    backgroundColor: '#16A34A',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
  },
  stepLineCompleted: {
    backgroundColor: '#16A34A',
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveMedium,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#16A34A',
    fontFamily: Fonts.uberMoveBold,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: '#0F172A',
    marginTop: 2,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: Spacing.sm,
  },
  cancelText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#EF4444',
  },
});

export default JobDetailsScreen;
