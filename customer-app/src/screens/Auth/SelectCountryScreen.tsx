import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing } from '../../theme/spacing';

const dummyCountries = [
  { id: '1', name: 'United States', phoneCode: '+1', countryCode: 'US' },
  { id: '2', name: 'United Kingdom', phoneCode: '+44', countryCode: 'GB' },
  { id: '3', name: 'Canada', phoneCode: '+1', countryCode: 'CA' },
];

const SelectCountryScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select Country</Text>
      <FlatList
        data={dummyCountries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>{item.name} ({item.phoneCode})</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.BGColor },
  title: { fontSize: FontSizes['2xl'], fontFamily: Fonts.uberMoveBold, color: Colors.TitleColor, padding: Spacing.xl },
  item: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.CardColor },
  itemText: { fontSize: FontSizes.base, fontFamily: Fonts.uberMoveRegular, color: Colors.TitleColor },
});

export default SelectCountryScreen;
