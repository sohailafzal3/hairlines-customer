import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import { Header } from '../../components';
import { kTermsLink, kPrivicyPolicyLink } from '../../constants';
import { WebView } from 'react-native-webview';

type Props = {
  navigation: NativeStackNavigationProp<AppDrawerParamList, 'Terms'>;
};

const TermsScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [showWebView, setShowWebView] = useState(false);
  const [webTitle, setWebTitle] = useState('Terms & Conditions');
  const [url, setUrl] = useState(kTermsLink);

  const openDocument = (docTitle: string, link: string) => {
    setWebTitle(docTitle);
    setUrl(link);
    setShowWebView(true);
  };

  if (showWebView) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Header title={webTitle} onBackPress={() => setShowWebView(false)} />
        <WebView source={{ uri: url }} style={{ flex: 1 }} startInLoadingState />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <Header
        title="Legal & Policies"
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

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 30 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Ionicons name="document-text" size={32} color={Colors.ButtonPrimaryColor} />
          <Text style={styles.heroTitle}>Hairlines Legal Terms</Text>
          <Text style={styles.heroSub}>
            Please review our service policies, terms of use, and privacy protection protocols.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.legalItem}
          onPress={() => openDocument('Terms & Conditions', kTermsLink)}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="newspaper-outline" size={20} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.legalItemTitle}>Terms of Service</Text>
            <Text style={styles.legalItemSub}>Rules and agreements governing platform usage</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.legalItem}
          onPress={() => openDocument('Privacy Policy', kPrivicyPolicyLink)}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.legalItemTitle}>Privacy Policy</Text>
            <Text style={styles.legalItemSub}>How we collect, protect, and handle your data</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.legalItem}
          onPress={() => openDocument('Community Guidelines', kTermsLink)}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="people-outline" size={20} color={Colors.ButtonPrimaryColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.legalItemTitle}>Community Standards</Text>
            <Text style={styles.legalItemSub}>Respectful interaction standards for users and stylists</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 20,
    alignItems: 'center',
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.TitleColor,
    marginTop: 10,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.ButtonPrimaryColor}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legalItemTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  legalItemSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default TermsScreen;
