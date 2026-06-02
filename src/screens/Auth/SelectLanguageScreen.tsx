import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing } from '../../theme/spacing';

const languages = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Spanish' },
  { id: 'et', name: 'Estonian' },
  { id: 'ru', name: 'Russian' },
];

const SelectLanguageScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Select Language</Text>
      <FlatList
        data={languages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
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

export default SelectLanguageScreen;
