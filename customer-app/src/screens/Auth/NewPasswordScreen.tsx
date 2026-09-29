import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button, Input, LoadingOverlay } from '../../components';
import { AuthApi } from '../../api';
import Toast from 'react-native-toast-message';

interface Props {
  navigation: any;
  route?: any;
}

const NewPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isFromProfile = route?.params?.isFromProfile ?? false;
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetPassword = async () => {
    if (isFromProfile && !oldPassword.trim()) {
      setErrorMsg('Please enter your current password');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      if (isFromProfile) {
        await AuthApi.changePassword(oldPassword, password);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Password updated successfully!',
        });
        navigation.goBack();
      } else {
        Toast.show({
          type: 'success',
          text1: 'Password Reset',
          text2: 'Your password has been updated. Please sign in.',
        });
        navigation.navigate('SignIn', { isSignUp: false });
      }
    } catch (error: any) {
      const msg = error?.message || 'Failed to update password';
      setErrorMsg(msg);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.ScreenBG} />
      <LoadingOverlay visible={loading} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.TitleColor} />
          </TouchableOpacity>

          <Text style={styles.title}>
            {isFromProfile ? 'Change Password' : 'Set New Password'}
          </Text>
          <Text style={styles.subtitle}>
            {isFromProfile
              ? 'Enter your current password and choose a secure new password'
              : 'Create a strong, new password with at least 8 characters'}
          </Text>

          {!!errorMsg && (
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={18}
                color={Colors.errorViewColor}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          )}

          {isFromProfile && (
            <Input
              label="Current Password"
              placeholder="Enter current password"
              value={oldPassword}
              onChangeText={setOldPassword}
              secureTextEntry
            />
          )}

          <Input
            label="New Password"
            placeholder="Enter new password (min 8 chars)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Input
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <Button
            title={isFromProfile ? 'Update Password' : 'Reset Password'}
            onPress={handleResetPassword}
            loading={loading}
            disabled={!password || !confirmPassword || (isFromProfile && !oldPassword)}
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: Spacing.base,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    color: '#0F172A',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: '#64748B',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorBannerText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.errorViewColor,
  },
  button: {
    marginTop: Spacing.xl,
  },
});

export default NewPasswordScreen;

