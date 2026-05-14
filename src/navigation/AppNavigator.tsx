import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeNavigator from './HomeNavigator';
import MyJobsScreen from '../screens/MyJobs/MyJobsScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import MyProfileScreen from '../screens/Profile/MyProfileScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import PaymentsScreen from '../screens/Payments/PaymentsScreen';
import PromoCodesScreen from '../screens/PromoCodes/PromoCodesScreen';
import ShareReferralScreen from '../screens/Share/ShareReferralScreen';
import ContactSupportScreen from '../screens/ContactSupport/ContactSupportScreen';
import TermsScreen from '../screens/Terms/TermsScreen';
import CustomDrawerContent from '../components/common/CustomDrawerContent';
import { Colors } from '../theme/colors';

export type AppDrawerParamList = {
  HomeStack: undefined;
  MyJobs: undefined;
  Notifications: undefined;
  MyProfile: undefined;
  Wallet: undefined;
  Payments: undefined;
  PromoCodes: undefined;
  ShareReferral: undefined;
  ContactSupport: undefined;
  Terms: undefined;
};

const Drawer = createDrawerNavigator<AppDrawerParamList>();

const AppNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: Colors.BGColor,
          width: '75%',
        },
      }}
    >
      <Drawer.Screen name="HomeStack" component={HomeNavigator} />
      <Drawer.Screen name="MyJobs" component={MyJobsScreen} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} />
      <Drawer.Screen name="MyProfile" component={MyProfileScreen} />
      <Drawer.Screen name="Wallet" component={WalletScreen} />
      <Drawer.Screen name="Payments" component={PaymentsScreen} />
      <Drawer.Screen name="PromoCodes" component={PromoCodesScreen} />
      <Drawer.Screen name="ShareReferral" component={ShareReferralScreen} />
      <Drawer.Screen name="ContactSupport" component={ContactSupportScreen} />
      <Drawer.Screen name="Terms" component={TermsScreen} />
    </Drawer.Navigator>
  );
};

export default AppNavigator;
