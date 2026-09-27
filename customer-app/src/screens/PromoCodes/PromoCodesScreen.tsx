import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { VTButton, VTLoading } from '../../components/common';
import { ProfileApi } from '../../api';
import { useApi } from '../../hooks';
import { PromoCode } from '../../models';
import { useJobStore } from '../../store';
import Toast from 'react-native-toast-message';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'PromoCodes'>;
};

const PromoCodesScreen: React.FC<Props> = ({ navigation }) => {
  const { setPromoCode } = useJobStore();
  const [refreshing, setRefreshing] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const {
    data: promoCodes,
    loading,
    execute: fetchPromoCodes,
  } = useApi<PromoCode[]>(ProfileApi.fetchPromoCodes);

  const { loading: applying, execute: applyPromo } = useApi(ProfileApi.applyPromoCode);

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    await fetchPromoCodes(0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromoCodes();
    setRefreshing(false);
  };

  const handleApplyCode = async (code?: string) => {
    const promoCode = code || manualCode;
    if (!promoCode.trim()) return;

    try {
      const result = await applyPromo(promoCode.trim());
      Toast.show({
        type: 'success',
        text1: 'Promo Applied',
        text2: 'Your promo code has been applied successfully',
      });
      setManualCode('');
      // Find the applied promo in the list or create a temp one
      const applied = promoCodes?.find((p) => p.code === promoCode.trim());
      if (applied) {
        setPromoCode(applied);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Code',
        text2: error.message || 'This promo code is not valid',
      });
    }
  };

  const renderItem = ({ item }: { item: PromoCode }) => (
    <View style={[styles.promoCard, item.isExpired && styles.promoCardExpired]}>
      <View style={styles.promoLeft}>
        <Text style={styles.promoName}>{item.name}</Text>
        <Text style={styles.promoCode}>Code: {item.code}</Text>
        <Text style={styles.promoDesc} numberOfLines={2}>
          {item.promoText}
        </Text>
        <Text style={styles.promoExpiry}>
          Expires: {item.expiryDate}
        </Text>
      </View>
      <View style={styles.promoRight}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>
            {item.promoType === 'percentage' ? `${item.percentage}%` : `$${item.maxDiscount}`}
          </Text>
          <Text style={styles.discountLabel}>OFF</Text>
        </View>
        {!item.isExpired && item.canUse && (
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => handleApplyCode(item.code)}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        )}
        {item.isExpired && (
          <View style={styles.expiredBadge}>
            <Text style={styles.expiredText}>Expired</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).openDrawer()}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promo Codes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Manual Entry */}
      <View style={styles.manualContainer}>
        <TextInput
          style={styles.manualInput}
          placeholder="Enter promo code"
          placeholderTextColor={Colors.PlaceholderInactive}
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity
          style={[styles.manualApply, !manualCode.trim() && styles.manualApplyDisabled]}
          onPress={() => handleApplyCode()}
          disabled={!manualCode.trim() || applying}
        >
          <Text style={styles.manualApplyText}>Apply</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={promoCodes || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏷️</Text>
              <Text style={styles.emptyTitle}>No promo codes available</Text>
              <Text style={styles.emptySubtitle}>
                Check back later for special offers
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
  manualContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.CardColor,
  },
  manualInput: {
    flex: 1,
    backgroundColor: Colors.TextFieldColor,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.base,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.TitleColor,
    marginRight: Spacing.sm,
  },
  manualApply: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  manualApplyDisabled: {
    backgroundColor: Colors.disabledGray,
  },
  manualApplyText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.BGColor,
  },
  listContent: {
    padding: Spacing.lg,
  },
  promoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.BGColor,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.CardColor,
    borderLeftWidth: 4,
    borderLeftColor: Colors.ButtonPrimaryColor,
  },
  promoCardExpired: {
    borderLeftColor: Colors.disabledGray,
    opacity: 0.7,
  },
  promoLeft: {
    flex: 1,
  },
  promoName: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.TitleColor,
    marginBottom: Spacing.xs,
  },
  promoCode: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryRight,
    marginBottom: Spacing.xs,
  },
  promoDesc: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextDark,
    marginBottom: Spacing.xs,
  },
  promoExpiry: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: Colors.DescriptionTextLight,
  },
  promoRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.md,
  },
  discountBadge: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  discountText: {
    fontSize: FontSizes.xl,
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  discountLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.DescriptionTextLight,
  },
  applyButton: {
    backgroundColor: `${Colors.ButtonPrimaryColor}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  applyText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.ButtonPrimaryColor,
  },
  expiredBadge: {
    backgroundColor: Colors.disabledGray,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  expiredText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveMedium,
    color: Colors.disabledText,
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

export default PromoCodesScreen;
