import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedMap, setSelectedMap] = useState<Record<string, SelectedServiceItem>>({});
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    // Try multiple endpoints to retrieve services
    const loadServices = async () => {
      try {
        setLoading(true);
        let fetchedList: any[] = [];

        // 1. Try SP services
        try {
          const res0 = await api.getSPServices();
          const list = (res0 as any)?.services || (res0 as any)?.data || (Array.isArray(res0) ? res0 : []);
          if (Array.isArray(list) && list.length > 0) {
            fetchedList = list;
          }
        } catch (err) {}

        // 2. Try all services
        if (fetchedList.length === 0) {
          try {
            const res1 = await api.getAllServices();
            const list = (res1 as any)?.services || (res1 as any)?.data || (Array.isArray(res1) ? res1 : []);
            if (Array.isArray(list) && list.length > 0) {
              fetchedList = list;
            }
          } catch (err) {}
        }

        // 3. Try fetch all services
        if (fetchedList.length === 0) {
          try {
            const res2 = await api.fetchAllServices();
            const list = (res2 as any)?.services || (res2 as any)?.data || (Array.isArray(res2) ? res2 : []);
            if (Array.isArray(list) && list.length > 0) {
              fetchedList = list;
            }
          } catch (err) {}
        }

        // 4. Try services list
        if (fetchedList.length === 0) {
          try {
            const res3 = await api.getServicesList();
            const list = (res3 as any)?.services || (res3 as any)?.data || (Array.isArray(res3) ? res3 : []);
            if (Array.isArray(list) && list.length > 0) {
              fetchedList = list;
            }
          } catch (err) {}
        }

        // 5. Try merchant services
        if (fetchedList.length === 0) {
          try {
            const res4 = await api.getMerchantServices();
            const list = (res4 as any)?.services || (res4 as any)?.data || (Array.isArray(res4) ? res4 : []);
            if (Array.isArray(list) && list.length > 0) {
              fetchedList = list;
            }
          } catch (err) {}
        }

        // Normalize service structure (handle various backend field names)
        const rawList = fetchedList.length > 0 ? fetchedList : DEFAULT_CATALOG;
        const normalized: Service[] = await Promise.all(
          rawList.map(async (item: any, idx: number) => {
            const serviceId = String(item._id || item.id || `srv_${idx}`);
            const sName = String(item.serviceName || item.name || item.title || "Service Category");
            let subDetails: SubServiceDetail[] = [];

            if (Array.isArray(item.subServiceDetails) && item.subServiceDetails.length > 0) {
              subDetails = item.subServiceDetails;
            } else if (Array.isArray(item.subServices) && item.subServices.length > 0) {
              subDetails = item.subServices;
            } else if (Array.isArray(item.subServiceList) && item.subServiceList.length > 0) {
              subDetails = item.subServiceList;
            } else if (fetchedList.length > 0 && item._id) {
              // Try fetching subservices for this specific service ID if not embedded
              try {
                const subRes = await api.getSubServicesByServiceId(item._id);
                if (Array.isArray(subRes?.subServices) && subRes.subServices.length > 0) {
                  subDetails = subRes.subServices as any;
                }
              } catch (subErr) {}
            }

            const cleanSubs: SubServiceDetail[] = subDetails.map((sub: any, subIdx: number) => ({
              _id: String(sub._id || sub.id || sub.subServiceId || `${serviceId}_sub_${subIdx}`),
              subServiceName: String(sub.subServiceName || sub.name || sub.title || "Service Option"),
              subServiceDescription: sub.subServiceDescription || sub.description || "",
              subServiceCharges: Number(sub.subServiceCharges || sub.charges || sub.hourlyRate || sub.price || 30),
            }));

            return {
              _id: serviceId,
              serviceName: sName,
              subServiceDetails: cleanSubs,
            };
          })
        );

        setServices(normalized);

        // Expand first service category by default
        if (normalized.length > 0 && normalized[0]._id) {
          setExpandedServices(new Set([normalized[0]._id]));
        }

        // Try to pre-load previously saved services
        try {
          const prevSaved = await api.getCompanySelectedServices();
          const prevList = (prevSaved as any)?.services || (prevSaved as any)?.selectedServices || [];
          if (Array.isArray(prevList) && prevList.length > 0) {
            const initialMap: Record<string, SelectedServiceItem> = {};
            prevList.forEach((s: any) => {
              const sId = String(s.serviceId || s._id || "");
              const subId = String(s.subServiceId || s._id || "");
              if (sId && subId) {
                initialMap[`${sId}_${subId}`] = {
                  serviceId: sId,
                  subServiceId: subId,
                  name: String(s.serviceName || s.subServiceName || s.name || "Service"),
                  price: String(s.serviceCharges || s.hourlyRate || s.price || 25),
                };
              }
            });
            if (Object.keys(initialMap).length > 0) {
              setSelectedMap(initialMap);
            }
          }
        } catch (pErr) {}
      } catch (e: any) {
        console.warn("Failed to load services, falling back to default catalog:", e.message);
        setServices(DEFAULT_CATALOG);
        setExpandedServices(new Set([DEFAULT_CATALOG[0]._id!]));
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

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

  const updatePrice = (serviceId: string, subServiceId: string, priceText: string) => {
    const key = `${serviceId}_${subServiceId}`;
    setSelectedMap((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          price: priceText,
        },
      };
    });
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

      const parentServiceIds = Array.from(
        new Set(selectedItems.map((s) => s.serviceId).filter(Boolean))
      );
      const subServiceIds = selectedItems.map((s) => s.subServiceId).filter(Boolean);

      const selectedServicesPayload = selectedItems.map((item) => ({
        serviceId: item.serviceId,
        subServiceId: item.subServiceId,
        serviceName: item.name,
        serviceCharges: parseFloat(item.price) || 0,
        hourlyRate: parseFloat(item.price) || 0,
        price: parseFloat(item.price) || 0,
      }));

      const payload: any = {
        services: parentServiceIds.length > 0 ? parentServiceIds : subServiceIds,
        serviceId: parentServiceIds[0] || subServiceIds[0] || "",
        subServices: subServiceIds,
        subServiceIds: subServiceIds,
        selectedServices: selectedServicesPayload,
        userType: 2,
      };

      await api.selectServices(payload);

      if (isFromSettings) {
        showAlert("Success", "Your services and pricing have been updated.");
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate("ServicesFor");
        }
      } else {
        navigation.navigate("BankingLanguages");
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
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
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 32, 48) },
        ]}
        showsVerticalScrollIndicator={false}
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
                                    value={item?.price || ""}
                                    onChangeText={(val) =>
                                      updatePrice(serviceId, serviceId, val)
                                    }
                                    placeholder="25.00"
                                    placeholderTextColor="#94A3B8"
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

                        return (
                          <View key={subId} style={styles.subServiceItem}>
                            <TouchableOpacity
                              style={styles.subServiceSelectRow}
                              onPress={() =>
                                toggleSubService(
                                  serviceId,
                                  subId,
                                  sub.subServiceName || "Service",
                                  "30.00"
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
                                    value={item?.price || ""}
                                    onChangeText={(val) => updatePrice(serviceId, subId, val)}
                                    placeholder="30.00"
                                    placeholderTextColor="#94A3B8"
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

      {/* Pinned Bottom Button */}
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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


