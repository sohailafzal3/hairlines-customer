import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { PaymentsApi } from '../../api';
import { useApi } from '../../hooks';
import { StripeCustomer, CreditCards } from '../../models';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'Payments'>;
};

const getCardIcon = (brand: string) => {
  switch (brand?.toLowerCase()) {
    case 'visa':
      return 'card';
    case 'mastercard':
      return 'card-outline';
    case 'amex':
      return 'card-sharp';
    default:
      return 'card-outline';
  }
};

const PaymentsScreen: React.FC<Props> = ({ navigation }) => {
  const [customer, setCustomer] = useState<StripeCustomer | null>(null);

  const {
    data: stripeCustomer,
    loading,
    execute: fetchCustomer,
  } = useApi<StripeCustomer>(PaymentsApi.fetchCustomer);

  const { execute: setupCustomer } = useApi(PaymentsApi.setupCustomer);
  const { execute: setDefaultCard, loading: settingDefault } = useApi(PaymentsApi.setDefaultCard);
  const { execute: deleteCard, loading: deleting } = useApi(PaymentsApi.deleteCard);

  useEffect(() => {
    loadCustomer();
  }, []);

  useEffect(() => {
    if (stripeCustomer) {
      setCustomer(stripeCustomer);
    }
  }, [stripeCustomer]);

  const loadCustomer = async () => {
    const result = await fetchCustomer();
    if (!result) {
      await setupCustomer();
      await fetchCustomer();
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      await setDefaultCard(cardId);
      await loadCustomer();
    } catch (error: any) {
      console.error('Set default error:', error.message);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(cardId);
              await loadCustomer();
            } catch (error: any) {
              console.error('Delete card error:', error.message);
            }
          },
        },
      ]
    );
  };

  const renderCard = ({ item }: { item: CreditCards }) => (
    <View style={[styles.cardItem, item.isDefaultCard && styles.cardItemDefault]}>
      <View style={styles.cardIconCircle}>
        <Ionicons name={getCardIcon(item.brand) as any} size={22} color={Colors.ButtonPrimaryColor} />
      </View>

      <View style={styles.cardInfo}>
        <Text style={styles.cardBrand}>{item.brand?.toUpperCase() || 'CARD'} •••• {item.lastFour}</Text>
        <Text style={styles.cardExpiry}>Expires {item.expMonth}/{item.expYear}</Text>
      </View>

      <View style={styles.cardActions}>
        {item.isDefaultCard ? (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleSetDefault(item.cardId)} style={styles.actionButton}>
            <Text style={styles.actionText}>Set Default</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={() => handleDeleteCard(item.cardId)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const cards = customer?.cards || [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).openDrawer?.()}
          style={styles.menuButton}
          activeOpacity={0.8}
        >
          <Ionicons name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 44 }} />
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.cardId}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>SAVED CREDIT / DEBIT CARDS</Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="card-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No payment methods saved</Text>
              <Text style={styles.emptySubtitle}>
                Add a card for fast, secure one-tap booking checkout.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <VTButton
            title="+ Add New Card"
            onPress={() => navigation.navigate('AddCard')}
            disabled={cards.length >= 5}
            style={styles.addButton}
            textStyle={styles.addButtonText}
          />
        }
      />

      <VTLoading visible={loading || settingDefault || deleting} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#334155',
    marginBottom: Spacing.md,
    letterSpacing: 0.5,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardItemDefault: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: '#EEF4FF',
  },
  cardIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  cardExpiry: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  defaultBadge: {
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  defaultText: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 6,
  },
  addButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 54,
    marginTop: Spacing.lg,
    shadowColor: Colors.ButtonPrimaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
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
  emptySubtitle: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: Spacing.xl,
  },
});

export default PaymentsScreen;
