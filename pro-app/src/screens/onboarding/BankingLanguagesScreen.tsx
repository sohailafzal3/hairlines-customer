import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { Input } from "../../components/Input";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";
import { STRIPE_PUBLISHABLE_KEY } from "../../constants";
import { navigationRef } from "../../navigation/navigationRef";

type Props = NativeStackScreenProps<OnboardingStackParamList, "BankingLanguages">;

export function BankingLanguagesScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ssn, setSsn] = useState("");

  const isFromSettings =
    route.params?.isFromSettings || user.isSignUpCompleted;
  const returnScreen = route.params?.returnScreen || (isFromSettings ? "Settings" : undefined);

  useEffect(() => {
    // Load existing bank account details if available
    api
      .getBankDetails()
      .then((bankRes) => {
        if (bankRes) {
          const data = (bankRes as any)?.data || bankRes;
          if (data.routingNum) setRoutingNumber(String(data.routingNum));
          if (data.last4) setAccountNumber(`*** *** ***${data.last4}`);
          if (data.ssnNumber) setSsn(String(data.ssnNumber));
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const createStripeBankToken = async (): Promise<string> => {
    const params = new URLSearchParams();
    params.append("bank_account[country]", "US");
    params.append("bank_account[currency]", "usd");
    params.append("bank_account[routing_number]", routingNumber.trim());
    params.append("bank_account[account_number]", accountNumber.trim());
    if (user.firstName || user.lastName) {
      params.append(
        "bank_account[account_holder_name]",
        `${user.firstName || ""} ${user.lastName || ""}`.trim()
      );
      params.append("bank_account[account_holder_type]", "individual");
    }

    const res = await fetch("https://api.stripe.com/v1/tokens", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_PUBLISHABLE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(
        data.error.message || "Failed to create bank token with Stripe."
      );
    }
    return data.id;
  };

  const submit = async () => {
    if (!routingNumber.trim() || routingNumber.trim().length < 9) {
      showAlert("Required", "Please Enter Routing Number");
      return;
    }

    if (!accountNumber.trim()) {
      showAlert("Required", "Please Enter Account Number");
      return;
    }

    if (accountNumber.includes("*")) {
      showAlert("Required", "Please re-enter your account number to update.");
      return;
    }

    const cleanSSN = ssn.replace(/\D/g, "");
    if (!cleanSSN || cleanSSN.length < 4) {
      showAlert("Required", "Please enter valid SSN");
      return;
    }

    try {
      setSubmitting(true);

      const bankToken = await createStripeBankToken();
      await api.addBankInfo(bankToken, ssn.trim());

      if (isFromSettings) {
        showAlert("Success", "Bank details are updated successfully!");
        if (returnScreen === "Wallet") {
          if (navigationRef.isReady()) {
            navigationRef.navigate("Main", { screen: "Wallet" } as any);
          } else if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            (navigation as any).navigate("Wallet");
          }
        } else {
          if (navigationRef.isReady()) {
            navigationRef.navigate("Main", { screen: "Settings" } as any);
          } else if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            (navigation as any).navigate("Settings");
          }
        }
      } else {
        navigation.navigate("Availability");
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isFromSettings) {
      if (returnScreen === "Wallet") {
        if (navigationRef.isReady()) {
          navigationRef.navigate("Main", { screen: "Wallet" } as any);
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          (navigation as any).navigate("Wallet");
        }
        return;
      }
      if (navigationRef.isReady()) {
        navigationRef.navigate("Main", { screen: "Settings" } as any);
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        (navigation as any).navigate("Settings");
      }
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("IdentityDocuments");
    }
  };

  const screenTitle = isFromSettings ? "Banking Details" : "Account Details";

  return (
    <View style={styles.container}>
      <Header title={screenTitle} onBackPress={handleBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <LoadingOverlay visible={loading || submitting} />

          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <Text style={styles.headerSubtitle}>
            Provide your bank account details for direct payouts.
          </Text>

          <View style={styles.cardSection}>
            {/* 1. Routing Number */}
            <Input
              label="Routing Number"
              placeholder="e.g 110000000"
              value={routingNumber}
              onChangeText={setRoutingNumber}
              keyboardType="number-pad"
              maxLength={9}
            />

            {/* 2. Account Number */}
            <Input
              label="Account Number"
              placeholder="e.g 000123456789"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
            />

            {/* 3. SSN */}
            <Input
              label="SSN"
              placeholder="e.g 123456789"
              value={ssn}
              onChangeText={setSsn}
              keyboardType="number-pad"
              maxLength={9}
            />
          </View>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>

        {/* Action Button */}
        <View
          style={[
            styles.footerWrap,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <Button
            title={isFromSettings ? "UPDATE" : "SUBMIT"}
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: Spacing.lg },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.DescriptionTextDark,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: Spacing.lg,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  footerWrap: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: Spacing.base,
    paddingTop: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
});


