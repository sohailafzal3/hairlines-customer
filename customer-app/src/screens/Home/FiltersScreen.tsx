import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Slider } from '@miblanchard/react-native-slider';
import { HomeStackParamList } from '../../navigation/HomeNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, Button } from '../../components';
import { useJobStore } from '../../store';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Filters'>;
};

const FiltersScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { createJob, setCreateJob } = useJobStore();

  // Gender: 0 = Both, 1 = Male, 2 = Female
  const [selectedGender, setSelectedGender] = useState<number>(
    createJob.barberGender === 'male' || (createJob.barberGender as any) === 1
      ? 1
      : createJob.barberGender === 'female' || (createJob.barberGender as any) === 2
      ? 2
      : 0
  );

  // Distance in miles (0 to 50)
  const [distance, setDistance] = useState<number>(
    createJob.distance && createJob.distance > 0 ? createJob.distance : 25
  );

  // Minimum rating (0 to 5)
  const [minRating, setMinRating] = useState<number>(
    createJob.minRating && createJob.minRating > 0 ? createJob.minRating : 0
  );

  const handleApply = () => {
    setCreateJob({
      barberGender: selectedGender === 1 ? 'male' : selectedGender === 2 ? 'female' : 'any',
      distance: distance,
      minRating: minRating,
      maxRating: 5.0,
      isFilterApplied: true,
    });

    Toast.show({
      type: 'success',
      text1: 'Filters Applied',
      text2: 'Stylist results have been updated',
    });

    navigation.goBack();
  };

  const handleClearAll = () => {
    setSelectedGender(0);
    setDistance(25);
    setMinRating(0);

    setCreateJob({
      barberGender: 'any',
      distance: 0,
      minRating: 0,
      maxRating: 5.0,
      isFilterApplied: false,
    });

    Toast.show({
      type: 'info',
      text1: 'Filters Reset',
    });

    navigation.goBack();
  };

  const ratingOptions = [
    { label: 'All Ratings', value: 0 },
    { label: '3.5 ★ & above', value: 3.5 },
    { label: '4.0 ★ & above', value: 4.0 },
    { label: '4.5 ★ & above', value: 4.5 },
    { label: '5.0 ★ Only', value: 5.0 },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Filter Stylists"
        onBackPress={() => navigation.goBack()}
        right={
          <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 80 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Gender Preference */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.sectionTitle}>Stylist Gender</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Select your preferred service provider gender</Text>

          <View style={styles.genderRow}>
            {[
              { label: 'Both / Any', value: 0, icon: 'people' },
              { label: 'Male', value: 1, icon: 'man' },
              { label: 'Female', value: 2, icon: 'woman' },
            ].map((item) => {
              const isSelected = selectedGender === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[styles.genderCard, isSelected && styles.genderCardActive]}
                  onPress={() => setSelectedGender(item.value)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={isSelected ? Colors.ButtonPrimaryColor : '#64748B'}
                  />
                  <Text style={[styles.genderLabel, isSelected && styles.genderLabelActive]}>
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.ButtonPrimaryColor} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Distance Range */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="navigate-outline" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.sectionTitle}>Maximum Distance</Text>
          </View>
          <View style={styles.distanceValueRow}>
            <Text style={styles.sectionSubtitle}>Show stylists within radius</Text>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceBadgeText}>{Math.round(distance)} miles</Text>
            </View>
          </View>

          <View style={styles.sliderWrapper}>
            <Slider
              value={distance}
              onValueChange={(val: any) => setDistance(Array.isArray(val) ? val[0] : val)}
              minimumValue={1}
              maximumValue={50}
              step={1}
              minimumTrackTintColor={Colors.ButtonPrimaryColor}
              maximumTrackTintColor="#E2E8F0"
              thumbTintColor={Colors.ButtonPrimaryColor}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderMinMax}>1 mi</Text>
              <Text style={styles.sliderMinMax}>25 mi</Text>
              <Text style={styles.sliderMinMax}>50 mi</Text>
            </View>
          </View>
        </View>

        {/* Minimum Rating */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star-outline" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Filter by customer satisfaction score</Text>

          <View style={styles.ratingChipsContainer}>
            {ratingOptions.map((opt) => {
              const isSelected = minRating === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.ratingChip, isSelected && styles.ratingChipActive]}
                  onPress={() => setMinRating(opt.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ratingChipText, isSelected && styles.ratingChipTextActive]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color="#FFFFFF"
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title="Apply Filters" onPress={handleApply} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  resetText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: '#DC2626',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginLeft: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  genderCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  genderCardActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}0C`,
  },
  genderLabel: {
    fontSize: 13,
    fontWeight: FontWeights.semibold,
    color: '#475569',
    marginTop: 6,
  },
  genderLabelActive: {
    color: Colors.ButtonPrimaryColor,
    fontWeight: FontWeights.bold,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  distanceValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceBadge: {
    backgroundColor: `${Colors.ButtonPrimaryColor}14`,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  distanceBadgeText: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  sliderWrapper: {
    marginTop: 10,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sliderMinMax: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: FontWeights.medium,
  },
  ratingChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  ratingChipActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  ratingChipText: {
    fontSize: 13,
    fontWeight: FontWeights.semibold,
    color: '#475569',
  },
  ratingChipTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeights.bold,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: Spacing.base,
  },
});

export default FiltersScreen;
