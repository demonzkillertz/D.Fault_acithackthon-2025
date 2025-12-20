import * as Location from 'expo-location';

export class LocationService {
  private static instance: LocationService;
  private watchId: Location.LocationSubscription | null = null;
  private currentLocation: Location.LocationObject | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.log('Foreground location permission denied');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.log('Background location permission denied - foreground only');
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.currentLocation = location;
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startWatching(callback: (location: Location.LocationObject) => void, options?: {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
  }): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      if (this.watchId) {
        this.stopWatching();
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.High,
          timeInterval: options?.timeInterval || 5000, // 5 seconds
          distanceInterval: options?.distanceInterval || 10, // 10 meters
        },
        (location: Location.LocationObject) => {
          this.currentLocation = location;
          callback(location);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location watching:', error);
      return false;
    }
  }

  stopWatching() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  getLastKnownLocation(): Location.LocationObject | null {
    return this.currentLocation;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in kilometers
    return d;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  calculateSpeed(
    prevLocation: { latitude: number; longitude: number; timestamp: number },
    currentLocation: { latitude: number; longitude: number; timestamp: number }
  ): number {
    const distance = this.calculateDistance(
      prevLocation.latitude,
      prevLocation.longitude,
      currentLocation.latitude,
      currentLocation.longitude
    );
    const timeHours = (currentLocation.timestamp - prevLocation.timestamp) / (1000 * 60 * 60);
    return distance / timeHours; // km/h
  }

  calculateHeading(
    prevLocation: { latitude: number; longitude: number },
    currentLocation: { latitude: number; longitude: number }
  ): number {
    const dLon = this.deg2rad(currentLocation.longitude - prevLocation.longitude);
    const lat1 = this.deg2rad(prevLocation.latitude);
    const lat2 = this.deg2rad(currentLocation.latitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180) / Math.PI;
    bearing = (bearing + 360) % 360;

    return Math.round(bearing);
  }
}

export const locationService = LocationService.getInstance();
