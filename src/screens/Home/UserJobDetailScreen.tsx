import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField } from '../../components/common';
import { useJobStore } from '../../store';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'UserJobDetail'>;
  route: RouteProp<HomeStackParamList, 'UserJobDetail'>;
};

const UserJobDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceInfo } = route.params;
  const { createJob, setCreateJobField } = useJobStore();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [atUserLocation, setAtUserLocation] = useState(true);
  const [atSpLocation, setAtSpLocation] = useState(false);
  const [styleImage, setStyleImage] = useState('');

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setCreateJobField('jobStartTime', selectedDate.toISOString());
    }
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
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

  const handleContinue = () => {
    setCreateJobField('descriptionText', description);
    setCreateJobField('specialInstruction', specialInstructions);
    setCreateJobField('atUserLocation', atUserLocation);
    setCreateJobField('atSpLocation', atSpLocation);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.back}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Job Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Service Info Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Service</Text>
            <Text style={styles.summaryValue}>{createJob.subServiceName}</Text>
            {serviceInfo && (
              <Text style={styles.summaryPlan}>
                Plan: {serviceInfo.name} • {serviceInfo.duration} {serviceInfo.durationUnit}
              </Text>
            )}
          </View>

          {/* Date/Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Date & Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
              <Text style={styles.dateButtonIcon}>📅</Text>
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

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Service Location</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>At my location</Text>
              <Switch
                value={atUserLocation}
                onValueChange={(val) => {
                  setAtUserLocation(val);
                  if (val) setAtSpLocation(false);
                }}
                trackColor={{ false: Colors.CardColor, true: `${Colors.ButtonPrimaryColor}50` }}
                thumbColor={atUserLocation ? Colors.ButtonPrimaryColor : Colors.disabledGray}
              />
            </View>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>At service provider's location</Text>
              <Switch
                value={atSpLocation}
                onValueChange={(val) => {
                  setAtSpLocation(val);
                  if (val) setAtUserLocation(false);
                }}
                trackColor={{ false: Colors.CardColor, true: `${Colors.ButtonPrimaryColor}50` }}
                thumbColor={atSpLocation ? Colors.ButtonPrimaryColor : Colors.disabledGray}
              />
            </View>
            <TouchableOpacity
              style={styles.addressButton}
              onPress={() => navigation.navigate('SetLocation')}
            >
              <Text style={styles.addressButtonText}>
                {createJob.primaryAddress || 'Set Address'}
              </Text>
              <Text>→</Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <VTTextField
              label="Description"
              placeholder="Describe what you need..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <VTTextField
              label="Special Instructions"
              placeholder="Any special requests..."
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Style Preference Image */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Style Preference (Optional)</Text>
            <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
              {styleImage ? (
                <Text style={styles.imageButtonText}>✅ Image selected</Text>
              ) : (
                <Text style={styles.imageButtonText}>📷 Upload reference photo</Text>
              )}
            </TouchableOpacity>
          </View>

          <VTButton
            title="Find Available Workers"
            onPress={handleContinue}
            disabled={!description.trim()}
            style={styles.continueButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BGColor,
  },
  keyboardView: {
    flex: 1,
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
  summaryCard: {
    backgroundColor: `${Colors.ButtonPrimaryColor}08`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.ButtonPrimaryColor,
  },
  summaryLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  summaryPlan: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.PlaceholderActive,
    marginBottom: Spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.TextFieldColor,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dateButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.TitleColor,
  },
  dateButtonIcon: {
    fontSize: FontSizes.lg,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  locationText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.TitleColor,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.TextFieldColor,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  addressButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.TitleColor,
  },
  imageButton: {
    backgroundColor: Colors.TextFieldColor,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.CardColor,
  },
  imageButtonText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
  },
  continueButton: {
    marginTop: Spacing.lg,
  },
});

export default UserJobDetailScreen;
