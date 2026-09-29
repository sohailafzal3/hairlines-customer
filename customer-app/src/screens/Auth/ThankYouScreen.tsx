import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Button } from '../../components';
import { useAuthStore } from '../../store';
import { Storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ThankYou'>;
};

const ThankYouScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { account, login } = useAuthStore();

  const handleGoHome = async () => {
    if (account) {
      await login(account);
    } else {
      useAuthStore.getState().setLoggedIn(true);
      await Storage.setItem(STORAGE_KEYS.kIsUserLoggedIn, 'true');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 16) + 20 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.ScreenBG} />

      {/* Decorative circles */}
      <View style={styles.ambientCircleTopRight} />
      <View style={styles.ambientCircleBottomLeft} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.ButtonPrimaryColor} />
        </View>

        <Text style={styles.title}>Account Created!</Text>
        <Text style={styles.subtitle}>
          Welcome to Hairlines! Your profile is all set. You can now explore top stylists, book services, and manage your beauty appointments.
        </Text>

        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <Ionicons name="sparkles" size={18} color={Colors.gold} style={{ marginRight: 10 }} />
            <Text style={styles.featureText}>Verified Stylists & Barbers</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="time" size={18} color={Colors.ButtonPrimaryRight} style={{ marginRight: 10 }} />
            <Text style={styles.featureText}>Real-Time Booking & Tracking</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="card" size={18} color={Colors.successColor} style={{ marginRight: 10 }} />
            <Text style={styles.featureText}>Secure Cashless Payments</Text>
          </View>
        </View>

        <Button title="Get Started" onPress={handleGoHome} style={styles.button} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ScreenBG,
  },
  ambientCircleTopRight: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(34, 45, 99, 0.08)',
  },
  ambientCircleBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(43, 118, 200, 0.07)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.heavy,
    color: '#0F172A',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.sm,
  },
  featuresCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.BorderColor,
    marginBottom: Spacing['2xl'],
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: '#334155',
  },
  button: {
    width: '100%',
  },
});

export default ThankYouScreen;

