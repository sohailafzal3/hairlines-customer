import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';
import { useJobStore, useAuthStore } from '../../store';
import { JobsApi, UploadApi } from '../../api';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'UserJobDetail'>;
  route: RouteProp<HomeStackParamList, 'UserJobDetail'>;
};

interface Member {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  relation: string;
  age?: number;
  health?: number;
}

const UserJobDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { serviceInfo } = route.params;
  const { createJob, setCreateJobField } = useJobStore();
  const { user } = useAuthStore();

  const [date, setDate] = useState(new Date(Date.now() + 3600 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState(createJob.descriptionText || '');
  const [specialInstructions, setSpecialInstructions] = useState(createJob.specialInstruction || '');
  const [atUserLocation, setAtUserLocation] = useState(createJob.atUserLocation ?? true);
  const [atSpLocation, setAtSpLocation] = useState(createJob.atSpLocation ?? false);
  const [barberGender, setBarberGender] = useState<'any' | 'male' | 'female'>('any');

  // Members
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [newMemberFirstName, setNewMemberFirstName] = useState('');
  const [newMemberLastName, setNewMemberLastName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState('Family');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberNeedsAssistance, setNewMemberNeedsAssistance] = useState(false);
  const [savingMember, setSavingMember] = useState(false);

  // Style Image Upload
  const [styleImageUri, setStyleImageUri] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await JobsApi.getAllNewMembers();
      const list = res?.members || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setMembers(list);
      }
    } catch (e) {
      console.log('Error loading members:', e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSaveMember = async () => {
    if (!newMemberFirstName.trim()) {
      Alert.alert('Required', 'Please enter first name');
      return;
    }
    try {
      setSavingMember(true);
      await JobsApi.addNewMember({
        firstName: newMemberFirstName.trim(),
        lastName: newMemberLastName.trim(),
        relation: newMemberRelation,
        age: parseInt(newMemberAge, 10) || 18,
        health: newMemberNeedsAssistance ? 1 : 0,
      });
      setIsAddMemberModalVisible(false);
      setNewMemberFirstName('');
      setNewMemberLastName('');
      setNewMemberAge('');
      setNewMemberNeedsAssistance(false);
      await loadMembers();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add member');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    Alert.alert('Delete Member', 'Are you sure you want to remove this member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await JobsApi.deleteMember(memberId);
            if (selectedMemberId === memberId) setSelectedMemberId('');
            await loadMembers();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setCreateJobField('jobStartTime', selectedDate.toISOString());
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please grant photo library access to upload a reference photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setStyleImageUri(asset.uri);

      try {
        setUploadingImage(true);
        const formData = new FormData();
        const filename = asset.uri.split('/').pop() || 'style_reference.jpg';
        formData.append('image', {
          uri: asset.uri,
          name: filename,
          type: 'image/jpeg',
        } as any);

        const uploadRes: any = await UploadApi.uploadStylePreference(formData);
        const uploadedUrl = uploadRes?.imageUrl || uploadRes?.data?.imageUrl || uploadRes?.url || asset.uri;
        setCreateJobField('stylePreferenceImage', uploadedUrl);
      } catch (err) {
        console.warn('Style preference upload failed, using local URI:', err);
        setCreateJobField('stylePreferenceImage', asset.uri);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleContinue = () => {
    setCreateJobField('jobStartTime', date.toISOString());
    setCreateJobField('descriptionText', description);
    setCreateJobField('specialInstruction', specialInstructions);
    setCreateJobField('atUserLocation', atUserLocation);
    setCreateJobField('atSpLocation', atSpLocation);
    setCreateJobField('barberGender', barberGender);
    setCreateJobField('memberId', selectedMemberId);

    navigation.navigate('SuggestedMovers');
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.TitleColor} />
          </TouchableOpacity>
          <Text style={styles.title}>Appointment Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 100, 120) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Service Info Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryIconBadge}>
                <MaterialCommunityIcons name="content-cut" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>Selected Service</Text>
                <Text style={styles.summaryValue}>{createJob.subServiceName || 'Haircut & Styling'}</Text>
                {serviceInfo?.subServiceCharges && (
                  <Text style={styles.summaryPrice}>${serviceInfo.subServiceCharges.toFixed(2)}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Section: Who is this service for? */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="person-outline" size={18} color={Colors.ButtonPrimaryColor} />
                <Text style={styles.sectionCardTitle}>Service Recipient</Text>
              </View>
              <TouchableOpacity
                style={styles.addMemberBtn}
                onPress={() => setIsAddMemberModalVisible(true)}
              >
                <Ionicons name="add" size={16} color={Colors.ButtonPrimaryColor} />
                <Text style={styles.addMemberBtnText}>Add Member</Text>
              </TouchableOpacity>
            </View>

            {/* Self Option */}
            <TouchableOpacity
              style={[
                styles.memberOption,
                selectedMemberId === '' && styles.memberOptionActive,
              ]}
              onPress={() => setSelectedMemberId('')}
            >
              <Ionicons
                name={selectedMemberId === '' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedMemberId === '' ? Colors.ButtonPrimaryColor : Colors.DescriptionTextLight}
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Myself'}</Text>
                <Text style={styles.memberSub}>Primary Account Holder</Text>
              </View>
            </TouchableOpacity>

            {/* Additional Members */}
            {loadingMembers ? (
              <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} style={{ marginVertical: 12 }} />
            ) : (
              members.map((m) => {
                const mId = m._id || m.id || '';
                const isSelected = selectedMemberId === mId;
                return (
                  <View key={mId} style={[styles.memberOption, isSelected && styles.memberOptionActive]}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      onPress={() => setSelectedMemberId(mId)}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? Colors.ButtonPrimaryColor : Colors.DescriptionTextLight}
                      />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{m.firstName} {m.lastName}</Text>
                        <Text style={styles.memberSub}>
                          {m.relation} {m.age ? `• ${m.age} yrs` : ''} {m.health === 1 ? '• Special Assistance' : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteMember(mId)}
                      style={styles.deleteMemberBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.errorViewColor} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>

          {/* Section: Date & Time */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionCardTitle}>Date & Time Schedule</Text>
            </View>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <View>
                <Text style={styles.dateFieldLabel}>Scheduled Start Time</Text>
                <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
              </View>
              <Ionicons name="calendar" size={22} color={Colors.ButtonPrimaryColor} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="datetime"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Section: Service Location */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="location-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionCardTitle}>Service Location</Text>
            </View>

            <View style={styles.locationToggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>At My Location / Home</Text>
                <Text style={styles.locationSub}>Stylist travels to your address</Text>
              </View>
              <Switch
                value={atUserLocation}
                onValueChange={(val) => {
                  setAtUserLocation(val);
                  setAtSpLocation(!val);
                }}
                trackColor={{ false: '#E2E8F0', true: '#222D63' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.locationToggleRow, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>At Stylist Salon / Premise</Text>
                <Text style={styles.locationSub}>You visit the professional's studio</Text>
              </View>
              <Switch
                value={atSpLocation}
                onValueChange={(val) => {
                  setAtSpLocation(val);
                  setAtUserLocation(!val);
                }}
                trackColor={{ false: '#E2E8F0', true: '#222D63' }}
                thumbColor="#FFFFFF"
              />
            </View>

            {atUserLocation && (
              <TouchableOpacity
                style={styles.addressBox}
                onPress={() => navigation.navigate('SetLocation')}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={20} color={Colors.ButtonPrimaryColor} />
                <View style={{ flex: 1, marginHorizontal: 10 }}>
                  <Text style={styles.addressBoxLabel}>Service Address</Text>
                  <Text style={styles.addressBoxText} numberOfLines={2}>
                    {createJob.primaryAddress || 'Tap to select or change address'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.DescriptionTextLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* Section: Barber Gender Preference */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="people-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionCardTitle}>Hairstylist Gender Preference</Text>
            </View>
            <View style={styles.genderRow}>
              {[
                { label: 'Any', value: 'any' as const },
                { label: 'Male', value: 'male' as const },
                { label: 'Female', value: 'female' as const },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.genderTab,
                    barberGender === item.value && styles.genderTabActive,
                  ]}
                  onPress={() => setBarberGender(item.value)}
                >
                  <Text
                    style={[
                      styles.genderTabText,
                      barberGender === item.value && styles.genderTabTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Section: Description & Special Instructions */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionCardTitle}>Details & Instructions</Text>
            </View>

            <VTTextField
              label="Work Description"
              placeholder="e.g. Skin fade with beard line-up and scissors cut on top..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={{ height: 12 }} />

            <VTTextField
              label="Special Instructions (Optional)"
              placeholder="e.g. Ring apartment 4B, parking available in driveway..."
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Section: Style Reference Photo */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="image-outline" size={18} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.sectionCardTitle}>Style Reference Photo (Optional)</Text>
            </View>

            <TouchableOpacity
              style={styles.photoUploadContainer}
              onPress={handleImagePick}
              activeOpacity={0.8}
            >
              {uploadingImage ? (
                <ActivityIndicator size="small" color={Colors.ButtonPrimaryColor} />
              ) : styleImageUri ? (
                <View style={styles.photoSelectedWrapper}>
                  <Image source={{ uri: styleImageUri }} style={styles.previewImage} />
                  <View style={styles.photoOverlayBadge}>
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                    <Text style={styles.photoOverlayText}>Change Photo</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.photoUploadPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={Colors.ButtonPrimaryColor} />
                  <Text style={styles.photoUploadTitle}>Upload Style Example</Text>
                  <Text style={styles.photoUploadSub}>Tap to select haircut or style photo from library</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Pinned Bottom Continue Button */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom + 12, 16) },
          ]}
        >
          <VTButton
            title="Find Available Stylists"
            onPress={handleContinue}
            disabled={!description.trim()}
          />
        </View>

        {/* Modal: Add Member */}
        <Modal
          visible={isAddMemberModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setIsAddMemberModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalBackdrop}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Family / Member</Text>
                <TouchableOpacity onPress={() => setIsAddMemberModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.TitleColor} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <VTTextField
                  label="First Name"
                  placeholder="First name"
                  value={newMemberFirstName}
                  onChangeText={setNewMemberFirstName}
                />
                <View style={{ height: 12 }} />
                <VTTextField
                  label="Last Name"
                  placeholder="Last name"
                  value={newMemberLastName}
                  onChangeText={setNewMemberLastName}
                />
                <View style={{ height: 12 }} />
                <VTTextField
                  label="Relationship"
                  placeholder="e.g. Son, Daughter, Spouse, Parent"
                  value={newMemberRelation}
                  onChangeText={setNewMemberRelation}
                />
                <View style={{ height: 12 }} />
                <VTTextField
                  label="Age"
                  placeholder="e.g. 12"
                  value={newMemberAge}
                  onChangeText={setNewMemberAge}
                  keyboardType="number-pad"
                />
                <View style={{ height: 14 }} />
                <View style={styles.modalSwitchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalSwitchTitle}>Special Physical Assistance</Text>
                    <Text style={styles.modalSwitchSub}>Requires extra assistance or care</Text>
                  </View>
                  <Switch
                    value={newMemberNeedsAssistance}
                    onValueChange={setNewMemberNeedsAssistance}
                    trackColor={{ false: '#E2E8F0', true: '#222D63' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={{ height: 20 }} />
                <VTButton
                  title="Save Member"
                  onPress={handleSaveMember}
                  loading={savingMember}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.ButtonPrimaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginTop: 2,
  },
  summaryPrice: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionCardTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginLeft: 8,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.ButtonPrimaryColor}12`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addMemberBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.ButtonPrimaryColor,
    marginLeft: 2,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 8,
    backgroundColor: '#F8FAFC',
  },
  memberOptionActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}08`,
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
  },
  memberSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  deleteMemberBtn: {
    padding: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  dateFieldLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  dateButtonText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
    marginTop: 2,
  },
  locationToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.TitleColor,
  },
  locationSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  addressBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  addressBoxText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.TitleColor,
    marginTop: 2,
  },
  genderRow: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 10,
  },
  genderTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  genderTabActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: Colors.ButtonPrimaryColor,
  },
  genderTabText: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: '#64748B',
  },
  genderTabTextActive: {
    color: '#FFFFFF',
  },
  photoUploadContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    marginTop: 6,
  },
  photoUploadPlaceholder: {
    padding: 24,
    alignItems: 'center',
  },
  photoUploadTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.ButtonPrimaryColor,
    marginTop: 8,
  },
  photoUploadSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  photoSelectedWrapper: {
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlayBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoOverlayText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.base,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalSwitchTitle: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.TitleColor,
  },
  modalSwitchSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default UserJobDetailScreen;
