import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';

export interface CountryItem {
  id: string;
  name: string;
  phoneCode: string;
  countryCode: string;
  flag: string;
}

export const COUNTRIES_DATA: CountryItem[] = [
  { id: 'US', name: 'United States', phoneCode: '+1', countryCode: 'US', flag: '🇺🇸' },
  { id: 'CA', name: 'Canada', phoneCode: '+1', countryCode: 'CA', flag: '🇨🇦' },
  { id: 'GB', name: 'United Kingdom', phoneCode: '+44', countryCode: 'GB', flag: '🇬🇧' },
  { id: 'AU', name: 'Australia', phoneCode: '+61', countryCode: 'AU', flag: '🇦🇺' },
  { id: 'DE', name: 'Germany', phoneCode: '+49', countryCode: 'DE', flag: '🇩🇪' },
  { id: 'FR', name: 'France', phoneCode: '+33', countryCode: 'FR', flag: '🇫🇷' },
  { id: 'IT', name: 'Italy', phoneCode: '+39', countryCode: 'IT', flag: '🇮🇹' },
  { id: 'ES', name: 'Spain', phoneCode: '+34', countryCode: 'ES', flag: '🇪🇸' },
  { id: 'MX', name: 'Mexico', phoneCode: '+52', countryCode: 'MX', flag: '🇲🇽' },
  { id: 'BR', name: 'Brazil', phoneCode: '+55', countryCode: 'BR', flag: '🇧🇷' },
  { id: 'IN', name: 'India', phoneCode: '+91', countryCode: 'IN', flag: '🇮🇳' },
  { id: 'PK', name: 'Pakistan', phoneCode: '+92', countryCode: 'PK', flag: '🇵🇰' },
  { id: 'AE', name: 'United Arab Emirates', phoneCode: '+971', countryCode: 'AE', flag: '🇦🇪' },
  { id: 'SA', name: 'Saudi Arabia', phoneCode: '+966', countryCode: 'SA', flag: '🇸🇦' },
  { id: 'NG', name: 'Nigeria', phoneCode: '+234', countryCode: 'NG', flag: '🇳🇬' },
  { id: 'ZA', name: 'South Africa', phoneCode: '+27', countryCode: 'ZA', flag: '🇿🇦' },
  { id: 'JP', name: 'Japan', phoneCode: '+81', countryCode: 'JP', flag: '🇯🇵' },
  { id: 'KR', name: 'South Korea', phoneCode: '+82', countryCode: 'KR', flag: '🇰🇷' },
  { id: 'SG', name: 'Singapore', phoneCode: '+65', countryCode: 'SG', flag: '🇸🇬' },
  { id: 'CN', name: 'China', phoneCode: '+86', countryCode: 'CN', flag: '🇨🇳' },
  { id: 'NL', name: 'Netherlands', phoneCode: '+31', countryCode: 'NL', flag: '🇳🇱' },
  { id: 'SE', name: 'Sweden', phoneCode: '+46', countryCode: 'SE', flag: '🇸🇪' },
  { id: 'CH', name: 'Switzerland', phoneCode: '+41', countryCode: 'CH', flag: '🇨🇭' },
  { id: 'IE', name: 'Ireland', phoneCode: '+353', countryCode: 'IE', flag: '🇮🇪' },
  { id: 'NZ', name: 'New Zealand', phoneCode: '+64', countryCode: 'NZ', flag: '🇳🇿' },
];

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'SelectCountry'>;
  route: RouteProp<AuthStackParamList, 'SelectCountry'>;
};

const SelectCountryScreen: React.FC<Props> = ({ navigation, route }) => {
  const selectedCode = route.params?.selectedCode || '+1';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES_DATA.filter((country) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      country.name.toLowerCase().includes(q) ||
      country.phoneCode.includes(q) ||
      country.countryCode.toLowerCase().includes(q)
    );
  });

  const handleSelectCountry = (country: CountryItem) => {
    navigation.navigate('SignIn', {
      isSignUp: false,
      selectedCountryCode: country.phoneCode,
      selectedFlag: country.flag,
    });
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

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Select Country</Text>
          <Text style={styles.subtitle}>Choose your country or region code</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search country or code (e.g. +92, USA)"
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Country List */}
      <FlatList
        data={filteredCountries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedCode === item.phoneCode;
          return (
            <TouchableOpacity
              style={[styles.countryItem, isSelected && styles.countryItemActive]}
              onPress={() => handleSelectCountry(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.flagEmoji}>{item.flag}</Text>

              <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryIsoCode}>{item.countryCode}</Text>
              </View>

              <View style={styles.rightSection}>
                <View style={styles.phoneCodeBadge}>
                  <Text style={styles.phoneCodeText}>{item.phoneCode}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.ButtonPrimaryColor} style={{ marginLeft: 8 }} />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="earth-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No country found</Text>
            <Text style={styles.emptySub}>Try searching with another name or code</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleContainer: {
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
  },
  searchSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: '#0F172A',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  countryItemActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  flagEmoji: {
    fontSize: 26,
    marginRight: Spacing.md,
  },
  countryInfo: {
    flex: 1,
  },
  countryName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  countryIsoCode: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneCodeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  phoneCodeText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginTop: Spacing.md,
  },
  emptySub: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#94A3B8',
    marginTop: 4,
  },
});

export default SelectCountryScreen;
