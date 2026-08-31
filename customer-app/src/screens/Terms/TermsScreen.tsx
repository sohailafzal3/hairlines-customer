import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AppDrawerParamList } from '../../navigation/AppNavigator';
import { Colors } from '../../theme/colors';
import { Fonts, FontSizes } from '../../theme/fonts';
import { Spacing, BorderRadius } from '../../theme/spacing';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'Terms'>;
};

type ActiveTab = 'terms' | 'privacy';

const TermsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('terms');

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
        <Text style={styles.headerTitle}>Terms & Privacy</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabSegment, activeTab === 'terms' && styles.tabSegmentActive]}
          onPress={() => setActiveTab('terms')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text-outline"
            size={16}
            color={activeTab === 'terms' ? Colors.ButtonPrimaryColor : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
            Terms & Conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabSegment, activeTab === 'privacy' && styles.tabSegmentActive]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={activeTab === 'privacy' ? Colors.ButtonPrimaryColor : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Document Content Scroll */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'terms' ? (
          <View style={styles.docCard}>
            <View style={styles.docHeader}>
              <Text style={styles.docTitle}>Terms and Conditions</Text>
              <Text style={styles.docLastUpdated}>Last updated: July 2026</Text>
            </View>

            <View style={styles.divider} />

            {/* Section 1 */}
            <Text style={styles.sectionTitle}>1. Agreement & Acceptance</Text>
            <Text style={styles.paragraph}>
              Welcome to Hairlines. By accessing or using our mobile application and platform services, you agree to be bound by these Terms and Conditions. If you do not agree to all terms, please refrain from using our service.
            </Text>

            {/* Section 2 */}
            <Text style={styles.sectionTitle}>2. Service Bookings & Cancellations</Text>
            <Text style={styles.paragraph}>
              Customers can request on-demand or scheduled grooming and haircut services. Cancellations made within 30 minutes of a scheduled appointment time may incur a standard cancellation fee to compensate the assigned service provider for allocated time.
            </Text>

            {/* Section 3 */}
            <Text style={styles.sectionTitle}>3. Payments & Pricing</Text>
            <Text style={styles.paragraph}>
              All service prices are clearly displayed before booking confirmation. Payments are processed securely via Stripe. By placing a booking, you authorize Hairlines to charge your selected credit card, debit card, or wallet balance for the total fee.
            </Text>

            {/* Section 4 */}
            <Text style={styles.sectionTitle}>4. User Code of Conduct</Text>
            <Text style={styles.paragraph}>
              Hairlines is committed to safety and mutual respect for both customers and service providers. Any form of harassment, discrimination, or abusive behavior toward service providers will result in immediate account termination.
            </Text>

            {/* Section 5 */}
            <Text style={styles.sectionTitle}>5. Account Security</Text>
            <Text style={styles.paragraph}>
              You are responsible for maintaining the confidentiality of your login account credentials and for all activities conducted under your account. Notify support immediately if you suspect unauthorized account access.
            </Text>

            {/* Section 6 */}
            <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
            <Text style={styles.paragraph}>
              Hairlines acts as an intermediary connecting clients with independent grooming professionals. Hairlines is not liable for indirect damages or disputes arising between clients and service providers beyond platform resolution policies.
            </Text>
          </View>
        ) : (
          <View style={styles.docCard}>
            <View style={styles.docHeader}>
              <Text style={styles.docTitle}>Privacy Policy</Text>
              <Text style={styles.docLastUpdated}>Last updated: July 2026</Text>
            </View>

            <View style={styles.divider} />

            {/* Section 1 */}
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect information you provide directly, such as your full name, phone number, email address, profile picture, and delivery address. GPS location data is collected only to match you with nearby service providers and track service arrivals.
            </Text>

            {/* Section 2 */}
            <Text style={styles.sectionTitle}>2. How We Use Your Data</Text>
            <Text style={styles.paragraph}>
              Your information is used strictly to fulfill service bookings, process transactions, communicate booking updates via push notifications, prevent fraudulent activity, and continuously improve platform performance.
            </Text>

            {/* Section 3 */}
            <Text style={styles.sectionTitle}>3. Data Protection & Security</Text>
            <Text style={styles.paragraph}>
              We implement industry-standard 256-bit SSL encryption and strict data access protocols to protect your personal data. Payment details are handled securely by Stripe and are never stored directly on our servers.
            </Text>

            {/* Section 4 */}
            <Text style={styles.sectionTitle}>4. Data Sharing & Third Parties</Text>
            <Text style={styles.paragraph}>
              We do not sell your personal data to third parties. We share limited necessary information (such as your address and service notes) with your assigned service provider solely to complete your booked service.
            </Text>

            {/* Section 5 */}
            <Text style={styles.sectionTitle}>5. Your Rights & Data Controls</Text>
            <Text style={styles.paragraph}>
              You have the right to view, update, or request complete deletion of your personal data at any time through your Profile settings or by contacting customer support.
            </Text>
          </View>
        )}

        <View style={styles.appVersionFooter}>
          <Text style={styles.versionText}>Hairlines Customer App v1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 Hairlines Inc. All rights reserved.</Text>
        </View>
      </ScrollView>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: Spacing.sm,
  },
  tabSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  tabSegmentActive: {
    backgroundColor: '#EEF4FF',
  },
  tabText: {
    fontSize: FontSizes.xs + 1,
    fontFamily: Fonts.uberMoveMedium,
    color: '#64748B',
  },
  tabTextActive: {
    fontFamily: Fonts.uberMoveBold,
    color: Colors.ButtonPrimaryColor,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  docCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  docHeader: {
    marginBottom: Spacing.md,
  },
  docTitle: {
    fontSize: FontSizes['2xl'],
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
  },
  docLastUpdated: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveRegular,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.uberMoveBold,
    color: '#0F172A',
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.uberMoveRegular,
    color: '#475569',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  appVersionFooter: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  versionText: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.uberMoveBold,
    color: '#94A3B8',
  },
  copyrightText: {
    fontSize: 10,
    fontFamily: Fonts.uberMoveRegular,
    color: '#CBD5E1',
    marginTop: 2,
  },
});

export default TermsScreen;
