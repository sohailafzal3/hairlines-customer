import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '../../theme';
import { VTButton, VTTextField } from '../../components/common';
import { useJobStore } from '../../store';
import { formatJobDate, parseDate } from '../../utils/helpers';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'UserJobDetail'>;
  route: RouteProp<HomeStackParamList, 'UserJobDetail'>;
};

const UserJobDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceInfo } = route.params || {};
  const { createJob, setCreateJobField } = useJobStore();

  const [date] = useState(new Date());
  const [description, setDescription] = useState(createJob.descriptionText || '');
  const [specialInstructions, setSpecialInstructions] = useState(createJob.specialInstruction || '');
  const [locationMode, setLocationMode] = useState<'user' | 'sp'>(createJob.atSpLocation ? 'sp' : 'user');
  const [styleImage, setStyleImage] = useState(createJob.stylePreferenceImage || '');

  useEffect(() => {
    // Sanitize any stale invalid date string stored in Zustand / AsyncStorage
    if (createJob.jobStartTime && !parseDate(createJob.jobStartTime)) {
      setCreateJobField('jobStartTime', '');
    }
  }, []);

  const handleOpenDatePicker = () => {
    navigation.navigate('Calendar');
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please allow access to your photo library.',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setStyleImage(result.assets[0].uri);
      setCreateJobField('stylePreferenceImage', result.assets[0].uri);
    }
  };

  const handleRemoveImage = () => {
    setStyleImage('');
    setCreateJobField('stylePreferenceImage', '');
  };

  const handleContinue = () => {
    setCreateJobField('descriptionText', description);
    setCreateJobField('specialInstruction', specialInstructions);
    setCreateJobField('atUserLocation', locationMode === 'user');
    setCreateJobField('atSpLocation', locationMode === 'sp');
    navigation.navigate('SuggestedMovers');
  };

  const getDisplayDateText = () => {
    if (createJob.jobStartTime && parseDate(createJob.jobStartTime)) {
      return formatJobDate(createJob.jobStartTime);
    }
    return formatJobDate(date);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Booking Specifications</Text>
            <Text style={styles.headerSubtitle}>Step 2 of 4 • Custom Options</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Selected Service Banner Card */}
          <View style={styles.serviceBanner}>
            <View style={styles.serviceIconBadge}>
              <MaterialCommunityIcons name="content-cut" size={26} color={Colors.ButtonPrimaryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.serviceCategoryText}>SELECTED SERVICE</Text>
              <Text style={styles.serviceTitle}>{createJob.subServiceName || 'Custom Haircut & Styling'}</Text>
              {serviceInfo && (
                <View style={styles.serviceMetaRow}>
                  <View style={styles.metaTag}>
                    <Ionicons name="time-outline" size={12} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
                    <Text style={styles.metaTagText}>{serviceInfo.duration} {serviceInfo.durationUnit || 'mins'}</Text>
                  </View>
                  <Text style={styles.planNameText}>• {serviceInfo.name}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Appointment Schedule Picker */}
          <Text style={styles.sectionLabel}>1. APPOINTMENT SCHEDULE</Text>
          <TouchableOpacity
            style={styles.dateCard}
            onPress={handleOpenDatePicker}
            activeOpacity={0.85}
          >
            <View style={styles.dateIconCircle}>
              <Ionicons name="calendar" size={20} color={Colors.ButtonPrimaryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Date & Time</Text>
              <Text style={styles.dateValueText}>{getDisplayDateText()}</Text>
            </View>
            <View style={styles.changePill}>
              <Text style={styles.changePillText}>Change</Text>
            </View>
          </TouchableOpacity>

          {/* Service Delivery Location Mode */}
          <Text style={styles.sectionLabel}>2. SERVICE DELIVERY MODE</Text>
          <View style={styles.locationContainer}>
            <TouchableOpacity
              style={[styles.locationOptionCard, locationMode === 'user' && styles.locationOptionActive]}
              onPress={() => setLocationMode('user')}
              activeOpacity={0.85}
            >
              <View style={[styles.locationIconBadge, locationMode === 'user' && styles.locationIconBadgeActive]}>
                <Ionicons name="home-outline" size={20} color={locationMode === 'user' ? Colors.ButtonPrimaryColor : '#64748B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationOptionTitle, locationMode === 'user' && styles.locationOptionTitleActive]}>
                  Mobile Barber (At My Location)
                </Text>
                <Text style={styles.locationOptionSub}>Barber comes directly to your home, office, or hotel</Text>
              </View>
              <View style={[styles.radioCircle, locationMode === 'user' && styles.radioCircleActive]}>
                {locationMode === 'user' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.locationOptionCard, locationMode === 'sp' && styles.locationOptionActive]}
              onPress={() => setLocationMode('sp')}
              activeOpacity={0.85}
            >
              <View style={[styles.locationIconBadge, locationMode === 'sp' && styles.locationIconBadgeActive]}>
                <Ionicons name="storefront-outline" size={20} color={locationMode === 'sp' ? Colors.ButtonPrimaryColor : '#64748B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.locationOptionTitle, locationMode === 'sp' && styles.locationOptionTitleActive]}>
                  Barber Shop / Salon Visit
                </Text>
                <Text style={styles.locationOptionSub}>You visit the service provider's shop or salon</Text>
              </View>
              <View style={[styles.radioCircle, locationMode === 'sp' && styles.radioCircleActive]}>
                {locationMode === 'sp' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            {/* Selected Address Pill */}
            <TouchableOpacity
              style={styles.addressPill}
              onPress={() => navigation.navigate('SetLocation')}
              activeOpacity={0.85}
            >
              <Ionicons name="location" size={18} color={Colors.ButtonPrimaryColor} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.addressPillLabel}>DELIVERY ADDRESS</Text>
                <Text style={styles.addressPillText} numberOfLines={1}>
                  {createJob.primaryAddress || 'Set your primary address'}
                </Text>
              </View>
              <Ionicons name="pencil" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Service Notes & Specifications */}
          <Text style={styles.sectionLabel}>3. SERVICE NOTES & INSTRUCTIONS</Text>

          <VTTextField
            label="Service Description *"
            placeholder="Specify haircut style, beard length, guard numbers (e.g. #2 Fade)..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            leftIcon={<Ionicons name="create-outline" size={18} color="#64748B" />}
          />

          <VTTextField
            label="Special Requests (Optional)"
            placeholder="Any allergies, parking instructions, or special requests..."
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={2}
            leftIcon={<Ionicons name="information-circle-outline" size={18} color="#64748B" />}
          />

          {/* Reference Photo Attachment */}
          <Text style={styles.sectionLabel}>4. REFERENCE PHOTO (OPTIONAL)</Text>

          {styleImage ? (
            <View style={styles.imagePreviewCard}>
              <Image source={{ uri: styleImage }} style={styles.imagePreview} />
              <View style={styles.imagePreviewInfo}>
                <Text style={styles.imagePreviewTitle}>Reference Haircut Photo Attached</Text>
                <Text style={styles.imagePreviewSub}>Barber will view this photo before service</Text>
                <TouchableOpacity onPress={handleRemoveImage} style={styles.removePhotoButton}>
                  <Ionicons name="trash-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.removePhotoText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadCard} onPress={handleImagePick} activeOpacity={0.8}>
              <View style={styles.uploadIconCircle}>
                <Ionicons name="camera" size={24} color={Colors.ButtonPrimaryColor} />
              </View>
              <Text style={styles.uploadTitle}>Upload Reference Hair Style Photo</Text>
              <Text style={styles.uploadSub}>Attach a photo of the exact cut or style you want</Text>
            </TouchableOpacity>
          )}

          {/* Action Button */}
          <VTButton
            title="Search Available Professionals →"
            onPress={handleContinue}
            disabled={!description.trim()}
            style={styles.continueButton}
            textStyle={styles.continueButtonText}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  serviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(34, 45, 99, 0.15)',
  },
  serviceIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceCategoryText: {
    fontSize: 9,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  serviceTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    marginTop: 2,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  metaTagText: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  planNameText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    color: '#334155',
    marginLeft: 6,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  dateIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dateLabel: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
  },
  dateValueText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginTop: 2,
  },
  changePill: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  changePillText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  locationContainer: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  locationOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  locationOptionActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  locationIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  locationIconBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  locationOptionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  locationOptionTitleActive: {
    color: Colors.ButtonPrimaryColor,
  },
  locationOptionSub: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  radioCircleActive: {
    borderColor: Colors.ButtonPrimaryColor,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressPillLabel: {
    fontSize: 9,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addressPillText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginTop: 2,
  },
  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.ButtonPrimaryColor,
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  uploadTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  uploadSub: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  imagePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
  },
  imagePreviewInfo: {
    flex: 1,
  },
  imagePreviewTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  imagePreviewSub: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  removePhotoText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#EF4444',
  },
  continueButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.md,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default UserJobDetailScreen;
