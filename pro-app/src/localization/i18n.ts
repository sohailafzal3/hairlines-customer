import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import en from "./en.json";
import ar from "./ar.json";
import fr from "./fr.json";

const resources = {
  en: {
    translation: en,
    common: en.common,
    auth: en.auth,
    onboarding: en.onboarding,
    home: en.home,
    job: en.job,
    drawer: en.drawer,
    validation: en.validation,
  },
  ar: {
    translation: ar,
    common: ar.common,
    auth: ar.auth,
    onboarding: ar.onboarding,
    home: ar.home,
    job: ar.job,
    drawer: ar.drawer,
    validation: ar.validation,
  },
  fr: {
    translation: fr,
    common: fr.common,
    auth: fr.auth,
    onboarding: fr.onboarding,
    home: fr.home,
    job: fr.job,
    drawer: fr.drawer,
    validation: fr.validation,
  },
};

const primaryLocale = Localization.getLocales()[0]?.languageCode;
const supportedLngs = ["en", "ar", "fr"];
const lng = supportedLngs.includes(primaryLocale || "") ? primaryLocale : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: lng || "en",
  fallbackLng: "en",
  defaultNS: "translation",
  interpolation: { escapeValue: false },
});

export default i18n;
