import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField, VTLoading } from '../../components/common';
import { ProfileApi } from '../../api';
import { useApi } from '../../hooks';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'ContactSupport'>;
};

const ContactSupportScreen: React.FC<Props> = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const { loading, execute: sendMessage } = useApi(ProfileApi.contactSupport);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    try {
      await sendMessage(message.trim());
      Toast.show({
        type: 'success',
        text1: 'Message Sent',
        text2: 'We will get back to you soon.',
      });
      setMessage('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to send',
        text2: error.message || 'Please try again later',
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Contact Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoEmoji}>✉️</Text>
            <Text style={styles.infoTitle}>We're here to help</Text>
            <Text style={styles.infoDesc}>
              Have a question or need assistance? Send us a message and our support team will respond as soon as possible.
            </Text>
          </View>

          {/* Message Form */}
          <VTTextField
            label="Message"
            placeholder="Describe your issue or question..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            style={styles.messageInput}
            inputStyle={styles.messageInputText}
          />

          <VTButton
            title="Send Message"
            onPress={handleSubmit}
            loading={loading}
            disabled={!message.trim()}
            style={styles.sendButton}
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
    backgroundColor: Colors.BGColor,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  menuIcon: {
    fontSize: FontSizes.xl,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  infoEmoji: {
    fontSize: FontSizes['3xl'],
    marginBottom: Spacing.lg,
  },
  infoTitle: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.TitleColor,
    marginBottom: Spacing.sm,
  },
  infoDesc: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  messageInput: {
    marginBottom: Spacing.lg,
  },
  messageInputText: {
    height: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    marginTop: Spacing.lg,
  },
});

export default ContactSupportScreen;
