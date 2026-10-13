import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants";
import {
  Colors,
  DEFAULT_PRIMARY_COLOR,
  THEME_COLOR_PRESETS,
  THEME_COLOR_MAP,
  setThemePrimaryColor,
} from "../theme/colors";

interface ThemeContextValue {
  primaryColor: string;
  primaryLightColor: string;
  primaryDarkColor: string;
  setPrimaryColor: (color: string) => Promise<void>;
  resetPrimaryColor: () => Promise<void>;
  colorPresets: readonly string[];
}

const defaultSet = THEME_COLOR_MAP[DEFAULT_PRIMARY_COLOR];

const ThemeContext = createContext<ThemeContextValue>({
  primaryColor: DEFAULT_PRIMARY_COLOR,
  primaryLightColor: defaultSet.light,
  primaryDarkColor: defaultSet.dark,
  setPrimaryColor: async () => {},
  resetPrimaryColor: async () => {},
  colorPresets: THEME_COLOR_PRESETS,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState<string>(DEFAULT_PRIMARY_COLOR);

  const currentSet =
    THEME_COLOR_MAP[primaryColor.toUpperCase()] ||
    THEME_COLOR_MAP[primaryColor] ||
    defaultSet;

  // Load saved theme color on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.themePrimaryColor);
        if (saved && typeof saved === "string" && saved.startsWith("#")) {
          setPrimaryColorState(saved);
          setThemePrimaryColor(saved);
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handleSetPrimaryColor = useCallback(async (color: string) => {
    setPrimaryColorState(color);
    setThemePrimaryColor(color);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.themePrimaryColor, color);
    } catch (err) {
      // ignore
    }
  }, []);

  const handleResetPrimaryColor = useCallback(async () => {
    setPrimaryColorState(DEFAULT_PRIMARY_COLOR);
    setThemePrimaryColor(DEFAULT_PRIMARY_COLOR);
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.themePrimaryColor);
    } catch (err) {
      // ignore
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        primaryLightColor: currentSet.light,
        primaryDarkColor: currentSet.dark,
        setPrimaryColor: handleSetPrimaryColor,
        resetPrimaryColor: handleResetPrimaryColor,
        colorPresets: THEME_COLOR_PRESETS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
