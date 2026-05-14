import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

const getCardIcon = (brand: string): string => {
  switch (brand.toLowerCase()) {
    case 'visa': return '💳 Visa';
    case 'mastercard': return '💳 Mastercard';
    case 'amex': return '💳 Amex';
    case 'discover': return '💳 Discover';
    default: return '💳 Card';
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
      'Remove Card',
      'Are you sure you want to remove this payment method?',
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
      <View style={styles.cardInfo}>
        <Text style={styles.cardBrand}>{getCardIcon(item.brand)}</Text>
        <Text style={styles.cardNumber}>•••• {item.lastFour}</Text>
        <Text style={styles.cardExpiry}>Expires {item.expMonth}/{item.expYear}</Text>
      </View>
      <View style={styles.cardActions}>
        {!item.isDefaultCard && (
          <TouchableOpacity onPress={() => handleSetDefault(item.cardId)} style={styles.actionButton}>
            <Text style={styles.actionText}>Set Default</Text>
          </TouchableOpacity>
        )}
        {item.isDefaultCard && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
        <TouchableOpacity onPress={() => handleDeleteCard(item.cardId)} style={styles.deleteButton}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const cards = customer?.cards || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={cards}
        keyExtractor={(item) => item.cardId}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Your Cards</Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>💳</Text>
              <Text style={styles.emptyTitle}>No payment methods</Text>
              <Text style={styles.emptySubtitle}>
                Add a card to make booking services easier
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <VTButton
            title="Add New Card"
            onPress={() => {
              // Navigate to AddCreditCard screen or open Stripe PaymentSheet
              Alert.alert('Add Card', 'Stripe PaymentSheet integration goes here');
            }}
            disabled={cards.length >= 3}
            style={styles.addButton}
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
    backgroundColor: Colors.BGColor,
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
  listContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.base,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
  },
  cardItemDefault: {
    borderColor: Colors.ButtonPrimaryColor,
    backgroundColor: `${Colors.ButtonPrimaryColor}05`,
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  cardNumber: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginBottom: Spacing.xs,
  },
  cardExpiry: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  cardActions: {
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
  },
  defaultBadge: {
    backgroundColor: `${Colors.ButtonPrimaryColor}15`,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  defaultText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryColor,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  deleteIcon: {
    fontSize: FontSizes.md,
  },
  addButton: {
    marginTop: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyEmoji: {
    fontSize: FontSizes['3xl'],
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});

export default PaymentsScreen;
