import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
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
import { Header, Button, Input } from '../../components';
import { PaymentsApi } from '../../api';
import { CreditCards } from '../../models';
import { VTLoading } from '../../components/common';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'Payments'>;
};

const PaymentsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<CreditCards[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Card Modal State
  const [isAddCardVisible, setIsAddCardVisible] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const res: any = await PaymentsApi.fetchCustomer();
      const list = res?.customer?.cards || res?.cards || [];
      if (Array.isArray(list)) {
        setCards(list);
      }
    } catch (e: any) {
      console.log('Fetch cards error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      await PaymentsApi.setDefaultCard(cardId);
      Toast.show({ type: 'success', text1: 'Default Card Updated' });
      await loadCards();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set default card');
    }
  };

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'Remove Card',
      'Are you sure you want to remove this payment card?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await PaymentsApi.deleteCard(cardId);
              Toast.show({ type: 'success', text1: 'Card Removed' });
              await loadCards();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove card');
            }
          },
        },
      ]
    );
  };

  const handleAddCardSubmit = async () => {
    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim()) {
      Alert.alert('Required Fields', 'Please fill in all card details');
      return;
    }

    try {
      setAddingCard(true);
      const [expMonth, expYear] = expiry.split('/').map((s) => s.trim());
      await PaymentsApi.addCard({
        number: cardNumber.replace(/\s+/g, ''),
        expMonth: parseInt(expMonth, 10),
        expYear: parseInt(expYear.length === 2 ? `20${expYear}` : expYear, 10),
        cvc: cvc.trim(),
        name: cardHolder.trim() || 'Cardholder',
      });

      setIsAddCardVisible(false);
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setCardHolder('');
      Toast.show({ type: 'success', text1: 'Card Added Successfully!' });
      await loadCards();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not add card');
    } finally {
      setAddingCard(false);
    }
  };

  const formatCardNumberInput = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    setCardNumber(parts.join(' '));
  };

  const formatExpiryInput = (text: string) => {
    const cleaned = text.replace(/\D/g, '').substring(0, 4);
    if (cleaned.length >= 2) {
      setExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const renderCardItem = ({ item }: { item: CreditCards }) => {
    const isDefault = item.isDefault || item.isDefaultCard;

    return (
      <View style={[styles.cardItem, isDefault && styles.cardItemDefault]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardBrandBadge}>
            <Ionicons name="card" size={20} color={Colors.ButtonPrimaryColor} />
            <Text style={styles.cardBrandText}>{item.brand || 'Card'}</Text>
          </View>
          {isDefault && (
            <View style={styles.defaultPill}>
              <Ionicons name="checkmark-circle" size={12} color="#059669" style={{ marginRight: 3 }} />
              <Text style={styles.defaultPillText}>Default</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardNumberText}>•••• •••• •••• {item.last4 || item.lastFour}</Text>

        <View style={styles.cardFooterRow}>
          <Text style={styles.cardExpiryText}>
            Expires {item.expMonth || '12'}/{item.expYear ? String(item.expYear).slice(-2) : '28'}
          </Text>

          <View style={styles.cardActionsRow}>
            {!isDefault && (
              <TouchableOpacity
                style={styles.setDefaultBtn}
                onPress={() => handleSetDefault(item.cardId || (item as any).id)}
              >
                <Text style={styles.setDefaultBtnText}>Set Default</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteCard(item.cardId || (item as any).id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Payment Methods"
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
        right={
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setIsAddCardVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="add" size={24} color={Colors.ButtonPrimaryColor} />
          </TouchableOpacity>
        }
      />

      <FlatList
        data={cards}
        keyExtractor={(item, index) => item.cardId || `card_${index}`}
        renderItem={renderCardItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 80 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="card-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Saved Cards</Text>
              <Text style={styles.emptySubtitle}>
                Add a debit or credit card to easily book and pay for grooming appointments.
              </Text>
              <TouchableOpacity
                style={styles.addCardEmptyBtn}
                onPress={() => setIsAddCardVisible(true)}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.addCardEmptyBtnText}>Add Payment Method</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Bottom Button if cards exist */}
      {cards.length > 0 && (
        <View style={[styles.footerBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Button
            title="+ Add New Payment Card"
            onPress={() => setIsAddCardVisible(true)}
          />
        </View>
      )}

      {/* Modal: Add New Card */}
      <Modal
        visible={isAddCardVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddCardVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add Payment Card</Text>
              <TouchableOpacity onPress={() => setIsAddCardVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Cardholder Name"
                placeholder="e.g. John Doe"
                value={cardHolder}
                onChangeText={setCardHolder}
                leftIcon="person-outline"
              />

              <Input
                label="Card Number"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChangeText={formatCardNumberInput}
                keyboardType="numeric"
                maxLength={19}
                leftIcon="card-outline"
              />

              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={expiry}
                    onChangeText={formatExpiryInput}
                    keyboardType="numeric"
                    maxLength={5}
                    leftIcon="calendar-outline"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="CVC / CVV"
                    placeholder="123"
                    value={cvc}
                    onChangeText={(t) => setCvc(t.substring(0, 4))}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    leftIcon="lock-closed-outline"
                  />
                </View>
              </View>

              <View style={{ marginTop: 20 }}>
                <Button
                  title="Save Card"
                  onPress={handleAddCardSubmit}
                  loading={addingCard}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <VTLoading visible={loading} />
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
  headerAddBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardItemDefault: {
    borderColor: Colors.ButtonPrimaryColor,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBrandText: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  defaultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  defaultPillText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: '#059669',
  },
  cardNumberText: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    letterSpacing: 2,
    marginBottom: 14,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  cardExpiryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: FontWeights.medium,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  setDefaultBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
  },
  setDefaultBtnText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  deleteBtn: {
    padding: 4,
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: Spacing.base,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  addCardEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 20,
  },
  addCardEmptyBtnText: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.TitleColor,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default PaymentsScreen;
