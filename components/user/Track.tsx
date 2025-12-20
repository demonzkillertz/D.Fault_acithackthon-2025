import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { realtimeService } from '../../services/realtimeService';
import { locationService } from '../../services/locationService';
import api from '../../services/api';

interface LiveBus {
  id: number;
  plate_number: string;
  route_name: string;
  company_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  distance?: number;
  eta?: string;
  last_update: string;
  driver_name?: string;
  passengers_count?: number;
  next_stop?: string;
}

const Track = () => {
  const { user } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingBuses, setTrackingBuses] = useState(new Set<number>());
  const [loading, setLoading] = useState(true);

  const loadActiveBuses = async () => {
    try {
      const response = await api.get('/api/locations/active');
      if (response.data) {
        const buses = response.data.map((bus: any) => ({
          ...bus,
          distance: userLocation ? locationService.calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            bus.latitude,
            bus.longitude
          ) : undefined,
          eta: userLocation ? calculateETA(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            bus.latitude,
            bus.longitude,
            bus.speed
          ) : undefined
        }));
        setLiveBuses(buses);
      }
    } catch (error) {
      console.error('Error loading active buses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateETA = (userLat: number, userLng: number, busLat: number, busLng: number, speed: number) => {
    if (speed <= 0) return 'N/A';
    
    const distance = locationService.calculateDistance(userLat, userLng, busLat, busLng);
    const timeInHours = distance / speed;
    const timeInMinutes = timeInHours * 60;
    
    if (timeInMinutes < 60) {
      return `${Math.round(timeInMinutes)}m`;
    } else {
      const hours = Math.floor(timeInMinutes / 60);
      const minutes = Math.round(timeInMinutes % 60);
      return `${hours}h ${minutes}m`;
    }
  };

  useEffect(() => {
    // Get user location
    const getUserLocation = async () => {
      const hasPermission = await locationService.requestPermissions();
      if (hasPermission) {
        const location = await locationService.getCurrentLocation();
        if (location) {
          setUserLocation(location);
        }
      }
    };

    getUserLocation();
    loadActiveBuses();
  }, []);

  useEffect(() => {
    // Real-time bus location updates
    const handleBusLocationUpdate = (data: any) => {
      const { busId, latitude, longitude, speed, heading } = data;
      
      setLiveBuses(prevBuses => {
        const existingBusIndex = prevBuses.findIndex(bus => bus.id === busId);
        
        if (existingBusIndex >= 0) {
          const updatedBuses = [...prevBuses];
          updatedBuses[existingBusIndex] = {
            ...updatedBuses[existingBusIndex],
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
            ) : undefined,
            eta: userLocation ? calculateETA(
              userLocation.coords.latitude,
              userLocation.coords.longitude,
              latitude,
              longitude,
              speed
            ) : undefined
          };
          return updatedBuses;
        }
        return prevBuses;
      });
    };

    const handleEmergencyAlert = (data: any) => {
      Alert.alert(
        'Emergency Alert',
        `Bus ${data.busId}: ${data.message}`,
        [{ text: 'OK' }]
      );
    };

    // Subscribe to real-time events
    realtimeService.onEmergencyAlert(handleEmergencyAlert);

    return () => {
      realtimeService.offEmergencyAlert(handleEmergencyAlert);
    };
  }, [userLocation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadActiveBuses();
  };

  const trackBus = (busId: number) => {
    const callback = (data: any) => {
      console.log('Tracking bus location:', data);
    };
    
    realtimeService.trackBus(busId, callback);
    setTrackingBuses(prev => new Set(prev).add(busId));
    
    Alert.alert('Tracking Started', `You will receive real-time updates for this bus`);
  };

  const stopTrackingBus = (busId: number) => {
    realtimeService.stopTrackingBus(busId);
    setTrackingBuses(prev => {
      const newSet = new Set(prev);
      newSet.delete(busId);
      return newSet;
    });
    
    Alert.alert('Tracking Stopped', 'You will no longer receive updates for this bus');
  };

  const filteredBuses = liveBuses.filter(bus =>
    bus.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.route_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bus.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Bus Tracking</Text>
        <Text style={styles.headerSubtitle}>Real-time locations of active buses</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by bus number, route, or company..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Stats Header */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{liveBuses.length}</Text>
          <Text style={styles.statLabel}>Live Buses</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{trackingBuses.size}</Text>
          <Text style={styles.statLabel}>Tracking</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredBuses.length}</Text>
          <Text style={styles.statLabel}>Results</Text>
        </View>
      </View>

      {/* Bus List */}
      <ScrollView 
        style={styles.busList}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading live buses...</Text>
          </View>
        ) : filteredBuses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bus-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No live buses found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Buses will appear when drivers start trips'}
            </Text>
          </View>
        ) : (
          filteredBuses.map((bus) => (
            <View key={bus.id} style={styles.busCard}>
              <View style={styles.busHeader}>
                <View style={styles.busMainInfo}>
                  <Text style={styles.busPlate}>{bus.plate_number}</Text>
                  <Text style={styles.busRoute}>{bus.route_name}</Text>
                  <Text style={styles.busCompany}>{bus.company_name}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.trackButton, { 
                    backgroundColor: trackingBuses.has(bus.id) ? '#e74c3c' : '#27ae60' 
                  }]}
                  onPress={() => trackingBuses.has(bus.id) ? stopTrackingBus(bus.id) : trackBus(bus.id)}
                >
                  <Ionicons 
                    name={trackingBuses.has(bus.id) ? 'stop' : 'locate'} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.trackButtonText}>
                    {trackingBuses.has(bus.id) ? 'Stop' : 'Track'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.busStats}>
                <View style={styles.statBox}>
                  <Ionicons name="speedometer-outline" size={16} color="#3498db" />
                  <Text style={styles.statValue}>{bus.speed.toFixed(1)} km/h</Text>
                  <Text style={styles.statLabel}>Speed</Text>
                </View>
                
                {bus.distance && (
                  <View style={styles.statBox}>
                    <Ionicons name="location-outline" size={16} color="#27ae60" />
                    <Text style={styles.statValue}>{bus.distance.toFixed(1)} km</Text>
                    <Text style={styles.statLabel}>Distance</Text>
                  </View>
                )}
                
                {bus.eta && (
                  <View style={styles.statBox}>
                    <Ionicons name="time-outline" size={16} color="#f39c12" />
                    <Text style={styles.statValue}>{bus.eta}</Text>
                    <Text style={styles.statLabel}>ETA</Text>
                  </View>
                )}
              </View>

              <View style={styles.busFooter}>
                <Text style={styles.lastUpdate}>
                  Last update: {new Date(bus.last_update).toLocaleTimeString()}
                </Text>
                {bus.driver_name && (
                  <Text style={styles.driverInfo}>Driver: {bus.driver_name}</Text>
                )}
              </View>

              {trackingBuses.has(bus.id) && (
                <View style={styles.trackingIndicator}>
                  <View style={styles.trackingDot} />
                  <Text style={styles.trackingText}>Receiving live updates</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  busList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  busCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  busMainInfo: {
    flex: 1,
  },
  busPlate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  busRoute: {
    fontSize: 16,
    color: '#333',
    marginBottom: 3,
  },
  busCompany: {
    fontSize: 14,
    color: '#666',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  busStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginTop: 5,
  },
  busFooter: {
    marginTop: 10,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  driverInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  trackingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#27ae60',
    marginRight: 6,
  },
  trackingText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
  },
});

export default Track;