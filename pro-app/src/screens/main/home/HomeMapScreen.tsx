import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { HomeTabParamList } from "../../../navigation/types";
import { Header } from "../../../components/Header";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { LoadingOverlay } from "../../../components/LoadingOverlay";
import { Avatar } from "../../../components/Avatar";
import { EmptyState } from "../../../components/EmptyState";
import { api } from "../../../services/api";
import { showAlert } from "../../../utils/helpers";
import { Job } from "../../../types/models";
import { JobStatus } from "../../../constants";
import { Colors } from "../../../theme/colors";
import { FontSizes, FontWeights } from "../../../theme/fonts";
import { BorderRadius, Spacing } from "../../../theme/spacing";
import { useUser } from "../../../context/UserContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Props = NativeStackScreenProps<HomeTabParamList, "HomeMap">;

export function HomeMapScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { user, updateUser } = useUser();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);
  const collapsedHeight = 54 + bottomInset;
  const expandedHeight = Math.min(SCREEN_HEIGHT * 0.55, 460) + bottomInset;

  const mapRef = useRef<MapView | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const sheetHeightAnim = useRef(new Animated.Value(collapsedHeight)).current;

  // Tools & Equipment bottom sheet state
  const [toolsModalVisible, setToolsModalVisible] = useState(false);
  const [toolsList, setToolsList] = useState<string[]>([]);
  const [newToolInput, setNewToolInput] = useState("");
  const [savingTools, setSavingTools] = useState(false);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    user.lat && user.long ? { latitude: user.lat, longitude: user.long } : null
  );

  const [region, setRegion] = useState({
    latitude: user.lat || 37.7749,
    longitude: user.long || -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusRes, jobsRes, unhandled, unrated, toolsRes, profileRes] =
        await Promise.all([
          api.getSPStatus().catch(() => ({ isSpOnline: false })),
          api.getJobs(0, 0, 20).catch(() => ({ jobList: [] })),
          api.getUnhandledJob().catch(() => ({ isUnhandledJobExist: false })),
          api.getUnratedJob().catch(() => null),
          api.fetchTools().catch(() => ({ tools: [] })),
          api.getSPProfile().catch(() => null),
        ]);

      setOnline(statusRes?.isSpOnline ?? false);
      setJobs(jobsRes?.jobList ?? []);

      const isApproved =
        profileRes?.isVerifiedByAdmin ??
        (profileRes as any)?.isApproved ??
        statusRes?.isSpOnline ??
        user.isApproved;

      if (typeof isApproved === "boolean") {
        updateUser({ isApproved });
      }

      const fetchedTools = toolsRes?.tools ?? [];
      setToolsList(fetchedTools);
      if (fetchedTools.length === 0) {
        // iOS parity: Prompt tools & equipment if provider has none added
        setToolsModalVisible(true);
      }

      if (unhandled?.isUnhandledJobExist) {
        navigation.navigate("JobRequest", { job: unhandled });
      } else if (unrated?.jobId && unrated?.userProfileId) {
        navigation.navigate("RateUser", {
          jobId: unrated.jobId,
          userProfileId: unrated.userProfileId,
          name: unrated.name,
          image: unrated.profileImage,
        });
      }
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const lastLoc = await Location.getLastKnownPositionAsync();
          if (lastLoc) {
            const coords = {
              latitude: lastLoc.coords.latitude,
              longitude: lastLoc.coords.longitude,
            };
            setUserLocation(coords);
            const initialRegion = {
              ...coords,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            };
            setRegion(initialRegion);
            mapRef.current?.animateToRegion(initialRegion, 300);
          }
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserLocation(coords);
          const initialRegion = {
            ...coords,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          };
          setRegion(initialRegion);
          mapRef.current?.animateToRegion(initialRegion, 500);
        } else if (user.lat && user.long) {
          const coords = { latitude: user.lat, longitude: user.long };
          setUserLocation(coords);
          setRegion({
            ...coords,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } catch (err) {
        console.warn("Location error:", err);
        if (user.lat && user.long) {
          const coords = { latitude: user.lat, longitude: user.long };
          setUserLocation(coords);
          setRegion({
            ...coords,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    })();
  }, []);

  const handleRecenterLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert(
          "Permission Denied",
          "Location permission is needed to find your location."
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserLocation(coords);
      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        600
      );
    } catch (e: any) {
      if (userLocation) {
        mapRef.current?.animateToRegion(
          {
            ...userLocation,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          600
        );
      } else {
        showAlert("Error", "Could not determine current location.");
      }
    }
  };

  const toggleScheduleExpand = () => {
    const toValue = isScheduleExpanded ? collapsedHeight : expandedHeight;
    Animated.spring(sheetHeightAnim, {
      toValue,
      useNativeDriver: false,
      friction: 8,
    }).start();
    setIsScheduleExpanded(!isScheduleExpanded);
  };

  const toggleOnline = async (value: boolean) => {
    try {
      await api.updateStatus(value ? 1 : 0);
      setOnline(value);
    } catch (e: any) {
      showAlert("Error", e.message || "Failed to update status");
    }
  };

  const handleAddTool = () => {
    const trimmed = newToolInput.trim();
    if (!trimmed) {
      showAlert("Required", "Please enter a tool or equipment name.");
      return;
    }
    setToolsList((prev) => [...prev, trimmed]);
    setNewToolInput("");
  };

  const handleRemoveTool = (index: number) => {
    setToolsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTools = async () => {
    if (toolsList.length === 0) {
      showAlert("Required", "Please add at least one tool or piece of equipment.");
      return;
    }
    try {
      setSavingTools(true);
      await api.updateTools(toolsList);
      await updateUser({ tools: toolsList });
      setToolsModalVisible(false);
      showAlert("Success", "Tools & Equipment updated successfully!");
    } catch (e: any) {
      showAlert("Error", e.message);
    } finally {
      setSavingTools(false);
    }
  };

  const renderJob = ({ item }: { item: Job }) => {
    const statusText = JobStatus[item.spJobStatus] || "Upcoming";
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate("JobDetails", {
            jobId: item.id,
            status: item.spJobStatus,
          })
        }
      >
        <Card style={styles.jobCard}>
          <View style={styles.row}>
            <Avatar uri={item.userProfileImage} name={item.userName} size={46} />
            <View style={styles.jobInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.userName || "Customer"}
              </Text>
              <Text style={styles.service} numberOfLines={1}>
                {item.serviceName}
              </Text>
              <View style={styles.addressRow}>
                <Ionicons
                  name="location-outline"
                  size={13}
                  color={Colors.DescriptionTextDark}
                  style={{ marginRight: 2 }}
                />
                <Text style={styles.address} numberOfLines={1}>
                  {item.primaryAddress || "Location provided upon booking"}
                </Text>
              </View>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{statusText}</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Appointments"
        onMenuPress={() => (navigation.getParent() as any)?.openDrawer()}
        right={
          <View style={styles.headerToggleWrap}>
            <View
              style={[
                styles.headerStatusDot,
                { backgroundColor: online ? "#22C55E" : "#94A3B8" },
              ]}
            />
            <Text
              style={[
                styles.headerStatusText,
                { color: online ? "#16A34A" : "#64748B" },
              ]}
            >
              {online ? "Online" : "Offline"}
            </Text>
            <Switch
              value={online}
              onValueChange={toggleOnline}
              trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
              thumbColor={online ? "#16A34A" : "#FFFFFF"}
              style={{
                transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
                marginLeft: 2,
              }}
            />
          </View>
        }
      />

      {/* Map with Floating Overlays */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          region={region}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          onRegionChangeComplete={setRegion}
        >
          {userLocation && (
            <Marker
              coordinate={userLocation}
              title="My Location"
              description={user.name || "Provider"}
              pinColor={Colors.ButtonPrimaryColor}
            />
          )}
          {jobs.map(
            (job) =>
              job.latitude &&
              job.longitude && (
                <Marker
                  key={job.id}
                  coordinate={{
                    latitude: job.latitude,
                    longitude: job.longitude,
                  }}
                  title={job.serviceName}
                />
              )
          )}
        </MapView>

        {/* Floating Admin Review Banner */}
        {!user.isApproved && (
          <View style={styles.floatingReviewCard}>
            <View style={styles.floatingReviewIconWrap}>
              <Ionicons name="time" size={16} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <Text style={styles.floatingReviewTitle}>Profile In Review</Text>
              <Text style={styles.floatingReviewSubtitle}>
                Your profile is pending admin approval
              </Text>
            </View>
            <View style={styles.floatingReviewBadge}>
              <Text style={styles.floatingReviewBadgeText}>Pending</Text>
            </View>
          </View>
        )}

        {/* Floating Center Location Button */}
        <TouchableOpacity
          style={[styles.floatingGpsFab, { bottom: collapsedHeight + 78 }]}
          onPress={handleRecenterLocation}
          activeOpacity={0.85}
        >
          <Ionicons name="locate" size={18} color={Colors.ButtonPrimaryColor} />
        </TouchableOpacity>

        {/* Floating Tools & Equipment Button */}
        <TouchableOpacity
          style={[styles.floatingToolsFab, { bottom: collapsedHeight + 30 }]}
          onPress={() => setToolsModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="construct" size={15} color={Colors.ButtonPrimaryColor} />
          <Text style={styles.floatingToolsFabText}>Tools</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding Upcoming Schedule Bottom Sheet */}
      <Animated.View
        style={[
          styles.slidingSheet,
          {
            height: sheetHeightAnim,
            paddingBottom: bottomInset,
          },
        ]}
      >
        {/* Drag / Toggle Handle Bar */}
        <TouchableOpacity
          style={styles.handleContainer}
          onPress={toggleScheduleExpand}
          activeOpacity={0.9}
        >
          <View style={styles.handleBar} />
          <View style={styles.listHeader}>
            <View style={styles.upcomingTitleRow}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={Colors.ButtonPrimaryColor}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.sectionTitle}>
                Upcoming ({jobs.length})
              </Text>
            </View>

            <View style={styles.toggleIndicator}>
              <Text style={styles.toggleText}>
                {isScheduleExpanded ? "Slide Down" : "Slide Up"}
              </Text>
              <Ionicons
                name={isScheduleExpanded ? "chevron-down" : "chevron-up"}
                size={14}
                color={Colors.ButtonPrimaryColor}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Schedule List Content */}
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyTitle}>
                You have no available appointments
              </Text>
              <Text style={styles.emptySub}>
                New bookings and scheduled requests will appear here.
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* Tools & Equipment Bottom Sheet Modal */}
      <Modal
        visible={toolsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setToolsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView style={styles.toolsModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Tools & Equipment</Text>
                <Text style={styles.modalSubtitle}>
                  List the tools you use for your services
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setToolsModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={Colors.TitleColor} />
              </TouchableOpacity>
            </View>

            {/* Add Tool Input Form */}
            <View style={styles.addToolRow}>
              <TextInput
                placeholder="Enter tool or equipment name"
                placeholderTextColor={Colors.PlaceholderInactive}
                value={newToolInput}
                onChangeText={setNewToolInput}
                onSubmitEditing={handleAddTool}
                style={styles.toolInput}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.addToolBtn}
                onPress={handleAddTool}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addToolBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* List of Tools */}
            <ScrollView
              style={styles.toolsListScroll}
              contentContainerStyle={styles.toolsListContent}
              showsVerticalScrollIndicator={true}
            >
              {toolsList.length === 0 ? (
                <View style={styles.emptyToolsBox}>
                  <Ionicons name="construct-outline" size={40} color="#CBD5E1" />
                  <Text style={styles.emptyToolsText}>
                    No tools added yet. Add your shears, clippers, dryers, etc.
                  </Text>
                </View>
              ) : (
                toolsList.map((tool, idx) => (
                  <View key={`${tool}-${idx}`} style={styles.toolItemRow}>
                    <View style={styles.toolItemLeft}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={Colors.ButtonPrimaryColor}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.toolItemName}>{tool}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveTool(idx)}
                      style={styles.toolDeleteBtn}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Save Button */}
            <View style={styles.modalFooter}>
              <Button
                title="Save Tools & Equipment"
                onPress={handleSaveTools}
                loading={savingTools}
                style={styles.saveToolsBtn}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.ScreenBG },
  headerToggleWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 4,
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingReviewCard: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
    shadowColor: "#D97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  floatingReviewIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingReviewTitle: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: "#92400E",
  },
  floatingReviewSubtitle: {
    fontSize: 10,
    color: "#B45309",
    marginTop: 1,
  },
  floatingReviewBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  floatingReviewBadgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: "#D97706",
  },
  floatingGpsFab: {
    position: "absolute",
    right: 14,
    bottom: 122,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  floatingToolsFab: {
    position: "absolute",
    right: 14,
    bottom: 74,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    gap: 4,
    zIndex: 10,
  },
  floatingToolsFabText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
  },
  slidingSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.BorderColor,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden",
  },
  handleContainer: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: Spacing.base,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    backgroundColor: "#FFFFFF",
    height: 52,
    justifyContent: "center",
  },
  handleBar: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 4,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upcomingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  toggleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: FontWeights.semibold,
    color: Colors.ButtonPrimaryColor,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  emptyTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
    marginTop: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 4,
    textAlign: "center",
  },
  jobCard: {
    marginVertical: 5,
    padding: Spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center" },
  jobInfo: { flex: 1, marginHorizontal: 10 },
  userName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  service: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
    color: Colors.ButtonPrimaryColor,
    marginTop: 1,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  address: {
    fontSize: 11,
    color: Colors.DescriptionTextDark,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.ButtonPrimaryColor,
    textTransform: "uppercase",
  },
  // Tools Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  toolsModalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: "80%",
    paddingBottom: Spacing.base,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.TitleColor,
  },
  modalSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  addToolRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: 8,
  },
  toolInput: {
    flex: 1,
    height: 46,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.sm,
    color: Colors.TitleColor,
  },
  addToolBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.ButtonPrimaryColor,
    height: 46,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  addToolBtnText: {
    color: "#FFFFFF",
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  toolsListScroll: {
    maxHeight: 280,
    paddingHorizontal: Spacing.xl,
  },
  toolsListContent: {
    paddingBottom: Spacing.md,
  },
  emptyToolsBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
  },
  emptyToolsText: {
    fontSize: FontSizes.xs,
    color: Colors.DescriptionTextDark,
    textAlign: "center",
    marginTop: 8,
  },
  toolItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginBottom: 8,
  },
  toolItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toolItemName: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.TitleColor,
    flex: 1,
  },
  toolDeleteBtn: {
    padding: 6,
  },
  modalFooter: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  saveToolsBtn: {
    backgroundColor: Colors.ButtonPrimaryColor,
    borderRadius: BorderRadius.lg,
    minHeight: 48,
  },
});


