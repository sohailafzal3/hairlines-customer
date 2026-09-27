import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import en from "./en.json";
import ar from "./ar.json";
import fr from "./fr.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
};

const primaryLocale = Localization.getLocales()[0]?.languageCode;
const supportedLngs = ["en", "ar", "fr"];
const lng = supportedLngs.includes(primaryLocale || "") ? primaryLocale : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: lng || "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
