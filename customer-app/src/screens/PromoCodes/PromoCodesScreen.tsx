import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { FontSizes, FontWeights } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { Header } from '../../components';
import { ProfileApi } from '../../api';
import { PromoCode } from '../../models';
import { useJobStore } from '../../store';
import { VTLoading } from '../../components/common';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'PromoCodes'>;
};

const PromoCodesScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setPromoCode } = useJobStore();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const res: any = await ProfileApi.fetchPromoCodes(0);
      const list = res?.promoCodes || res?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setPromoCodes(list);
      }
    } catch (e) {
      console.log('Promo code error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromoCodes();
    setRefreshing(false);
  };

  const handleApplyCode = async (codeToApply?: string) => {
    const code = (codeToApply || manualCode).trim();
    if (!code) return;

    try {
      setApplying(true);
      const res: any = await ProfileApi.applyPromoCode(code);
      Toast.show({
        type: 'success',
        text1: 'Promo Code Applied!',
        text2: `Code "${code}" discount is ready for your next booking.`,
      });

      const matchedPromo = promoCodes.find((p) => p.code?.toUpperCase() === code.toUpperCase());
      if (matchedPromo) {
        setPromoCode(matchedPromo);
      } else {
        setPromoCode({
          id: res?.id || 1,
          code: code,
          title: res?.title || code,
          discountType: res?.discountType || 1,
          discountPercentage: res?.discountPercentage || 10,
          amount: res?.amount || 10,
        });
      }
      setManualCode('');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Promo Code',
        text2: error.message || 'This promo code is either expired or invalid.',
      });
    } finally {
      setApplying(false);
    }
  };

  const renderItem = ({ item }: { item: PromoCode }) => {
    const isExpired = item.isExpired;
    const discountText =
      item.promoType === 'percentage' || item.discountType === 1
        ? `${item.percentage || item.discountPercentage || 10}% OFF`
        : `$${item.amount || item.maxDiscount || 10} OFF`;

    return (
      <View style={[styles.promoCard, isExpired && styles.promoCardExpired]}>
        <View style={styles.promoLeft}>
          <View style={styles.discountBadge}>
            <Ionicons name="pricetag" size={13} color={Colors.ButtonPrimaryColor} style={{ marginRight: 4 }} />
            <Text style={styles.discountBadgeText}>{discountText}</Text>
          </View>
          <Text style={styles.promoName}>{item.name || item.title || item.code}</Text>
          <Text style={styles.promoCodeText}>Code: {item.code}</Text>
          {item.promoText ? (
            <Text style={styles.promoDesc} numberOfLines={2}>
              {item.promoText}
            </Text>
          ) : null}
          {item.expiryDate && (
            <Text style={styles.promoExpiry}>Valid until: {item.expiryDate}</Text>
          )}
        </View>

        <View style={styles.promoRight}>
          {!isExpired ? (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => handleApplyCode(item.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredBadgeText}>Expired</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Promo Codes"
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

      {/* Manual Input Container */}
      <View style={styles.manualContainer}>
        <View style={styles.inputWrapper}>
          <Ionicons name="pricetag-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.manualInput}
            placeholder="Enter promo code (e.g. SAVE20)"
            placeholderTextColor="#94A3B8"
            value={manualCode}
            onChangeText={setManualCode}
            autoCapitalize="characters"
          />
        </View>
        <TouchableOpacity
          style={[styles.manualApplyBtn, !manualCode.trim() && styles.manualApplyBtnDisabled]}
          onPress={() => handleApplyCode()}
          disabled={!manualCode.trim() || applying}
        >
          {applying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.manualApplyBtnText}>Apply</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={promoCodes}
        keyExtractor={(item, index) => String(item.id || item.code || index)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 30 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.ButtonPrimaryColor]} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="pricetags-outline" size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No Promo Codes Available</Text>
              <Text style={styles.emptySubtitle}>
                You can enter a promotional code above if you have received a coupon voucher.
              </Text>
            </View>
          ) : null
        }
      />

      <VTLoading visible={loading && !refreshing} />
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
  manualContainer: {
    flexDirection: 'row',
    padding: Spacing.base,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  manualInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.TitleColor,
    fontWeight: FontWeights.semibold,
    paddingVertical: 10,
  },
  manualApplyBtn: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualApplyBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  manualApplyBtnText: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: Colors.ButtonPrimaryColor,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  promoCardExpired: {
    borderLeftColor: '#94A3B8',
    opacity: 0.65,
  },
  promoLeft: {
    flex: 1,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  promoName: {
    fontSize: 15,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  promoCodeText: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: '#64748B',
    marginTop: 2,
  },
  promoDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  promoExpiry: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
  },
  promoRight: {
    marginLeft: 12,
  },
  applyBtn: {
    backgroundColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: '#FFFFFF',
  },
  expiredBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  expiredBadgeText: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: '#94A3B8',
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
});

export default PromoCodesScreen;
