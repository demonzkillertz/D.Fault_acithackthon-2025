import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { userService, Favorite, Alert as UserAlert } from '../../services/userService';
import { realtimeService } from '../../services/realtimeService';
import { locationService } from '../../services/locationService';

interface LiveBus {
  id: number;
  plate_number: string;
  route_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  distance?: number;
  eta?: string;
  last_update: string;
}

const UserView = () => {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [alerts, setAlerts] = useState<UserAlert[]>([]);
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingBuses, setTrackingBuses] = useState(new Set<number>());

  const loadUserData = async () => {
    try {
      if (user?.id) {
        const [favoritesData, alertsData] = await Promise.all([
          userService.getUserFavorites(user.id),
          userService.getUserAlerts(user.id)
        ]);
        setFavorites(favoritesData);
        setAlerts(alertsData);
      }
      
      // Get user's current location for distance calculations
      const hasPermission = await locationService.requestPermissions();
      if (hasPermission) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setUserLocation(location);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Real-time bus location updates
  useEffect(() => {
    const handleBusLocationUpdate = (data: any) => {
      const { busId, latitude, longitude, speed, heading } = data;
      
      setLiveBuses(prevBuses => {
        const existingBusIndex = prevBuses.findIndex(bus => bus.id === busId);
        const updatedBus = {
          id: busId,
          plate_number: `Bus-${busId}`,
          route_name: 'Live Route',
          latitude,
          longitude,
          speed,
          heading,
          last_update: new Date().toISOString(),
          distance: userLocation ? locationService.calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            latitude,
            longitude
          ) : undefined
        };

        if (existingBusIndex >= 0) {
          const newBuses = [...prevBuses];
          newBuses[existingBusIndex] = updatedBus;
          return newBuses;
        } else {
          return [...prevBuses, updatedBus];
        }
      });
    };

    const handleEmergencyAlert = (data: any) => {
      Alert.alert(
        'Emergency Alert',
        `Bus ${data.busId}: ${data.message}`,
        [{ text: 'OK' }]
      );
    };

    // Subscribe to emergency alerts
    realtimeService.onEmergencyAlert(handleEmergencyAlert);

    return () => {
      // Cleanup emergency alert listener
      realtimeService.offEmergencyAlert(handleEmergencyAlert);
    };
  }, [userLocation]);

  const trackBus = (busId: number) => {
    const callback = (data: any) => {
      // This callback is now handled in the useEffect above
      console.log('Bus location updated:', data);
    };
    
    realtimeService.trackBus(busId, callback);
    setTrackingBuses(prev => new Set(prev).add(busId));
  };

  const stopTrackingBus = (busId: number) => {
    realtimeService.stopTrackingBus(busId);
    setTrackingBuses(prev => {
      const newSet = new Set(prev);
      newSet.delete(busId);
      return newSet;
    });
    
    // Remove from live buses list
    setLiveBuses(prev => prev.filter(bus => bus.id !== busId));
  };

  useEffect(() => {
    loadUserData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 80 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guruji<Text style={{ fontSize: 14 }}> (गुरुजी)</Text></Text>
        <Image
          source={{ uri: user?.profilePic || 'https://randomuser.me/api/portraits/men/33.jpg' }}
          style={styles.profilePic}
        />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome, {user?.username}!</Text>
          <Text style={styles.subtitleText}>Your Bus Tracking Dashboard</Text>
        </View>

        {/* Live Buses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bus-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Live Bus Tracking</Text>
            <View style={[styles.liveDot, { opacity: liveBuses.length > 0 ? 1 : 0.3 }]} />
          </View>
          {liveBuses.length === 0 ? (
            <View style={styles.noLiveBusesContainer}>
              <Text style={styles.noDataText}>No live buses available</Text>
              <Text style={styles.noDataSubtext}>Buses will appear here when drivers start sharing location</Text>
            </View>
          ) : (
            liveBuses.map((bus) => (
              <View key={bus.id} style={styles.liveBusCard}>
                <View style={styles.busHeader}>
                  <View style={styles.busInfo}>
                    <Text style={styles.busPlate}>{bus.plate_number}</Text>
                    <Text style={styles.busRoute}>{bus.route_name}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.trackButton, { 
                      backgroundColor: trackingBuses.has(bus.id) ? '#e74c3c' : '#27ae60' 
                    }]}
                    onPress={() => trackingBuses.has(bus.id) ? stopTrackingBus(bus.id) : trackBus(bus.id)}
                  >
                    <Text style={styles.trackButtonText}>
                      {trackingBuses.has(bus.id) ? 'Stop' : 'Track'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.busStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.busStatLabel}>Speed</Text>
                    <Text style={styles.busStatValue}>{bus.speed.toFixed(1)} km/h</Text>
                  </View>
                  {bus.distance && (
                    <View style={styles.statBox}>
                      <Text style={styles.busStatLabel}>Distance</Text>
                      <Text style={styles.busStatValue}>{bus.distance.toFixed(1)} km</Text>
                    </View>
                  )}
                  <View style={styles.statBox}>
                    <Text style={styles.busStatLabel}>Last Update</Text>
                    <Text style={styles.busStatValue}>
                      {new Date(bus.last_update).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="heart" size={24} color="#e74c3c" />
            <Text style={styles.statNumber}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="notifications" size={24} color="#f39c12" />
            <Text style={styles.statNumber}>{alerts.length}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        {/* Recent Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
          </View>
          {loading ? (
            <Text style={styles.loadingText}>Loading alerts...</Text>
          ) : alerts.length === 0 ? (
            <Text style={styles.noDataText}>No alerts yet</Text>
          ) : (
            alerts.slice(0, 3).map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <Ionicons 
                    name={alert.type === 'safety' ? 'shield-checkmark' : 'information-circle'} 
                    size={20} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertType}>{alert.type.toUpperCase()}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="location" size={32} color="#e74c3c" />
              <Text style={styles.actionText}>Track Bus</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="star" size={32} color="#f39c12" />
              <Text style={styles.actionText}>Favorites</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 15,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Reduced from 100 to match smaller tab bar
  },
  welcomeContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  alertContent: {
    flex: 1,
  },
  alertType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f39c12',
    marginBottom: 5,
  },
  alertMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  alertTime: {
    fontSize: 12,
    color: '#666',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 25,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
  },
  // Live Buses Styles
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27ae60',
    marginLeft: 8,
  },
  noLiveBusesContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  liveBusCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  busInfo: {
    flex: 1,
  },
  busPlate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  busRoute: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  trackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  busStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  busStatLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  busStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3498db',
  },
});

export default UserView;
