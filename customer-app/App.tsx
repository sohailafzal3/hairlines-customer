import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import { Ionicons, MaterialCommunityIcons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
          ...MaterialCommunityIcons.font,
          ...FontAwesome.font,
          ...FontAwesome5.font,
        });
      } catch (error) {
        console.warn('Failed to preload fonts:', error);
      } finally {
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator fontsLoaded={fontsLoaded} />
      <Toast />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
};

export default App;
