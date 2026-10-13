import "react-native-gesture-handler";
import "./src/localization/i18n";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { UserProvider } from "./src/context/UserContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <RootNavigator />
        </ThemeProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
