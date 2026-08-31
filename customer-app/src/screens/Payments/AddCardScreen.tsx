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
  Switch,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTTextField, VTLoading } from '../../components/common';
import { PaymentsApi } from '../../api';
import { useApi } from '../../hooks';
import { useAuthStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'AddCard'>;
};

const detectCardBrand = (number: string): string => {
  const clean = number.replace(/\D/g, '');
  if (clean.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'MASTERCARD';
  if (/^3[47]/.test(clean)) return 'AMEX';
  if (clean.startsWith('6')) return 'DISCOVER';
  return 'CARD';
};

const AddCardScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [cardHolder, setCardHolder] = useState(`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'CARDHOLDER NAME');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  const { loading, execute: addCard } = useApi(PaymentsApi.addCard);

  const brand = detectCardBrand(cardNumber);

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
    setCardNumber(formatted);
  };

  // Format Expiry Date (MM/YY)
  const handleExpiryChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    let formatted = clean;
    if (clean.length >= 2) {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setExpiryDate(formatted);
  };

  const handleSaveCard = async () => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.length < 15) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Card Number',
        text2: 'Please enter a valid 15 or 16-digit credit/debit card number.',
      });
      return;
    }

    if (expiryDate.length < 5) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Expiry Date',
        text2: 'Please enter a valid expiry date (MM/YY).',
      });
      return;
    }

    if (cvc.length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Security Code',
        text2: 'Please enter a 3 or 4-digit CVC/CVV.',
      });
      return;
    }

    try {
      const mockPaymentMethodId = `pm_${Date.now()}`;
      await addCard(mockPaymentMethodId, false);
      Toast.show({
        type: 'success',
        text1: 'Card Saved!',
        text2: `${brand} ending in ${cleanNumber.slice(-4)} added successfully.`,
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Add Card',
        text2: error.message || 'Please check your card details and try again.',
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Credit / Debit Card</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Virtual Credit Card Interactive Preview */}
          <View style={styles.virtualCard}>
            <View style={styles.cardTopRow}>
              <Ionicons name="hardware-chip" size={32} color="#F59E0B" />
              <View style={styles.brandBadge}>
                <Text style={styles.brandText}>{brand}</Text>
              </View>
            </View>

            <Text style={styles.virtualCardNumber}>
              {cardNumber || '•••• •••• •••• ••••'}
            </Text>

            <View style={styles.cardBottomRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.virtualCardLabel}>CARD HOLDER</Text>
                <Text style={styles.virtualCardHolder} numberOfLines={1}>
                  {cardHolder.toUpperCase() || 'YOUR NAME'}
                </Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.virtualCardLabel}>EXPIRES</Text>
                <Text style={styles.virtualCardExpiry}>{expiryDate || 'MM/YY'}</Text>
              </View>
            </View>
          </View>

          {/* Form Fields */}
          <Text style={styles.sectionLabel}>ENTER CARD DETAILS</Text>

          <VTTextField
            label="Cardholder Name"
            placeholder="Name as it appears on card"
            value={cardHolder}
            onChangeText={setCardHolder}
            autoCapitalize="words"
            leftIcon={<Ionicons name="person-outline" size={18} color="#64748B" />}
          />

          <VTTextField
            label="Card Number"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChangeText={handleCardNumberChange}
            keyboardType="number-pad"
            maxLength={19}
            leftIcon={<Ionicons name="card-outline" size={18} color="#64748B" />}
          />

          <View style={styles.rowFields}>
            <VTTextField
              label="Expiry Date (MM/YY)"
              placeholder="MM/YY"
              value={expiryDate}
              onChangeText={handleExpiryChange}
              keyboardType="number-pad"
              maxLength={5}
              style={styles.flexHalf}
              leftIcon={<Ionicons name="calendar-outline" size={18} color="#64748B" />}
            />

            <VTTextField
              label="Security Code (CVC)"
              placeholder="123"
              value={cvc}
              onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              style={styles.flexHalf}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#64748B" />}
            />
          </View>

          {/* Default Card Toggle */}
          <View style={styles.defaultCardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.defaultTitle}>Set as Default Payment Card</Text>
              <Text style={styles.defaultSub}>Use automatically for future bookings</Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#E2E8F0', true: Colors.ButtonPrimaryColor }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={16} color="#22C55E" style={{ marginRight: 6 }} />
            <Text style={styles.securityText}>
              Encrypted with 256-bit SSL technology. Powered by Stripe.
            </Text>
          </View>

          <VTButton
            title="Save Card"
            onPress={handleSaveCard}
            loading={loading}
            style={styles.saveButton}
            textStyle={styles.saveButtonText}
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
  backButton: {
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
  virtualCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    height: 200,
    justifyContent: 'space-between',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  brandText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  virtualCardNumber: {
    fontSize: FontSizes.xl + 2,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  virtualCardLabel: {
    fontSize: 9,
    fontFamily: Fonts.uberMoveBold,
    color: '#94A3B8',
    letterSpacing: 1,
  },
  virtualCardHolder: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  virtualCardExpiry: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flexHalf: {
    flex: 1,
  },
  defaultCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  defaultTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  defaultSub: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  securityText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  saveButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
});

export default AddCardScreen;
