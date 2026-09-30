import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  findNodeHandle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { OnboardingStackParamList } from "../../navigation/types";
import { Button } from "../../components/Button";
import { Header } from "../../components/Header";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { api } from "../../services/api";
import { showAlert } from "../../utils/helpers";
import { Service, SubServiceDetail } from "../../types/models";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "../../context/UserContext";
import { Colors } from "../../theme/colors";
import { FontSizes, FontWeights } from "../../theme/fonts";
import { BorderRadius, Spacing } from "../../theme/spacing";
import { navigationRef } from "../../navigation/navigationRef";
import { storage } from "../../utils/storage";
import { StorageKeys } from "../../constants";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Services">;

interface SelectedServiceItem {
  serviceId: string;
  subServiceId?: string;
  name: string;
  price: string;
}

export function ServicesScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, SelectedServiceItem>>({});
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

  const handleInputFocus = (event: any) => {
    if (Platform.OS === "web") {
      try {
        event.target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      } catch {}
      return;
    }
    try {
      const reactNode = findNodeHandle(event.target);
      if (reactNode && scrollViewRef.current) {
        (scrollViewRef.current as any)?.getScrollResponder?.()?.scrollNativeHandleToKeyboard?.(
          reactNode,
          150,
          true
        );
      }
    } catch {}
  };

  const isFromSettings =
    route.params?.isFromSettings || user.isSignUpCompleted;

  const DEFAULT_CATALOG: Service[] = [
    {
      _id: "cat_barber_1",
      serviceName: "Barber & Hair Styling",
      subServiceDetails: [
        {
          _id: "sub_haircut_1",
          subServiceName: "Men's Classic Haircut",
          subServiceDescription: "Precision haircut including neck shave & style",
          subServiceCharges: 30,
        },
        {
          _id: "sub_beard_2",
          subServiceName: "Beard Trim & Sculpting",
          subServiceDescription: "Beard shaping, line-up and hot towel treatment",
          subServiceCharges: 20,
        },
        {
          _id: "sub_combo_3",
          subServiceName: "Haircut & Beard Combo",
          subServiceDescription: "Full haircut and detailed beard grooming",
          subServiceCharges: 45,
        },
        {
          _id: "sub_kids_4",
          subServiceName: "Kids Haircut",
          subServiceDescription: "Gentle haircut styling for children under 12",
          subServiceCharges: 25,
        },
        {
          _id: "sub_lineup_5",
          subServiceName: "Edge-Up / Line-Up Only",
          subServiceDescription: "Clean edge razor perimeter alignment",
          subServiceCharges: 15,
        },
      ],
    },
    {
      _id: "cat_salon_2",
      serviceName: "Salon & Women's Hair",
      subServiceDetails: [
        {
          _id: "sub_w_cut_1",
          subServiceName: "Women's Cut & Blowout",
          subServiceDescription: "Custom haircut, wash, blowout & styling",
          subServiceCharges: 60,
        },
        {
          _id: "sub_color_2",
          subServiceName: "Hair Coloring / Highlights",
          subServiceDescription: "Full or partial single-process coloring",
          subServiceCharges: 90,
        },
        {
          _id: "sub_blowout_3",
          subServiceName: "Blowout & Thermal Styling",
          subServiceDescription: "Volumizing blowout with flat or curling iron",
          subServiceCharges: 45,
        },
      ],
    },
    {
      _id: "cat_cleaning_3",
      serviceName: "Professional Cleaning Services",
      subServiceDetails: [
        {
          _id: "sub_home_clean_1",
          subServiceName: "Standard Home / Apartment Cleaning",
          subServiceDescription: "Mopping, vacuuming, dusting & kitchen/bathroom cleaning",
          subServiceCharges: 80,
        },
        {
          _id: "sub_deep_clean_2",
          subServiceName: "Deep Clean / Move-Out Cleaning",
          subServiceDescription: "Intensive sanitization, baseboards, appliances & inside cabinets",
          subServiceCharges: 140,
        },
        {
          _id: "sub_office_clean_3",
          subServiceName: "Office / Commercial Space Cleaning",
          subServiceDescription: "Workstation sanitizing, floors, trash disposal & common areas",
          subServiceCharges: 110,
        },
      ],
    },
  ];

  const userServicesKey = user.id
    ? `${StorageKeys.userServices}_${user.id}`
    : StorageKeys.userServices;

  const loadServices = useCallback(async () => {
    try {
      setLoading(true);

      // 1. If editing from Settings (existing provider), load cached selected services & prices
      let cachedMap: Record<string, SelectedServiceItem> = {};
      if (isFromSettings) {
        try {
          const savedMap = await storage.get<Record<string, SelectedServiceItem>>(
            userServicesKey
          );
          if (savedMap && typeof savedMap === "object" && Object.keys(savedMap).length > 0) {
            cachedMap = savedMap;
            setSelectedMap(savedMap);
          }
        } catch {}
      } else {
        // Fresh onboarding: start with empty selectedMap so previous user's custom rates are never inherited
        setSelectedMap({});
      }

      // Helper to extract list from any backend response structure
      const extractList = (res: any): any[] => {
        if (!res) return [];
        if (Array.isArray(res)) return res;
        if (Array.isArray(res.servicesList)) return res.servicesList;
        if (Array.isArray(res.services)) return res.services;
        if (Array.isArray(res.data?.servicesList)) return res.data.servicesList;
        if (Array.isArray(res.data?.services)) return res.data.services;
        if (Array.isArray(res.data)) return res.data;
        return [];
      };

      let fetchedList: any[] = [];

      // 1. Try sp/all-services (Primary endpoint used by iOS app)
      try {
        const res0 = await api.getAllServices();
        const list = extractList(res0);
        if (list.length > 0) {
          fetchedList = list;
        }
      } catch (err) {
        console.log("Failed to fetch all services:", err);
      }

      // 2. Try sp/services/list
      if (fetchedList.length === 0) {
        try {
          const res1 = await api.getServicesList();
          const list = extractList(res1);
          if (list.length > 0) {
            fetchedList = list;
          }
        } catch (err) {}
      }

      // 3. Try sp/services
      if (fetchedList.length === 0) {
        try {
          const res2 = await api.getSPServices();
          const list = extractList(res2);
          if (list.length > 0) {
            fetchedList = list;
          }
        } catch (err) {}
      }

      // 4. Try fetch all services
      if (fetchedList.length === 0) {
        try {
          const res3 = await api.fetchAllServices();
          const list = extractList(res3);
          if (list.length > 0) {
            fetchedList = list;
          }
        } catch (err) {}
      }

      // 5. Try merchant services
      if (fetchedList.length === 0) {
        try {
          const res4 = await api.getMerchantServices();
          const list = extractList(res4);
          if (list.length > 0) {
            fetchedList = list;
          }
        } catch (err) {}
      }

      // Normalize service structure (handle various backend field names)
      const rawList = fetchedList.length > 0 ? fetchedList : DEFAULT_CATALOG;
      const initialMap: Record<string, SelectedServiceItem> = { ...cachedMap };

      const normalized: Service[] = await Promise.all(
        rawList.map(async (item: any, idx: number) => {
          const serviceId = String(item._id || item.id || `srv_${idx}`);
          const sName = String(item.serviceName || item.name || item.title || "Service Category");
          let subDetails: any[] = [];

          if (Array.isArray(item.subService) && item.subService.length > 0) {
            subDetails = item.subService;
          } else if (Array.isArray(item.subServiceDetails) && item.subServiceDetails.length > 0) {
            subDetails = item.subServiceDetails;
          } else if (Array.isArray(item.subServices) && item.subServices.length > 0) {
            subDetails = item.subServices;
          } else if (Array.isArray(item.subServiceList) && item.subServiceList.length > 0) {
            subDetails = item.subServiceList;
          } else if (fetchedList.length > 0 && item._id && !item._id.startsWith("cat_") && !item._id.startsWith("srv_")) {
            // If from Settings, try fetching provider's already selected subservices with custom pricing
            if (isFromSettings) {
              try {
                const selectedSubRes = await api.getSubServicesAndPlans(item._id);
                const selectedList = extractList(selectedSubRes) || (selectedSubRes as any)?.subServices || [];
                if (Array.isArray(selectedList) && selectedList.length > 0) {
                  subDetails = selectedList;
                }
              } catch {}
            }

            // If empty or fresh onboarding, fetch general default subservices catalog
            if (subDetails.length === 0) {
              try {
                const subRes = await api.getSubServicesByServiceId(item._id);
                const subList = extractList(subRes) || (subRes as any)?.subServices || [];
                if (Array.isArray(subList) && subList.length > 0) {
                  subDetails = subList;
                }
              } catch {}
            }
          }

          const cleanSubs: SubServiceDetail[] = subDetails.map((sub: any, subIdx: number) => {
            const subId = String(sub._id || sub.id || sub.subServiceId || `${serviceId}_sub_${subIdx}`);
            const subName = String(sub.subServiceName || sub.name || sub.title || "Service Option");
            const key = `${serviceId}_${subId}`;

            const chargeVal = sub.subServiceCharges || sub.charges || sub.hourlyRate || sub.price;
            if (chargeVal !== undefined && chargeVal !== null && Number(chargeVal) > 0) {
              if (!initialMap[key]) {
                initialMap[key] = {
                  serviceId,
                  subServiceId: subId,
                  name: subName,
                  price: String(chargeVal),
                };
              }
            }

            return {
              _id: subId,
              subServiceName: subName,
              subServiceDescription: sub.subServiceDescription || sub.description || "",
              subServiceCharges: Number(chargeVal || 30),
              serviceId: String(sub.serviceId || serviceId),
            };
          });

          return {
            _id: serviceId,
            serviceName: sName,
            serviceDescription: item.serviceDescription || "",
            subServiceDetails: cleanSubs,
          };
        })
      );

      setServices(normalized);

      if (normalized.length > 0 && normalized[0]._id) {
        setExpandedServices(new Set([normalized[0]._id]));
      }

      // Pre-load from company selected services only if from Settings
      if (isFromSettings) {
        try {
          const prevSaved = await api.getCompanySelectedServices();
          const prevList = extractList(prevSaved) || (prevSaved as any)?.selectedServices || [];
          if (Array.isArray(prevList) && prevList.length > 0) {
            prevList.forEach((s: any) => {
              const sId = String(s.serviceId || s._id || "");
              if (Array.isArray(s.subServices) && s.subServices.length > 0) {
                s.subServices.forEach((sub: any) => {
                  const subId = String(sub.subServiceId || sub._id || "");
                  if (sId && subId) {
                    initialMap[`${sId}_${subId}`] = {
                      serviceId: sId,
                      subServiceId: subId,
                      name: String(sub.subServiceName || sub.name || "Service"),
                      price: String(sub.subServiceCharges || sub.charges || 25),
                    };
                  }
                });
              }
            });
          }
        } catch {}
      }

      if (Object.keys(initialMap).length > 0) {
        setSelectedMap(initialMap);
      }
    } catch (e: any) {
      console.warn("Failed to load services, falling back to default catalog:", e.message);
      setServices(DEFAULT_CATALOG);
      setExpandedServices(new Set([DEFAULT_CATALOG[0]._id!]));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  const toggleExpand = (serviceId: string) => {
    setExpandedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const toggleSubService = (
    serviceId: string,
    subServiceId: string,
    name: string,
    defaultPrice = "25.00"
  ) => {
    const key = `${serviceId}_${subServiceId}`;
    setSelectedMap((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          serviceId,
          subServiceId,
          name,
          price: defaultPrice,
        };
      }
      return next;
    });
  };

  const updatePrice = (
    serviceId: string,
    subServiceId: string,
    priceText: string,
    name?: string
  ) => {
    const key = `${serviceId}_${subServiceId}`;
    setSelectedMap((prev) => ({
      ...prev,
      [key]: {
        serviceId,
        subServiceId,
        name: prev[key]?.name || name || "Service",
        price: priceText,
      },
    }));
  };

  const submit = async () => {
    const selectedItems = Object.values(selectedMap);
    if (selectedItems.length === 0) {
      showAlert("Required", "Please select at least one service to offer.");
      return;
    }

    for (const item of selectedItems) {
      const p = parseFloat(item.price);
      if (isNaN(p) || p <= 0) {
        showAlert("Invalid Price", `Please enter a valid price for "${item.name}".`);
        return;
      }
    }

    try {
      setLoading(true);

      // Group selected subservices by parent serviceId (matches iOS app schema)
      const serviceGroups: Record<
        string,
        Array<{ subServiceId: string; subServiceCharges: number }>
      > = {};

      for (const item of selectedItems) {
        const parentId = item.serviceId;
        const subId = item.subServiceId || item.serviceId;
        const charges = parseFloat(item.price) || 0;

        if (!parentId) continue;

        if (!serviceGroups[parentId]) {
          serviceGroups[parentId] = [];
        }

        serviceGroups[parentId].push({
          subServiceId: subId,
          subServiceCharges: charges,
        });
      }

      const selectedServicesArray = Object.entries(serviceGroups).map(
        ([sId, subs]) => ({
          serviceId: sId,
          subServices: subs,
        })
      );

      if (selectedServicesArray.length === 0) {
        showAlert("Required", "Please select at least one service to offer.");
        return;
      }

      const payload: any = {
        selectedServices: selectedServicesArray,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profileImage: user.profileImage || "",
      };

      await api.selectServices(payload);
      await storage.set(userServicesKey, selectedMap);
      await storage.set(StorageKeys.userServices, selectedMap);

      if (isFromSettings) {
        showAlert("Success", "Your services and pricing have been updated.");
        if (navigationRef.isReady()) {
          navigationRef.navigate("Main", { screen: "Settings" } as any);
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          (navigation as any).navigate("Settings");
        }
      } else {
        navigation.navigate("Certificates");
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isFromSettings) {
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
      navigation.navigate("ServicesFor");
    }
  };

  const selectedCount = Object.keys(selectedMap).length;

  return (
    <View style={styles.container}>
      <Header title="Select Services" onBackPress={handleBack} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
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
          <LoadingOverlay visible={loading} />

          <Text style={styles.headerTitle}>Customize Your Offerings</Text>
          <Text style={styles.headerSubtitle}>
            Select the services you offer and customize your price ($) for each service.
          </Text>

          <View style={styles.servicesList}>
            {services.map((service) => {
              const serviceId = service._id || "";
              const isExpanded = expandedServices.has(serviceId);
              const subServices = service.subServiceDetails || [];

              return (
                <View key={serviceId} style={styles.serviceCategoryCard}>
                  <TouchableOpacity
                    style={styles.serviceHeaderRow}
                    onPress={() => toggleExpand(serviceId)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.serviceHeaderLeft}>
                      <Ionicons
                        name="layers-outline"
                        size={20}
                        color={Colors.ButtonPrimaryColor}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={styles.serviceCategoryTitle}>{service.serviceName}</Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.subServicesContainer}>
                      {subServices.length === 0 ? (
                        // Single standalone service
                        (() => {
                          const key = `${serviceId}_${serviceId}`;
                          const isSelected = !!selectedMap[key];
                          const item = selectedMap[key];

                          return (
                            <View style={styles.subServiceItem}>
                              <TouchableOpacity
                                style={styles.subServiceSelectRow}
                                onPress={() =>
                                  toggleSubService(
                                    serviceId,
                                    serviceId,
                                    service.serviceName || "Service",
                                    "25.00"
                                  )
                                }
                                activeOpacity={0.8}
                              >
                                <Ionicons
                                  name={isSelected ? "checkbox" : "square-outline"}
                                  size={22}
                                  color={isSelected ? Colors.ButtonPrimaryColor : "#94A3B8"}
                                  style={{ marginRight: 10 }}
                                />
                                <Text
                                  style={[
                                    styles.subServiceName,
                                    isSelected && styles.subServiceNameSelected,
                                  ]}
                                >
                                  {service.serviceName}
                                </Text>
                              </TouchableOpacity>

                              {isSelected && (
                                <View style={styles.priceInputRow}>
                                  <Text style={styles.priceLabel}>Your Price ($):</Text>
                                  <View style={styles.dollarInputWrap}>
                                    <Text style={styles.dollarSymbol}>$</Text>
                                    <TextInput
                                      style={styles.priceTextInput}
                                      keyboardType="decimal-pad"
                                      value={item?.price !== undefined ? String(item.price) : ""}
                                      onChangeText={(val) =>
                                        updatePrice(
                                          serviceId,
                                          serviceId,
                                          val,
                                          service.serviceName
                                        )
                                      }
                                      onFocus={handleInputFocus}
                                      placeholder="25.00"
                                      placeholderTextColor="#94A3B8"
                                      returnKeyType="done"
                                    />
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })()
                      ) : (
                        subServices.map((sub: SubServiceDetail) => {
                          const subId = sub._id || "";
                          const key = `${serviceId}_${subId}`;
                          const isSelected = !!selectedMap[key];
                          const item = selectedMap[key];
                          const defaultPrice = String(sub.subServiceCharges || 30);

                          return (
                            <View key={subId} style={styles.subServiceItem}>
                              <TouchableOpacity
                                style={styles.subServiceSelectRow}
                                onPress={() =>
                                  toggleSubService(
                                    serviceId,
                                    subId,
                                    sub.subServiceName || "Service",
                                    defaultPrice
                                  )
                                }
                                activeOpacity={0.8}
                              >
                                <Ionicons
                                  name={isSelected ? "checkbox" : "square-outline"}
                                  size={22}
                                  color={isSelected ? Colors.ButtonPrimaryColor : "#94A3B8"}
                                  style={{ marginRight: 10 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={[
                                      styles.subServiceName,
                                      isSelected && styles.subServiceNameSelected,
                                    ]}
                                  >
                                    {sub.subServiceName}
                                  </Text>
                                  {sub.subServiceDescription ? (
                                    <Text style={styles.subServiceDesc}>
                                      {sub.subServiceDescription}
                                    </Text>
                                  ) : null}
                                </View>
                              </TouchableOpacity>

                              {isSelected && (
                                <View style={styles.priceInputRow}>
                                  <Text style={styles.priceLabel}>Your Price ($):</Text>
                                  <View style={styles.dollarInputWrap}>
                                    <Text style={styles.dollarSymbol}>$</Text>
                                    <TextInput
                                      style={styles.priceTextInput}
                                      keyboardType="decimal-pad"
                                      value={item?.price !== undefined ? String(item.price) : ""}
                                      onChangeText={(val) =>
                                        updatePrice(
                                          serviceId,
                                          subId,
                                          val,
                                          sub.subServiceName
                                        )
                                      }
                                      onFocus={handleInputFocus}
                                      placeholder={defaultPrice}
                                      placeholderTextColor="#94A3B8"
                                      returnKeyType="done"
                                    />
                                  </View>
                                </View>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              );
            })}
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
            title={
              isFromSettings
                ? `Update ${selectedCount} Service${selectedCount === 1 ? "" : "s"} & Rates`
                : `Continue with ${selectedCount} Service${selectedCount === 1 ? "" : "s"}`
            }
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
    marginBottom: Spacing.lg,
  },
  servicesList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  serviceCategoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
    backgroundColor: "#FFFFFF",
  },
  serviceHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  serviceCategoryTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  subServicesContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FAFAFA",
    paddingVertical: 4,
  },
  subServiceItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  subServiceSelectRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  subServiceName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.TitleColor,
  },
  subServiceNameSelected: {
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  subServiceDesc: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 2,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingLeft: 32,
    gap: 10,
  },
  priceLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.DescriptionTextDark,
  },
  dollarInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.ButtonPrimaryColor,
    paddingHorizontal: 10,
    height: 38,
    width: 110,
  },
  dollarSymbol: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    marginRight: 4,
  },
  priceTextInput: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    padding: 0,
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


