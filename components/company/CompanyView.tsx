import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, RefreshControl, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { companyService, Bus, Company } from '../../services/companyService';
import { realtimeService } from '../../services/realtimeService';
import api from '../../services/api';

interface LiveBusData {
  id: number;
  plate_number: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  last_update: string;
  driver_name?: string;
  is_active: boolean;
}

const CompanyView = () => {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [liveBuses, setLiveBuses] = useState<LiveBusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newBus, setNewBus] = useState({
    plate_number: '',
    model: '',
    capacity: '',
  });

  const loadCompanyData = async () => {
    try {
      if (user?.id) {
        const [busesData, companyData] = await Promise.all([
          companyService.getCompanyBuses(user.id),
          companyService.getCompany(user.id).catch(() => null)
        ]);
        setBuses(busesData);
        setCompany(companyData);

        // Load live bus locations
        try {
          const liveResponse = await api.get(`/api/locations/company/${user.id}/buses`);
          if (liveResponse.data) {
            setLiveBuses(liveResponse.data.map((bus: any) => ({
              ...bus,
              is_active: true,
              last_update: bus.timestamp || new Date().toISOString()
            })));
          }
        } catch (liveError) {
          console.log('No live bus data available');
        }
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      Alert.alert('Error', 'Failed to load company data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Real-time bus updates
  useEffect(() => {
    const handleBusLocationUpdate = (data: any) => {
      const { busId, latitude, longitude, speed, heading } = data;
      
      setLiveBuses(prevBuses => {
        const existingBusIndex = prevBuses.findIndex(bus => bus.id === busId);
        const updatedBus = {
          id: busId,
          plate_number: buses.find(b => b.id === busId)?.plate_number || `Bus-${busId}`,
          latitude,
          longitude,
          speed,
          heading,
          last_update: new Date().toISOString(),
          is_active: true
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
        [
          { text: 'OK' },
          { text: 'Contact Driver', onPress: () => console.log('Contact driver') }
        ]
      );
    };

    // Subscribe to real-time events
    realtimeService.onEmergencyAlert(handleEmergencyAlert);

    return () => {
      realtimeService.offEmergencyAlert(handleEmergencyAlert);
    };
  }, [buses]);

  useEffect(() => {
    loadCompanyData();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCompanyData();
  };

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
  };

  const handleAddBus = async () => {
    if (!newBus.plate_number || !newBus.model || !newBus.capacity) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      await companyService.createBus({
        plate_number: newBus.plate_number,
        company_id: user?.id || 0,
        model: newBus.model,
        capacity: parseInt(newBus.capacity)
      });
      setShowAddBusModal(false);
      setNewBus({ plate_number: '', model: '', capacity: '' });
      loadCompanyData();
      Alert.alert('Success', 'Bus added successfully!');
    } catch (error) {
      console.error('Error adding bus:', error);
      Alert.alert('Error', 'Failed to add bus');
    }
  };

  const activeBuses = buses.filter(bus => bus.driver_id && bus.latitude && bus.longitude).length;
  const totalBuses = buses.length;

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 80 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Ionicons name="menu" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Guruji<Text style={{ fontSize: 14 }}> (गुरुजी)</Text></Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
      </View>

      {/* Menu Dropdown */}
      {showMenu && (
        <View style={styles.menuDropdown}>
          <TouchableOpacity style={styles.menuItem} onPress={() => {setShowMenu(false); /* Add profile action */}}>
            <Ionicons name="person-outline" size={20} color="#333" />
            <Text style={styles.menuText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => {setShowMenu(false); /* Add settings action */}}>
            <Ionicons name="settings-outline" size={20} color="#333" />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => {setShowMenu(false); handleLogout()}}>
            <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
            <Text style={[styles.menuText, {color: '#e74c3c'}]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Company Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="bus" size={24} color="#3498db" />
          <Text style={styles.statNumber}>{totalBuses}</Text>
          <Text style={styles.statLabel}>Total Buses</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
          <Text style={styles.statNumber}>{activeBuses}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#f39c12" />
          <Text style={styles.statNumber}>{company?.rating ? Number(company.rating).toFixed(1) : '0.0'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      {/* Live Fleet Status */}
      <View style={styles.liveFleetContainer}>
        <View style={styles.liveFleetHeader}>
          <View style={styles.headerInfo}>
            <Ionicons name="pulse" size={24} color="#27ae60" />
            <Text style={styles.liveFleetTitle}>Live Fleet Status</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={[styles.liveDot, { opacity: liveBuses.length > 0 ? 1 : 0.3 }]} />
            <Text style={styles.liveText}>{liveBuses.length} Active</Text>
          </View>
        </View>
        
        {liveBuses.length === 0 ? (
          <View style={styles.noLiveFleetContainer}>
            <Text style={styles.noDataText}>No active buses</Text>
            <Text style={styles.noDataSubtext}>Buses will appear here when drivers start trips</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.liveFleetScroll}>
            {liveBuses.map((bus) => (
              <View key={bus.id} style={styles.liveBusCard}>
                <View style={styles.liveBusHeader}>
                  <Text style={styles.liveBusPlate}>{bus.plate_number}</Text>
                  <View style={[styles.statusDot, { 
                    backgroundColor: bus.is_active ? '#27ae60' : '#e74c3c' 
                  }]} />
                </View>
                <View style={styles.liveBusStats}>
                  <View style={styles.liveStatItem}>
                    <Text style={styles.liveStatValue}>{bus.speed.toFixed(0)}</Text>
                    <Text style={styles.liveStatLabel}>km/h</Text>
                  </View>
                  <View style={styles.liveStatItem}>
                    <Text style={styles.liveStatValue}>{bus.heading.toFixed(0)}°</Text>
                    <Text style={styles.liveStatLabel}>heading</Text>
                  </View>
                </View>
                <Text style={styles.lastUpdateText}>
                  {new Date(bus.last_update).toLocaleTimeString()}
                </Text>
                {bus.driver_name && (
                  <Text style={styles.driverNameText}>{bus.driver_name}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Buses Header */}
      <View style={styles.driversHeader}>
        <Ionicons name="bus-outline" size={24} color="black" />
        <Text style={styles.driversTitle}>Bus Management</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => setShowAddBusModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addText}>Add Bus</Text>
        </TouchableOpacity>
      </View>
      {/* Buses Cards */}
      <ScrollView 
        contentContainerStyle={[styles.cardsContainer, { paddingBottom: 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading buses...</Text>
        ) : buses.length === 0 ? (
          <Text style={styles.noBusesText}>No buses found. Add some buses to get started!</Text>
        ) : (
          buses.map((bus) => (
            <View
              key={bus.id}
              style={[
                styles.driverCard,
                { backgroundColor: bus.driver_id ? '#111' : '#ccc' }
              ]}
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/744/744465.png' }} 
                style={styles.driverImg} 
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverText}>Plate Number: <Text style={styles.driverBold}>{bus.plate_number}</Text></Text>
                <Text style={styles.driverText}>Model: <Text style={styles.driverBold}>{bus.model}</Text></Text>
                <Text style={styles.driverText}>Capacity: <Text style={styles.driverBold}>{bus.capacity} seats</Text></Text>
                <Text style={styles.driverText}>Driver: <Text style={styles.driverBold}>{bus.driver_name || 'Not assigned'}</Text></Text>
                <Text style={styles.driverText}>Route: <Text style={styles.driverBold}>{bus.route_name || 'Not assigned'}</Text></Text>
                <Text style={styles.driverText}>Status: <Text style={[styles.driverBold, {color: bus.latitude && bus.longitude ? '#27ae60' : '#e74c3c'}]}>
                  {bus.latitude && bus.longitude ? 'Active' : 'Inactive'}
                </Text></Text>
                {bus.speed && (
                  <Text style={styles.driverText}>Speed: <Text style={styles.driverBold}>{bus.speed} km/h</Text></Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      {/* Add Bus Modal */}
      <Modal
        visible={showAddBusModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddBusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Bus</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Plate Number (e.g., AB1234)"
              value={newBus.plate_number}
              onChangeText={(text) => setNewBus({...newBus, plate_number: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Model (e.g., Volvo B9R)"
              value={newBus.model}
              onChangeText={(text) => setNewBus({...newBus, model: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Capacity (number of seats)"
              value={newBus.capacity}
              onChangeText={(text) => setNewBus({...newBus, capacity: text})}
              keyboardType="numeric"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowAddBusModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleAddBus}
              >
                <Text style={styles.confirmBtnText}>Add Bus</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc', // Softer background
    paddingTop: 40,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    elevation: 3,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
    color: '#1e293b', // Professional dark blue-gray
  },
  profilePic: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 10,
    borderWidth: 2,
    borderColor: '#3b82f6', // Modern blue accent
  },
  // Stats Container - Enhanced colors
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 22,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b', // Better gray
    marginTop: 6,
    fontWeight: '500',
  },
  driversHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 15,
    paddingVertical: 8,
  },
  driversTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
    color: '#1e293b',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6', // Modern blue
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  cardsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  driverImg: {
    width: 66,
    height: 66,
    borderRadius: 33,
    marginRight: 18,
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  driverInfo: {
    flex: 1,
  },
  driverText: {
    color: '#334155',
    fontSize: 15,
    marginBottom: 5,
    lineHeight: 20,
  },
  driverBold: {
    fontWeight: '700',
    color: '#3b82f6',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  noBusesText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#64748b',
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.6)', // Better overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 28,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#1e293b',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f8fafc',
    color: '#1e293b',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelBtn: {
    backgroundColor: '#ef4444', // Modern red
    shadowColor: '#ef4444',
  },
  confirmBtn: {
    backgroundColor: '#10b981', // Modern green
    shadowColor: '#10b981',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Enhanced Menu and logout styles
  logoutBtn: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  menuDropdown: {
    position: 'absolute',
    top: 70,
    left: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
    minWidth: 160,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  menuText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  // Live Fleet Styles
  liveFleetContainer: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
    elevation: 2,
    borderRadius: 10,
  },
  liveFleetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveFleetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27ae60',
    marginRight: 6,
  },
  liveText: {
    fontSize: 14,
    color: '#27ae60',
    fontWeight: '500',
  },
  noLiveFleetContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  liveFleetScroll: {
    marginHorizontal: -5,
  },
  liveBusCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    minWidth: 140,
    borderLeftWidth: 3,
    borderLeftColor: '#27ae60',
  },
  liveBusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveBusPlate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveBusStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  liveStatItem: {
    alignItems: 'center',
  },
  liveStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
  },
  liveStatLabel: {
    fontSize: 10,
    color: '#666',
  },
  lastUpdateText: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  driverNameText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default CompanyView;