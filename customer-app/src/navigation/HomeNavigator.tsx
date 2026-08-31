import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CategoriesScreen from '../screens/Home/CategoriesScreen';
import ServicesScreen from '../screens/Home/ServicesScreen';
import SubServicesScreen from '../screens/Home/SubServicesScreen';
import UserJobDetailScreen from '../screens/Home/UserJobDetailScreen';
import SuggestedMoversScreen from '../screens/Home/SuggestedMoversScreen';
import WorkerProfileScreen from '../screens/Home/WorkerProfileScreen';
import JobSummaryScreen from '../screens/Home/JobSummaryScreen';
import SetLocationScreen from '../screens/Home/SetLocationScreen';
import MapScreen from '../screens/Home/MapScreen';
import CalendarScreen from '../screens/Home/CalendarScreen';
import FiltersScreen from '../screens/Home/FiltersScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import JobDetailsScreen from '../screens/MyJobs/JobDetailsScreen';
import CostBreakDownScreen from '../screens/MyJobs/CostBreakDownScreen';

export type HomeStackParamList = {
  Categories: undefined;
  Services: { serviceTypeId?: string; serviceTypeName?: string };
  SubServices: { serviceId: string; serviceName: string };
  UserJobDetail: { subServiceId: string; subServiceName: string; serviceInfo?: any };
  SuggestedMovers: undefined;
  WorkerProfile: { spProfileId: string };
  JobSummary: undefined;
  SetLocation: {
    selectedArea?: string;
    selectedCity?: string;
    selectedState?: string;
    selectedCountry?: string;
    latitude?: number;
    longitude?: number;
  } | undefined;
  Map: { initialLat?: number; initialLng?: number } | undefined;
  Calendar: undefined;
  Filters: undefined;
  Chat: { jobId: string; spName?: string };
  JobDetails: { jobId: string };
  CostBreakDown: { jobId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="SubServices" component={SubServicesScreen} />
      <Stack.Screen name="UserJobDetail" component={UserJobDetailScreen} />
      <Stack.Screen name="SuggestedMovers" component={SuggestedMoversScreen} />
      <Stack.Screen name="WorkerProfile" component={WorkerProfileScreen} />
      <Stack.Screen name="JobSummary" component={JobSummaryScreen} />
      <Stack.Screen name="SetLocation" component={SetLocationScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Filters" component={FiltersScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="JobDetails" component={JobDetailsScreen} />
      <Stack.Screen name="CostBreakDown" component={CostBreakDownScreen} />
    </Stack.Navigator>
  );
};

export default HomeNavigator;
