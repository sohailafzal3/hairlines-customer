import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton } from '../../components/common';
import { useJobStore, useUserStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Filters'>;
};

const RATING_OPTIONS = [
  { label: 'Any Rating', value: 0 },
  { label: '3.5 ★ & above', value: 3.5 },
  { label: '4.0 ★ & above', value: 4.0 },
  { label: '4.5 ★ & above', value: 4.5 },
];

const DISTANCE_OPTIONS = [
  { label: '5 miles', value: 5 },
  { label: '10 miles', value: 10 },
  { label: '25 miles', value: 25 },
  { label: '50+ miles', value: 50 },
];

const GENDER_OPTIONS = [
  { label: 'Any Barber', value: 'any' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const LOCATION_OPTIONS = [
  { label: 'At My Location (Mobile)', key: 'user' },
  { label: "At Barber's Salon", key: 'sp' },
  { label: 'Both Options', key: 'both' },
];

const FiltersScreen: React.FC<Props> = ({ navigation }) => {
  const { createJob, setCreateJobField } = useJobStore();
  const { filters, setFilters } = useUserStore();

  const [minRating, setMinRating] = useState<number>(createJob?.minRating || 0);
  const [distance, setDistance] = useState<number>(createJob?.distance || 25);
  const [barberGender, setBarberGender] = useState<string>(createJob?.barberGender || 'any');
  const [locationType, setLocationType] = useState<string>('both');

  const handleApplyFilters = () => {
    setCreateJobField('minRating', minRating);
    setCreateJobField('distance', distance);
    setCreateJobField('barberGender', barberGender);
    setCreateJobField('isFilterApplied', true);

    setFilters({
      minAge: 18,
      maxAge: 65,
      distance,
    });

    Toast.show({
      type: 'success',
      text1: 'Filters Applied',
      text2: 'Search results updated with your preferences.',
    });
    navigation.goBack();
  };

  const handleReset = () => {
    setMinRating(0);
    setDistance(25);
    setBarberGender('any');
    setLocationType('both');
    setCreateJobField('isFilterApplied', false);
    setFilters(null);

    Toast.show({
      type: 'info',
      text1: 'Filters Reset',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
        </TouchableOpacity>
        <Text style={styles.title}>Filter Professionals</Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetTouch}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Customize your service provider search</Text>

        {/* 1. Rating Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Minimum Rating</Text>
          <View style={styles.chipRow}>
            {RATING_OPTIONS.map((opt) => {
              const isActive = minRating === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setMinRating(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Distance Radius Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Maximum Distance</Text>
          <View style={styles.chipRow}>
            {DISTANCE_OPTIONS.map((opt) => {
              const isActive = distance === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setDistance(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Provider Gender Preference */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Provider Gender</Text>
          <View style={styles.chipRow}>
            {GENDER_OPTIONS.map((opt) => {
              const isActive = barberGender === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setBarberGender(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Service Location Mode */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Service Location Preference</Text>
          <View style={styles.columnStack}>
            {LOCATION_OPTIONS.map((opt) => {
              const isActive = locationType === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.locationCard, isActive && styles.locationCardActive]}
                  onPress={() => setLocationType(opt.key)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isActive ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isActive ? Colors.ButtonPrimaryColor : '#94A3B8'}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[styles.locationCardText, isActive && styles.locationCardTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Apply Button */}
        <VTButton
          title="Apply Filters"
          onPress={handleApplyFilters}
          style={styles.applyButton}
          textStyle={styles.applyButtonText}
        />
      </ScrollView>
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
  resetTouch: {
    padding: 6,
  },
  resetText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
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
  filterSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  chipText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: Fonts.uberMoveBold,
  },
  columnStack: {
    gap: Spacing.sm,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationCardActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  locationCardText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: '#334155',
  },
  locationCardTextActive: {
    color: Colors.ButtonPrimaryColor,
    fontFamily: Fonts.uberMoveBold,
  },
  applyButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.lg,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default FiltersScreen;
