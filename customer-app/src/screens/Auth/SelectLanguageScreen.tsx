import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button } from '../../components';

const languages = [
  { id: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { id: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { id: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { id: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { id: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
];

interface Props {
  navigation: any;
}

const SelectLanguageScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedLang, setSelectedLang] = useState('en');

  const handleSave = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.ScreenBG} />

      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
        </TouchableOpacity>

        <Text style={styles.title}>Select Language</Text>
        <Text style={styles.subtitle}>Choose your preferred application language</Text>
      </View>

      <FlatList
        data={languages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 80 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selectedLang === item.id;
          return (
            <TouchableOpacity
              style={[
                styles.languageCard,
                isSelected && styles.languageCardActive,
              ]}
              onPress={() => setSelectedLang(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.flagEmoji}>{item.flag}</Text>
              <View style={styles.langInfo}>
                <Text style={styles.langName}>{item.name}</Text>
                <Text style={styles.nativeName}>{item.native}</Text>
              </View>
              <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Button title="Apply Language" onPress={handleSave} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    marginBottom: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: '#64748B',
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.BorderColor,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  languageCardActive: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  flagEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  langInfo: {
    flex: 1,
  },
  langName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: '#0F172A',
  },
  nativeName: {
    fontSize: FontSizes.xs,
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
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderColor,
    backgroundColor: '#FFFFFF',
  },
});

export default SelectLanguageScreen;

