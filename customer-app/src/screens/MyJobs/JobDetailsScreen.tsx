import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { JobsApi } from '../../api';
import { useApi } from '../../hooks';
import { JobDetail, StatusModel } from '../../models';
import { JobStatus } from '../../constants';
import Toast from 'react-native-toast-message';

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
      'Cancel Job',
      'Are you sure you want to cancel this job?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelJob(jobId, '', 'Cancelled by user');
              Toast.show({
                type: 'success',
                text1: 'Job Cancelled',
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
    // Twilio voice call would go here
    Alert.alert('Call', `Calling ${job?.name}...`);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Job Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {job && (
          <>
            {/* SP Info */}
            <View style={styles.spCard}>
              {job.profileImage ? (
                <Image source={{ uri: job.profileImage }} style={styles.spImage} />
              ) : (
                <View style={styles.spImagePlaceholder}>
                  <Text style={styles.spImageText}>{job.name?.charAt(0) || 'W'}</Text>
                </View>
              )}
              <View style={styles.spInfo}>
                <Text style={styles.spName}>{job.name}</Text>
                <Text style={styles.spService}>{job.serviceName}</Text>
                {job.avgRating > 0 && (
                  <Text style={styles.spRating}>⭐ {job.avgRating.toFixed(1)}</Text>
                )}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(job.spJobStatus)}15` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(job.spJobStatus) }]}>
                  {statusLabels[job.spJobStatus] || 'Unknown'}
                </Text>
              </View>
            </View>

            {/* Status Timeline */}
            {job.spJobStatus !== JobStatus.Cancelled && job.spJobStatus !== JobStatus.Rejected && (
              <View style={styles.timelineCard}>
                <Text style={styles.timelineTitle}>Status</Text>
                <View style={styles.timeline}>
                  {statusSteps.map((step, index) => {
                    const stepStatus = getStepStatus(step);
                    const isLast = index === statusSteps.length - 1;
                    return (
                      <View key={step} style={styles.timelineStep}>
                        <View style={styles.stepRow}>
                          <View style={[styles.stepDot, styles[`stepDot${stepStatus}`]]} />
                          {!isLast && (
                            <View style={[styles.stepLine, styles[`stepLine${stepStatus}`]]} />
                          )}
                        </View>
                        <Text style={[styles.stepLabel, styles[`stepLabel${stepStatus}`]]}>
                          {statusLabels[step]}
                        </Text>
                        {job.statusArray?.find((s) => s.status === step)?.statusTime ? (
                          <Text style={styles.stepTime}>
                            {job.statusArray.find((s) => s.status === step)?.statusTime}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Job Info */}
            <View style={styles.infoCard}>
              <InfoRow label="Service" value={job.serviceName} />
              <InfoRow label="Address" value={job.primaryAddress} />
              <InfoRow label="Date & Time" value={job.jobStartTime || job.expectedJobStartTime || 'TBD'} />
              <InfoRow label="Total Amount" value={`${job.currency}${job.totalAmount}`} />
              {job.specialInstruction ? (
                <InfoRow label="Special Instructions" value={job.specialInstruction} />
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.actionsCard}>
              <Text style={styles.actionsTitle}>Actions</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
                  <Text style={styles.actionIcon}>💬</Text>
                  <Text style={styles.actionLabel}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                  <Text style={styles.actionIcon}>📞</Text>
                  <Text style={styles.actionLabel}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleViewCost}>
                  <Text style={styles.actionIcon}>💵</Text>
                  <Text style={styles.actionLabel}>Cost Breakdown</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Cancel */}
            {[JobStatus.Open, JobStatus.Accepted].includes(job.spJobStatus) && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel Job</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <VTLoading visible={loading || cancelling} />
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const getStatusColor = (status: number): string => {
  switch (status) {
    case JobStatus.Open: return Colors.ButtonPrimaryRight;
    case JobStatus.Accepted: return '#4CAF50';
    case JobStatus.Started:
    case JobStatus.Arrived:
    case JobStatus.StartJob: return '#FF9800';
    case JobStatus.Completed:
    case JobStatus.Finished: return '#4CAF50';
    case JobStatus.Rejected:
    case JobStatus.Cancelled: return Colors.errorViewColor;
    default: return Colors.DescriptionTextLight;
  }
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
  spCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
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
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.BGColor,
  },
  spInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  spName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: 2,
  },
  spService: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginBottom: 2,
  },
  spRating: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.RadioActive,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
  },
  timelineCard: {
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  timelineTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.md,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    zIndex: 1,
  },
  stepDotcompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stepDotpending: {
    backgroundColor: Colors.BGColor,
    borderColor: Colors.CardColor,
  },
  stepDotfailed: {
    backgroundColor: Colors.errorViewColor,
    borderColor: Colors.errorViewColor,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: -4,
  },
  stepLinecompleted: {
    backgroundColor: '#4CAF50',
  },
  stepLinepending: {
    backgroundColor: Colors.CardColor,
  },
  stepLabelfailed: {
    color: Colors.errorViewColor,
  },
  stepLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    marginTop: Spacing.xs,
  },
  stepLabelcompleted: {
    color: '#4CAF50',
  },
  stepLabelpending: {
    color: Colors.DescriptionTextLight,
  },
  stepTime: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  infoRow: {
    marginBottom: Spacing.md,
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
    marginBottom: Spacing.xs,
  },
  infoValue: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.TitleColor,
  },
  actionsCard: {
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  actionsTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  actionIcon: {
    fontSize: FontSizes.xl,
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.lg,
  },
  cancelText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.errorViewColor,
  },
} as any);

export default JobDetailsScreen;
