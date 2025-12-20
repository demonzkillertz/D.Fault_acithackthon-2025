import { io, Socket } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.138:5000';

class RealtimeService {
  private socket: Socket | null = null;
  private locationUpdateCallbacks: Map<number, (location: any) => void> = new Map();
  private emergencyCallbacks: Set<(alert: any) => void> = new Set();

  connect(userId: number, userType: 'user' | 'driver' | 'company') {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(API_URL);

    this.socket.on('connect', () => {
      console.log('Connected to real-time server');
      
      // Join appropriate room based on user type
      if (userType === 'driver') {
        this.socket?.emit('driver-join', { driverId: userId });
      } else {
        this.socket?.emit('user-join', { userId });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from real-time server');
    });

    this.socket.on('bus-location-update', (data) => {
      const callback = this.locationUpdateCallbacks.get(data.busId);
      if (callback) {
        callback(data);
      }
    });

    this.socket.on('emergency-alert', (data) => {
      this.emergencyCallbacks.forEach(callback => callback(data));
    });

    this.socket.on('trip-started', (data) => {
      console.log('Trip started:', data);
    });

    this.socket.on('trip-ended', (data) => {
      console.log('Trip ended:', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.locationUpdateCallbacks.clear();
    this.emergencyCallbacks.clear();
  }

  // Driver functions
  shareLocation(busId: number, latitude: number, longitude: number, speed?: number, heading?: number) {
    if (this.socket?.connected) {
      this.socket.emit('driver-location', {
        busId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0
      });
    }
  }

  startTracking(busId: number, routeId?: number) {
    if (this.socket?.connected) {
      this.socket.emit('start-tracking', { busId, routeId });
    }
  }

  stopTracking(busId: number) {
    if (this.socket?.connected) {
      this.socket.emit('stop-tracking', { busId });
    }
  }

  sendEmergencyAlert(busId: number, message: string, type: string = 'emergency') {
    if (this.socket?.connected) {
      this.socket.emit('emergency-alert', { busId, message, type });
    }
  }

  // User functions
  trackBus(busId: number, callback: (location: any) => void) {
    if (this.socket?.connected) {
      this.socket.emit('track-bus', { busId });
      this.locationUpdateCallbacks.set(busId, callback);
    }
  }

  stopTrackingBus(busId: number) {
    this.locationUpdateCallbacks.delete(busId);
  }

  onEmergencyAlert(callback: (alert: any) => void) {
    this.emergencyCallbacks.add(callback);
  }

  offEmergencyAlert(callback: (alert: any) => void) {
    this.emergencyCallbacks.delete(callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
