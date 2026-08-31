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

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== "granted") return false;

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  return bg === "granted";
}

export async function startLocationUpdates(userId: string) {
  spProfileId = userId;
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
