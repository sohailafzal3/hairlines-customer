import { io, Socket } from "socket.io-client";
import { SOCKET_URL, NotificationType, SocketEvents } from "../constants";
import { loadCookies, cookieHeader } from "./cookies";

export type SocketEventCallback = (data: any) => void;

class SocketManager {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<SocketEventCallback>> = new Map();

  async connect(userId: string) {
    if (this.socket?.connected) return;

    const cookies = await loadCookies();
    const cookieString = cookieHeader(cookies);

    this.socket = io(SOCKET_URL, {
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 5000,
      transports: ["websocket"],
      extraHeaders: cookieString ? { Cookie: cookieString } : undefined,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    this.socket.on("connect_error", (err) => {
      console.warn("Socket connect_error", err.message);
    });

    Object.values(NotificationType).forEach((event) => {
      this.socket?.on(event, (data) => this.emit(event, data));
    });

    this.socket.on(SocketEvents.locationUpdate, (data) =>
      this.emit(SocketEvents.locationUpdate, data)
    );
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  on(event: string, callback: SocketEventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: SocketEventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  sendLocationUpdate(
    spProfileId: string,
    coordinates: { latitude: number; longitude: number }[]
  ) {
    this.socket?.emit(SocketEvents.locationUpdate, {
      spProfileId,
      coordinates,
    });
  }

  sendMessage(body: string, jobId: string, senderUserId: string) {
    this.socket?.emit(NotificationType.messageSendingKey, {
      body,
      jobId,
      senderUserType: "sp",
      receiverUserType: "user",
      senderUserId,
    });
  }

  markMessageAsRead(messageId: string) {
    this.socket?.emit(SocketEvents.markAsRead, { id: messageId });
  }

  markMessageDelivered(messageId: string) {
    this.socket?.emit(SocketEvents.messageDelivered, { id: messageId });
  }

  readNotification(notificationId: string) {
    this.socket?.emit(SocketEvents.readNotification, { notificationId });
  }

  startRideTracking(packageId: string) {
    this.socket?.emit(SocketEvents.startRideTracking, { packageId });
  }

  stopRideTracking(packageId: string) {
    this.socket?.emit(SocketEvents.stopRideTracking, { packageId });
  }
}

export const socketManager = new SocketManager();
