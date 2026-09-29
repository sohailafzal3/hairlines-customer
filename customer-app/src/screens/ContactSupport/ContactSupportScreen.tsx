import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  TextInput,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header, Button } from '../../components';
import { ProfileApi } from '../../api';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'ContactSupport'>;
};

const CATEGORIES = [
  'Booking Issue',
  'Payment & Refund',
  'Stylist Feedback',
  'Account Settings',
  'General Inquiry',
];

const ContactSupportScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Message Required',
        text2: 'Please describe how our support team can assist you.',
      });
      return;
    }

    try {
      setSending(true);
      const fullMessage = `[Category: ${selectedCategory}]\n${message.trim()}`;
      await ProfileApi.contactSupport(fullMessage);
      Toast.show({
        type: 'success',
        text1: 'Message Sent!',
        text2: 'Our customer care team will reply to your registered email shortly.',
      });
      setMessage('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Send',
        text2: error.message || 'Please check your connection and try again.',
      });
    } finally {
      setSending(false);
    }
  };

  const handleEmailDirect = () => {
    Linking.openURL('mailto:support@hairlines.app?subject=Customer%20App%20Support');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Contact Support"
        left={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => {
              if ((navigation as any).openDrawer) {
                (navigation as any).openDrawer();
              } else if ((navigation.getParent() as any)?.openDrawer) {
                (navigation.getParent() as any).openDrawer();
              } else {
                navigation.dispatch(DrawerActions.openDrawer());
              }
            }}
          >
            <Ionicons name="menu" size={26} color={Colors.TitleColor} />
          </TouchableOpacity>
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 30 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Support Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconCircle}>
              <Ionicons name="headset" size={32} color={Colors.ButtonPrimaryColor} />
            </View>
            <Text style={styles.heroTitle}>How can we help you today?</Text>
            <Text style={styles.heroSub}>
              Our dedicated support team is here to assist with any questions about your bookings, stylists, or account.
            </Text>
          </View>

          {/* Direct Channels */}
          <View style={styles.channelRow}>
            <TouchableOpacity style={styles.channelBtn} onPress={handleEmailDirect} activeOpacity={0.8}>
              <Ionicons name="mail-outline" size={20} color={Colors.ButtonPrimaryColor} />
              <Text style={styles.channelBtnTitle}>Email Support</Text>
              <Text style={styles.channelBtnSub}>support@hairlines.app</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.channelBtn}
              onPress={() => Linking.openURL('tel:18005550199')}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={20} color="#059669" />
              <Text style={styles.channelBtnTitle}>Phone Line</Text>
              <Text style={styles.channelBtnSub}>1-800-HAIRLINES</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formSectionTitle}>Topic or Category</Text>
            <View style={styles.categoriesWrap}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catChip, isSelected && styles.catChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.catChipText, isSelected && styles.catChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.formSectionTitle, { marginTop: 16 }]}>Your Message</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your question, issue, or feedback in detail..."
                placeholderTextColor="#94A3B8"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <View style={{ marginTop: 20 }}>
              <Button
                title="Send Message"
                onPress={handleSubmit}
                loading={sending}
                disabled={!message.trim()}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  channelBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  channelBtnTitle: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginTop: 6,
  },
  channelBtnSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formSectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 10,
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  catChipActive: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderColor: Colors.ButtonPrimaryColor,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: '#475569',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: FontWeights.bold,
  },
  textAreaContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
  },
  textArea: {
    fontSize: 13,
    color: Colors.TitleColor,
    minHeight: 100,
  },
});

export default ContactSupportScreen;
