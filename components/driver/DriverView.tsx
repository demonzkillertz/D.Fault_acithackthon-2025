import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, RefreshControl, Alert, Switch, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { realtimeService } from '../../services/realtimeService';
import { locationService } from '../../services/locationService';
import api from '../../services/api';

// Driver-specific interfaces
interface DriverBus {
  id: number;
  plate_number: string;
  model: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'retired';
  route_name?: string;
  company_name?: string;
  start_location?: string;
  end_location?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  last_location_update?: string;
}

interface TripStatus {
  is_active: boolean;
  current_route?: string;
  passengers_count: number;
  next_stop?: string;
  eta?: string;
}

interface DriverAlert {
  id: number;
  type: 'route_change' | 'maintenance' | 'emergency' | 'general';
  message: string;
  timestamp: string;
  is_read: boolean;
}

const DriverView = () => {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [assignedBus, setAssignedBus] = useState<DriverBus | null>(null);
  const [tripStatus, setTripStatus] = useState<TripStatus>({
    is_active: false,
    passengers_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationSharing, setLocationSharing] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [alerts, setAlerts] = useState<DriverAlert[]>([]);

  const loadDriverData = async () => {
    try {
      const response = await api.get('/api/driver/bus');
      if (response.data) {
        setAssignedBus(response.data);
        setTripStatus({
          is_active: response.data.status === 'active',
          current_route: response.data.route_name,
          passengers_count: 0,
          next_stop: 'Loading...',
          eta: 'Calculating...'
        });
      }

      // Load alerts (optional - may not exist yet)
      try {
        const alertsResponse = await api.get('/api/driver/alerts');
        if (alertsResponse.data) {
          setAlerts(alertsResponse.data);
        }
      } catch (alertError) {
        // Alerts endpoint may not exist yet, ignore error
        console.log('Alerts endpoint not available yet');
      }
    } catch (error: any) {
      console.error('Error loading driver data:', error);
      if (error.response?.status === 404) {
        Alert.alert('No Bus Assigned', 'You dont have a bus assigned yet. Contact your company admin.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDriverData();
  }, [user?.id]);

  useEffect(() => {
    // Initialize location tracking if already enabled
    if (locationSharing && assignedBus) {
      startLocationTracking();
    }
    
    return () => {
      locationService.stopWatching();
    };
  }, [locationSharing, assignedBus]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDriverData();
  };

  const startLocationTracking = async () => {
    if (!assignedBus) {
      Alert.alert('Error', 'No bus assigned');
      return;
    }

    const hasPermission = await locationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Location permission is required for tracking');
      setLocationSharing(false);
      return;
    }

    setIsTracking(true);
    
    const started = await locationService.startWatching(
      (location) => {
        setCurrentLocation(location);
        
        // Share location via Socket.IO
        realtimeService.shareLocation(
          assignedBus.id,
          location.coords.latitude,
          location.coords.longitude,
          location.coords.speed ? location.coords.speed * 3.6 : 0,
          location.coords.heading || 0
        );

        // Also save to backend
        api.post('/api/driver/location', {
          busId: assignedBus.id,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed ? location.coords.speed * 3.6 : 0,
          heading: location.coords.heading || 0
        }).catch(err => console.error('Error saving location:', err));
      },
      {
        timeInterval: 5000,
        distanceInterval: 10
      }
    );

    if (!started) {
      Alert.alert('Error', 'Failed to start location tracking');
      setLocationSharing(false);
      setIsTracking(false);
    }
  };

  const stopLocationTracking = () => {
    locationService.stopWatching();
    setIsTracking(false);
    setCurrentLocation(null);
  };

  const handleLocationSharingToggle = (enabled: boolean) => {
    setLocationSharing(enabled);
    if (enabled) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  };

  const handleStartTrip = () => {
    if (!assignedBus) {
      Alert.alert('Error', 'No bus assigned');
      return;
    }

    Alert.alert(
      'Start Trip',
      'Are you ready to start your route?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start', 
          onPress: async () => {
            try {
              await api.post('/api/driver/trip/start', {
                busId: assignedBus.id
              });
              
              setTripStatus(prev => ({ ...prev, is_active: true }));
              setLocationSharing(true);
              Alert.alert('Success', 'Trip started successfully!');
            } catch (error) {
              console.error('Error starting trip:', error);
              Alert.alert('Error', 'Failed to start trip');
            }
          }
        }
      ]
    );
  };

  const handleEndTrip = () => {
    Alert.alert(
      'End Trip',
      'Are you sure you want to end this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Trip', 
          onPress: async () => {
            try {
              await api.post('/api/driver/trip/end', {
                busId: assignedBus?.id
              });
              
              setTripStatus(prev => ({ ...prev, is_active: false, passengers_count: 0 }));
              setLocationSharing(false);
              Alert.alert('Success', 'Trip ended successfully!');
            } catch (error) {
              console.error('Error ending trip:', error);
              Alert.alert('Error', 'Failed to end trip');
            }
          }
        }
      ]
    );
  };

  const handleEmergency = () => {
    if (!assignedBus) {
      Alert.alert('Error', 'No bus assigned');
      return;
    }

    Alert.alert(
      'Emergency Alert',
      'This will send an emergency notification to your company and authorities.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send Alert', 
          onPress: async () => {
            try {
              await api.post('/api/driver/emergency', {
                busId: assignedBus.id,
                message: 'Emergency alert from driver',
                type: 'emergency'
              });
              
              // Also send via Socket.IO
              realtimeService.sendEmergencyAlert(assignedBus.id, 'Emergency alert from driver');
              
              Alert.alert('Emergency Alert Sent', 'Help is on the way!');
            } catch (error) {
              console.error('Error sending emergency alert:', error);
              Alert.alert('Error', 'Failed to send emergency alert');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            stopLocationTracking();
            if (logout) {
              await logout();
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 80 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Ionicons name="menu" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guruji<Text style={{ fontSize: 14 }}> (गुरुजी)</Text></Text>
        <Image
          source={{ uri: user?.profilePic || 'https://randomuser.me/api/portraits/men/45.jpg' }}
          style={styles.profilePic}
        />
      </View>

      {/* Menu Dropdown */}
      {showMenu && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={20} color="#333" />
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={20} color="#333" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
            <Text style={[styles.menuText, { color: '#e74c3c' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

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
          <Text style={styles.subtitleText}>Driver Dashboard</Text>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: tripStatus.is_active ? '#27ae60' : '#e74c3c' }]} />
            <Text style={styles.statusText}>
              {tripStatus.is_active ? 'On Duty' : 'Off Duty'}
            </Text>
          </View>
        </View>

        {/* Trip Status Card */}
        {tripStatus.is_active && (
          <View style={styles.tripStatusCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="bus" size={24} color="#3498db" />
              <Text style={styles.cardTitle}>Current Trip</Text>
            </View>
            <View style={styles.tripDetails}>
              <Text style={styles.routeName}>{tripStatus.current_route}</Text>
              <View style={styles.tripStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{tripStatus.passengers_count}</Text>
                  <Text style={styles.statLabel}>Passengers</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{tripStatus.next_stop}</Text>
                  <Text style={styles.statLabel}>Next Stop</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{tripStatus.eta}</Text>
                  <Text style={styles.statLabel}>ETA</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bus Information */}
        <View style={styles.busInfoCard}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="directions-bus" size={24} color="#2c3e50" />
            <Text style={styles.cardTitle}>My Bus</Text>
          </View>
          {loading ? (
            <Text style={styles.loadingText}>Loading bus information...</Text>
          ) : assignedBus ? (
            <View style={styles.busDetails}>
              <Text style={styles.plateNumber}>{assignedBus.plate_number}</Text>
              <Text style={styles.busModel}>{assignedBus.model}</Text>
              <Text style={styles.companyName}>{assignedBus.company_name}</Text>
              <View style={styles.busStats}>
                <View style={styles.statBadge}>
                  <Text style={styles.statBadgeText}>Capacity: {assignedBus.capacity}</Text>
                </View>
                <View style={[styles.statusBadge, { 
                  backgroundColor: assignedBus.status === 'active' ? '#27ae60' : 
                                 assignedBus.status === 'maintenance' ? '#f39c12' : '#e74c3c' 
                }]}>
                  <Text style={styles.statusBadgeText}>{assignedBus.status.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>No bus assigned</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {!tripStatus.is_active ? (
              <TouchableOpacity style={[styles.actionCard, styles.startTripCard]} onPress={handleStartTrip}>
                <Ionicons name="play" size={32} color="#fff" />
                <Text style={[styles.actionText, { color: '#fff' }]}>Start Trip</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.actionCard, styles.endTripCard]} onPress={handleEndTrip}>
                <Ionicons name="stop" size={32} color="#fff" />
                <Text style={[styles.actionText, { color: '#fff' }]}>End Trip</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionCard} onPress={() => setShowLocationModal(true)}>
              <Ionicons name="location" size={32} color="#3498db" />
              <Text style={styles.actionText}>Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="map" size={32} color="#27ae60" />
              <Text style={styles.actionText}>View Route</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionCard, styles.emergencyCard]} onPress={handleEmergency}>
              <Ionicons name="warning" size={32} color="#fff" />
              <Text style={[styles.actionText, { color: '#fff' }]}>Emergency</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Location Sharing Toggle */}
        <View style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="location-outline" size={20} color="#333" />
              <Text style={styles.settingLabel}>Share Location</Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={handleLocationSharingToggle}
              trackColor={{ false: '#767577', true: '#3498db' }}
              thumbColor={locationSharing ? '#fff' : '#f4f3f4'}
            />
          </View>
          {isTracking && (
            <View style={styles.trackingIndicator}>
              <View style={styles.trackingDot} />
              <Text style={styles.trackingText}>Real-time location sharing active</Text>
            </View>
          )}
        </View>

        {/* Current Location Display */}
        {currentLocation && (
          <View style={styles.locationCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="location" size={24} color="#27ae60" />
              <Text style={styles.cardTitle}>Live Location</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationText}>Latitude: {currentLocation.coords.latitude.toFixed(6)}</Text>
              <Text style={styles.locationText}>Longitude: {currentLocation.coords.longitude.toFixed(6)}</Text>
              <Text style={styles.locationText}>
                Speed: {currentLocation.coords.speed ? (currentLocation.coords.speed * 3.6).toFixed(1) : '0'} km/h
              </Text>
              <Text style={styles.locationText}>
                Last Updated: {new Date(currentLocation.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Recent Alerts */}
        <View style={styles.alertsContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="notifications-outline" size={20} color="#333" />
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
          </View>
          {alerts.length === 0 ? (
            <Text style={styles.noDataText}>No alerts</Text>
          ) : (
            alerts.slice(0, 3).map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={[styles.alertIcon, { 
                  backgroundColor: alert.type === 'emergency' ? '#e74c3c' : 
                                 alert.type === 'maintenance' ? '#f39c12' : '#3498db' 
                }]}>
                  <Ionicons 
                    name={
                      alert.type === 'emergency' ? 'warning' :
                      alert.type === 'maintenance' ? 'build' :
                      alert.type === 'route_change' ? 'map' : 'information-circle'
                    } 
                    size={20} 
                    color="#fff" 
                  />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertType}>{alert.type.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>{new Date(alert.timestamp).toLocaleString()}</Text>
                </View>
                {!alert.is_read && <View style={styles.unreadBadge} />}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Current Location</Text>
            {currentLocation ? (
              <View style={styles.locationInfo}>
                <Text style={styles.locationText}>Latitude: {currentLocation.coords.latitude.toFixed(6)}</Text>
                <Text style={styles.locationText}>Longitude: {currentLocation.coords.longitude.toFixed(6)}</Text>
                <Text style={styles.locationText}>
                  Speed: {currentLocation.coords.speed ? (currentLocation.coords.speed * 3.6).toFixed(1) : '0'} km/h
                </Text>
                <Text style={styles.locationText}>
                  Accuracy: {currentLocation.coords.accuracy?.toFixed(1) || 'N/A'} meters
                </Text>
                <Text style={styles.locationText}>
                  Last Updated: {new Date(currentLocation.timestamp).toLocaleString()}
                </Text>
              </View>
            ) : (
              <Text style={styles.noDataText}>Location not available</Text>
            )}
            <TouchableOpacity 
              style={styles.modalCloseBtn} 
              onPress={() => setShowLocationModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  menuDropdown: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 5,
    zIndex: 1000,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
    marginBottom: 15,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  tripStatusCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  tripDetails: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  tripStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  busInfoCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  busDetails: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  plateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  busModel: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  busStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  statBadge: {
    backgroundColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statBadgeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  actionsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 1,
  },
  startTripCard: {
    backgroundColor: '#27ae60',
  },
  endTripCard: {
    backgroundColor: '#e74c3c',
  },
  emergencyCard: {
    backgroundColor: '#e74c3c',
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27ae60',
    marginRight: 8,
  },
  trackingText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  locationCard: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  locationDetails: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  alertsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    marginBottom: 30,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    position: 'relative',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    color: '#3498db',
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
  unreadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingTop: 15,
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingTop: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  modalCloseBtn: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DriverView;
