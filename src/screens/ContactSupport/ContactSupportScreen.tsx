import React, { useState } from 'react';
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
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField, VTLoading } from '../../components/common';
import { ProfileApi } from '../../api';
import { useApi } from '../../hooks';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'ContactSupport'>;
};

const ContactSupportScreen: React.FC<Props> = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const { loading, execute: sendMessage } = useApi(ProfileApi.contactSupport);

  const handleCallPhone = async () => {
    const phoneNumber = 'tel:+18005550199';
    try {
      const supported = await Linking.canOpenURL(phoneNumber);
      if (supported) {
        await Linking.openURL(phoneNumber);
      } else {
        Toast.show({
          type: 'info',
          text1: 'Phone Dialer',
          text2: 'Call +1 (800) 555-0199',
        });
      }
    } catch (e) {
      // Fallback
    }
  };

  const handleOpenEmail = async () => {
    Linking.openURL('mailto:support@hairlines.app');
  };

  const handleOpenSocial = (url: string) => {
    Linking.openURL(url).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Could not open link',
      });
    });
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage(message.trim());
      Toast.show({
        type: 'success',
        text1: 'Message Sent!',
        text2: 'Our customer support team will reply shortly.',
      });
      setMessage('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Send',
        text2: error.message || 'Please try again later.',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => (navigation as any).openDrawer?.()}
            style={styles.menuButton}
            activeOpacity={0.8}
          >
            <Ionicons name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Support Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.supportIconCircle}>
              <Ionicons name="headset" size={28} color={Colors.ButtonPrimaryColor} />
            </View>
            <Text style={styles.infoTitle}>We're Here to Help</Text>
            <Text style={styles.infoDesc}>
              Have questions regarding your booking, payment, or account? Reach out to our dedicated support team.
            </Text>

            {/* Support Hours Banner */}
            <View style={styles.hoursBanner}>
              <Ionicons name="time-outline" size={16} color={Colors.ButtonPrimaryColor} style={{ marginRight: 6 }} />
              <Text style={styles.hoursText}>
                Support Hours: <Text style={styles.hoursBold}>6:00 AM to 12:00 AM</Text> (Daily)
              </Text>
            </View>
          </View>

          {/* Quick Contact Chips */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactChip}
              onPress={handleOpenEmail}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-outline" size={18} color={Colors.ButtonPrimaryColor} style={{ marginRight: 6 }} />
              <Text style={styles.contactChipText}>Email Us</Text>
            </TouchableOpacity>

            {/* Phone Number Chip (Opens Phone Dialer) */}
            <TouchableOpacity
              style={styles.contactChipPrimary}
              onPress={handleCallPhone}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.contactChipTextPrimary}>1-800-HAIRLINES</Text>
            </TouchableOpacity>
          </View>

          {/* Follow Us on Social Media Section */}
          <Text style={styles.sectionLabel}>FOLLOW US ON SOCIAL MEDIA</Text>

          <View style={styles.socialRow}>
            {/* Facebook */}
            <TouchableOpacity
              style={styles.socialCard}
              onPress={() => handleOpenSocial('https://facebook.com/hairlinesapp')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-facebook" size={22} color="#1877F2" />
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>

            {/* Instagram */}
            <TouchableOpacity
              style={styles.socialCard}
              onPress={() => handleOpenSocial('https://instagram.com/hairlinesapp')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-instagram" size={22} color="#E4405F" />
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>

            {/* Twitter / X */}
            <TouchableOpacity
              style={styles.socialCard}
              onPress={() => handleOpenSocial('https://x.com/hairlinesapp')}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-twitter" size={22} color="#0F172A" />
              <Text style={styles.socialText}>Twitter / X</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Text style={styles.sectionLabel}>SEND US A DIRECT MESSAGE</Text>

          <VTTextField
            label="Your Message"
            placeholder="Type your inquiry or issue details here..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            style={styles.messageInput}
            inputStyle={styles.messageInputText}
          />

          <VTButton
            title="Submit Support Request"
            onPress={handleSubmit}
            loading={loading}
            disabled={!message.trim()}
            style={styles.sendButton}
            textStyle={styles.sendButtonText}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <VTLoading visible={loading} />
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  supportIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginBottom: Spacing.xs,
  },
  infoDesc: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  hoursBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF4FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(34, 45, 99, 0.15)',
  },
  hoursText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#334155',
  },
  hoursBold: {
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  contactRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  contactChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactChipPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
  },
  contactChipText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
  },
  contactChipTextPrimary: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  socialCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialText: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginTop: 4,
  },
  messageInput: {
    marginBottom: Spacing.lg,
  },
  messageInputText: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default ContactSupportScreen;
