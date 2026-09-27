import { Platform } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { socketManager } from "./socket";

export const LOCATION_TASK_NAME = "hairlines-location-task";

interface LocationUpdate {
  latitude: number;
  longitude: number;
}

let coordinateBuffer: LocationUpdate[] = [];
let spProfileId: string | null = null;
let webWatchId: number | null = null;

if (Platform.OS !== "web") {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
      console.warn("Location task error", error);
      return;
    }
    if (data) {
      const { locations } = data as { locations: Location.LocationObject[] };
      locations.forEach((loc) => {
        coordinateBuffer.push({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      });
      if (spProfileId) {
        socketManager.sendLocationUpdate(spProfileId, [...coordinateBuffer]);
        coordinateBuffer = [];
      }
    }
  });
}

export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== "granted") return false;

    if (Platform.OS === "web") return true;

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    return bg === "granted";
  } catch (err) {
    console.warn("Error requesting location permissions:", err);
    return false;
  }
}

export async function startLocationUpdates(userId: string) {
  spProfileId = userId;

  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      if (webWatchId !== null) return;
      webWatchId = navigator.geolocation.watchPosition(
        (pos) => {
          pushCoordinate(pos.coords.latitude, pos.coords.longitude);
          flushCoordinates(userId);
        },
        (err) => console.warn("Web geolocation error", err),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    }
    return;
  }

  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME
  );
  if (hasStarted) return;

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000,
    distanceInterval: 50,
    foregroundService: {
      notificationTitle: "Hairlines Pro",
      notificationBody: "Tracking your location while on a job.",
    },
  });
}

export async function stopLocationUpdates() {
  if (Platform.OS === "web") {
    if (typeof navigator !== "undefined" && navigator.geolocation && webWatchId !== null) {
      navigator.geolocation.clearWatch(webWatchId);
      webWatchId = null;
    }
    return;
  }

  const hasStarted = await Location.hasStartedLocationUpdatesAsync(
    LOCATION_TASK_NAME
  );
  if (hasStarted) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}

export function pushCoordinate(lat: number, lng: number) {
  coordinateBuffer.push({ latitude: lat, longitude: lng });
}

export function flushCoordinates(userId: string) {
  if (coordinateBuffer.length === 0) return;
  socketManager.sendLocationUpdate(userId, [...coordinateBuffer]);
  coordinateBuffer = [];
}
