import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { ProfileApi } from '../../api';
import { useApi } from '../../hooks';
import { PromoCode } from '../../models';
import { useJobStore } from '../../store';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'PromoCodes'>;
};

const PromoCodesScreen: React.FC<Props> = ({ navigation }) => {
  const { setPromoCode } = useJobStore();
  const [refreshing, setRefreshing] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const {
    data: rawPromoCodes,
    loading,
    execute: fetchPromoCodes,
  } = useApi<any>(ProfileApi.fetchPromoCodes);

  const { loading: applying, execute: applyPromo } = useApi(ProfileApi.applyPromoCode);

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const getPromoList = (): PromoCode[] => {
    if (Array.isArray(rawPromoCodes)) return rawPromoCodes;
    if (rawPromoCodes && typeof rawPromoCodes === 'object') {
      const obj = rawPromoCodes as any;
      if (Array.isArray(obj.promoCodes)) return obj.promoCodes;
      if (Array.isArray(obj.data)) return obj.data;
    }
    return [];
  };

  const promoList = getPromoList();

  const loadPromoCodes = async () => {
    await fetchPromoCodes(0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromoCodes();
    setRefreshing(false);
  };

  const handleApplyCode = async (code?: string) => {
    const targetCode = (code || manualCode).trim();
    if (!targetCode) return;

    try {
      await applyPromo(targetCode);
      Toast.show({
        type: 'success',
        text1: 'Promo Code Applied!',
        text2: `Code "${targetCode.toUpperCase()}" added to your job checkout.`,
      });
      setManualCode('');

      const applied = promoList.find((p) => p.code?.toUpperCase() === targetCode.toUpperCase());
      if (applied) {
        setPromoCode(applied);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Promo Code Error',
        text2: error.message || 'This promo code is invalid or expired.',
      });
    }
  };

  const renderItem = ({ item }: { item: PromoCode }) => (
    <View style={[styles.couponCard, item.isExpired && styles.couponCardExpired]}>
      <View style={styles.couponLeft}>
        <View style={styles.badgeRow}>
          <Ionicons name="pricetag" size={16} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
          <Text style={styles.couponName}>{item.name || 'Special Discount'}</Text>
        </View>
        <Text style={styles.couponCode}>CODE: {item.code}</Text>
        <Text style={styles.couponDesc} numberOfLines={2}>
          {item.promoText || 'Save on your next grooming session.'}
        </Text>
        <Text style={styles.couponExpiry}>Valid until: {item.expiryDate || 'Limited Time'}</Text>
      </View>

      <View style={styles.couponRight}>
        <Text style={styles.discountValue}>
          {item.promoType === 'percentage' ? `${item.percentage}%` : `$${item.maxDiscount}`}
        </Text>
        <Text style={styles.discountLabel}>OFF</Text>

        {!item.isExpired ? (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => handleApplyCode(item.code)}
            activeOpacity={0.8}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>Expired</Text>
          </View>
        )}
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>Promo Codes</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Manual Input Container */}
      <View style={styles.inputCard}>
        <View style={styles.inputWrapper}>
          <Ionicons name="pricetag-outline" size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter promo code (e.g. SAVE20)"
            placeholderTextColor="#94A3B8"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity
          style={[styles.inputApplyButton, !manualCode.trim() && styles.inputApplyDisabled]}
          onPress={() => handleApplyCode()}
          disabled={!manualCode.trim() || applying}
          activeOpacity={0.8}
        >
          <Text style={styles.inputApplyText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {/* Coupon List */}
      <FlatList
        data={promoList}
        keyExtractor={(item) => item.id || item.code || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.ButtonPrimaryColor]}
            tintColor={Colors.ButtonPrimaryColor}
          />
        }
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>AVAILABLE PROMOS & OFFERS</Text>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="gift-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No active promo codes</Text>
              <Text style={styles.emptySubtitle}>
                Check back soon or enter a promo code above.
              </Text>
            </View>
          ) : null
        }
      />

      <VTLoading visible={loading || applying} />
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
  inputCard: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: Spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: '#0F172A',
  },
  inputApplyButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
  },
  inputApplyDisabled: {
    backgroundColor: '#CBD5E1',
  },
  inputApplyText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
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
  couponCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 5,
    borderLeftColor: Colors.ButtonPrimaryColor,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  couponCardExpired: {
    borderLeftColor: '#CBD5E1',
    opacity: 0.6,
  },
  couponLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  couponName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  couponCode: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  couponDesc: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6,
  },
  couponExpiry: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveRegular,
    color: '#94A3B8',
  },
  couponRight: {
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#F1F5F9',
    paddingLeft: Spacing.md,
    minWidth: 80,
  },
  discountValue: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  discountLabel: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#64748B',
    marginBottom: Spacing.xs,
  },
  applyButton: {
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  applyText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#FFFFFF',
  },
  expiredBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  expiredText: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveBold,
    color: '#94A3B8',
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

export default PromoCodesScreen;
