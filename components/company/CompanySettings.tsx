import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

// Custom Leaflet Map Component for Company Bus Fleet Tracking
function CompanyFleetMapComponent({ 
  latitude = 27.7172, 
  longitude = 85.3240, 
  zoom = 12,
  style 
}: {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  style?: any;
}) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Company Fleet Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            html, body { height: 100%; margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .custom-icon { background: transparent !important; border: none !important; }
            .bus-popup { font-family: Arial, sans-serif; }
            .bus-status { padding: 2px 6px; border-radius: 3px; color: white; font-size: 10px; font-weight: bold; }
            .status-active { background-color: #4CAF50; }
            .status-idle { background-color: #FF9800; }
            .status-maintenance { background-color: #f44336; }
            .company-label { background: rgba(52, 152, 219, 0.9); color: white; padding: 6px 12px; border-radius: 6px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize map centered on Kathmandu Valley
            var map = L.map('map').setView([${latitude}, ${longitude}], ${zoom});
            
            // Add OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Define custom bus icons based on status
            var activeBusIcon = L.divIcon({
                html: '<div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><i style="color: white; font-size: 10px;">🚌</i></div>',
                iconSize: [26, 26],
                className: 'custom-icon'
            });
            
            var idleBusIcon = L.divIcon({
                html: '<div style="background: linear-gradient(135deg, #FF9800, #F57C00); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><i style="color: white; font-size: 10px;">🚌</i></div>',
                iconSize: [26, 26],
                className: 'custom-icon'
            });
            
            var maintenanceBusIcon = L.divIcon({
                html: '<div style="background: linear-gradient(135deg, #f44336, #D32F2F); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;"><i style="color: white; font-size: 10px;">🔧</i></div>',
                iconSize: [26, 26],
                className: 'custom-icon'
            });
            
            var routeStopIcon = L.divIcon({
                html: '<div style="background-color: #2196F3; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [16, 16],
                className: 'custom-icon'
            });

            // Company fleet data - Siddhartha Transport Services
            var companyBuses = [
                {
                    id: 'BUS-001',
                    plateNumber: 'BA-1-CHA-1234',
                    model: 'Tata Ultra AC',
                    capacity: 45,
                    position: [27.7172, 85.3240], // Kathmandu Ratna Park
                    status: 'active',
                    driver: 'Sabi Singh',
                    route: 'Kathmandu - Pokhara Express',
                    passengers: 28,
                    speed: 45,
                    lastUpdate: '2 mins ago'
                },
                {
                    id: 'BUS-002', 
                    plateNumber: 'BA-1-CHA-5678',
                    model: 'Ashok Leyland AC',
                    capacity: 50,
                    position: [27.7280, 85.3468], // Thamel area
                    status: 'idle',
                    driver: 'Ram Bahadur',
                    route: 'Kathmandu - Chitwan Route',
                    passengers: 0,
                    speed: 0,
                    lastUpdate: '5 mins ago'
                },
                {
                    id: 'BUS-003',
                    plateNumber: 'BA-1-CHA-9101',
                    model: 'Mahindra Tourister',
                    capacity: 35,
                    position: [27.7024, 85.3207], // Patan Durbar Square
                    status: 'active',
                    driver: 'Krishna Tamang',
                    route: 'Kathmandu - Bhaktapur Local',
                    passengers: 22,
                    speed: 30,
                    lastUpdate: '1 min ago'
                },
                {
                    id: 'BUS-004',
                    plateNumber: 'BA-1-CHA-1122',
                    model: 'Isuzu NPR',
                    capacity: 40,
                    position: [27.7390, 85.3252], // Basantapur area
                    status: 'maintenance',
                    driver: 'Hari Shrestha',
                    route: 'Under Maintenance',
                    passengers: 0,
                    speed: 0,
                    lastUpdate: '30 mins ago'
                },
                {
                    id: 'BUS-005',
                    plateNumber: 'BA-1-CHA-3344',
                    model: 'Tata Starbus AC',
                    capacity: 52,
                    position: [27.6966, 85.3438], // Lalitpur
                    status: 'active',
                    driver: 'Gopal Maharjan',
                    route: 'Ring Road Circle',
                    passengers: 35,
                    speed: 25,
                    lastUpdate: '3 mins ago'
                },
                {
                    id: 'BUS-006',
                    plateNumber: 'BA-1-CHA-5566',
                    model: 'Ashok Leyland Viking',
                    capacity: 48,
                    position: [27.7421, 85.3063], // Swayambhunath area
                    status: 'idle',
                    driver: 'Bikash Gurung',
                    route: 'Airport - City Route',
                    passengers: 0,
                    speed: 0,
                    lastUpdate: '8 mins ago'
                }
            ];

            // Add buses to map
            companyBuses.forEach(function(bus) {
                var icon;
                var statusClass;
                
                switch(bus.status) {
                    case 'active':
                        icon = activeBusIcon;
                        statusClass = 'status-active';
                        break;
                    case 'idle':
                        icon = idleBusIcon;
                        statusClass = 'status-idle';
                        break;
                    case 'maintenance':
                        icon = maintenanceBusIcon;
                        statusClass = 'status-maintenance';
                        break;
                    default:
                        icon = activeBusIcon;
                        statusClass = 'status-active';
                }
                
                var popupContent = \`
                    <div class="bus-popup">
                        <h4 style="margin: 0 0 8px 0; color: #2c3e50;">\${bus.plateNumber}</h4>
                        <p style="margin: 2px 0; font-size: 12px;"><strong>Model:</strong> \${bus.model}</p>
                        <p style="margin: 2px 0; font-size: 12px;"><strong>Driver:</strong> \${bus.driver}</p>
                        <p style="margin: 2px 0; font-size: 12px;"><strong>Route:</strong> \${bus.route}</p>
                        <p style="margin: 2px 0; font-size: 12px;"><strong>Capacity:</strong> \${bus.capacity} seats</p>
                        <p style="margin: 2px 0; font-size: 12px;"><strong>Passengers:</strong> \${bus.passengers}/\${bus.capacity}</p>
                        <p style="margin: 2px 0; font-size: 12px;"><strong>Speed:</strong> \${bus.speed} km/h</p>
                        <p style="margin: 6px 0 2px 0;"><span class="bus-status \${statusClass}">\${bus.status.toUpperCase()}</span></p>
                        <p style="margin: 2px 0; font-size: 10px; color: #666;">Last update: \${bus.lastUpdate}</p>
                    </div>
                \`;
                
                L.marker(bus.position, {icon: icon})
                    .bindPopup(popupContent)
                    .addTo(map);
            });

            // Add major bus stops/terminals
            var busStops = [
                { pos: [27.7172, 85.3240], name: 'Ratna Park Bus Station', type: 'terminal' },
                { pos: [27.7280, 85.3468], name: 'Thamel Tourist Bus Stop', type: 'stop' },
                { pos: [27.7024, 85.3207], name: 'Patan Bus Station', type: 'terminal' },
                { pos: [27.7390, 85.3252], name: 'Basantapur Stop', type: 'stop' },
                { pos: [27.6966, 85.3438], name: 'Lalitpur Junction', type: 'stop' },
                { pos: [27.7421, 85.3063], name: 'Swayambhunath Stop', type: 'stop' }
            ];
            
            busStops.forEach(function(stop) {
                L.marker(stop.pos, {icon: routeStopIcon})
                    .bindPopup('<b>' + stop.name + '</b><br>Type: ' + stop.type.charAt(0).toUpperCase() + stop.type.slice(1))
                    .addTo(map);
            });

            // Add company service area circle
            L.circle([27.7172, 85.3240], {
                color: '#3498db',
                fillColor: '#3498db',
                fillOpacity: 0.1,
                radius: 5000,
                weight: 2,
                dashArray: '5, 5'
            }).addTo(map).bindPopup('<b>Siddhartha Transport Services</b><br>Primary Service Area<br>Kathmandu Valley');

            // Add company info marker
            L.marker([27.7050, 85.3100], {
                icon: L.divIcon({
                    html: '<div class="company-label">Siddhartha Transport<br>Fleet Control Center</div>',
                    className: 'custom-icon',
                    iconSize: [150, 40]
                })
            }).addTo(map);

            // Add legend
            L.marker([27.6850, 85.2800], {
                icon: L.divIcon({
                    html: \`
                        <div style="background: rgba(255,255,255,0.95); padding: 10px; border-radius: 6px; font-size: 11px; border: 1px solid #ccc;">
                            <div style="font-weight: bold; margin-bottom: 5px;">Fleet Status Legend:</div>
                            <div><span style="color: #4CAF50;">🚌</span> Active (\${companyBuses.filter(b => b.status === 'active').length} buses)</div>
                            <div><span style="color: #FF9800;">🚌</span> Idle (\${companyBuses.filter(b => b.status === 'idle').length} buses)</div>
                            <div><span style="color: #f44336;">🔧</span> Maintenance (\${companyBuses.filter(b => b.status === 'maintenance').length} buses)</div>
                            <div style="margin-top: 5px; font-size: 10px; color: #666;">Total Fleet: \${companyBuses.length} buses</div>
                        </div>
                    \`,
                    className: 'custom-icon',
                    iconSize: [140, 80]
                })
            }).addTo(map);

            // Add real-time update timestamp
            L.marker([27.7500, 85.2900], {
                icon: L.divIcon({
                    html: '<div style="background: rgba(76, 175, 80, 0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold;">Live Tracking: ' + new Date().toLocaleTimeString() + '</div>',
                    className: 'custom-icon',
                    iconSize: [120, 25]
                })
            }).addTo(map);

            // Enable all map interactions
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
            map.touchZoom.enable();
            map.dragging.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
        </script>
    </body>
    </html>
  `;

  return (
    <View style={[companyFleetMapStyles.container, style]}>
      <WebView
        source={{ html: htmlContent }}
        style={companyFleetMapStyles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const companyFleetMapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

const CompanySettings = () => {
  const { user, logout } = useContext(AuthContext);
  const [notifications, setNotifications] = useState(true);
  const [gpsTracking, setGpsTracking] = useState(true);
  const [autoDispatch, setAutoDispatch] = useState(false);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [driverNotifications, setDriverNotifications] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showFleetMap, setShowFleetMap] = useState(false);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            if (logout) {
              await logout();
            }
          }
        }
      ]
    );
  };

  const handleBackup = () => {
    Alert.alert('Data Backup', 'Backup initiated successfully!\n\n• Fleet data\n• Driver records\n• Route information\n• Financial reports');
  };

  const handleSystemReset = () => {
    Alert.alert(
      'System Reset',
      'This will reset all settings to default. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', onPress: () => Alert.alert('Reset Complete', 'All settings have been reset to default values.'), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Company Settings</Text>
        <TouchableOpacity onPress={() => setShowFleetMap(!showFleetMap)}>
          <Ionicons name={showFleetMap ? "list" : "map"} size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {showFleetMap ? (
        // Fleet Map View
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>Live Fleet Tracking</Text>
            <Text style={styles.mapSubtitle}>Siddhartha Transport Services - Real-time Bus Locations</Text>
          </View>
          <CompanyFleetMapComponent
            latitude={27.7172}
            longitude={85.3240}
            zoom={12}
            style={styles.map}
          />
          <View style={styles.mapFooter}>
            <View style={styles.fleetStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>2</Text>
                <Text style={styles.statLabel}>Idle</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>1</Text>
                <Text style={styles.statLabel}>Maintenance</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>85</Text>
                <Text style={styles.statLabel}>Total Passengers</Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        // Settings List View
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Company Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            <View style={styles.companyInfo}>
              <View style={styles.companyLogo}>
                <Ionicons name="business" size={40} color="#3498db" />
              </View>
              <View style={styles.companyDetails}>
                <Text style={styles.companyName}>Siddhartha Transport Services</Text>
                <Text style={styles.companySubtitle}>Bus Management Dashboard</Text>
                <Text style={styles.companyStats}>6 Active Buses • 15 Routes • 45 Drivers</Text>
              </View>
            </View>
          </View>

          {/* Bus Management Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bus Management</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="location-outline" size={20} color="#333" />
                <Text style={styles.settingLabel}>GPS Tracking</Text>
              </View>
              <Switch
                value={gpsTracking}
                onValueChange={setGpsTracking}
                trackColor={{ false: '#767577', true: '#3498db' }}
                thumbColor={gpsTracking ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="car-outline" size={20} color="#333" />
                <Text style={styles.settingLabel}>Auto Dispatch</Text>
              </View>
              <Switch
                value={autoDispatch}
                onValueChange={setAutoDispatch}
                trackColor={{ false: '#767577', true: '#3498db' }}
                thumbColor={autoDispatch ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="build-outline" size={20} color="#333" />
                <Text style={styles.settingLabel}>Maintenance Alerts</Text>
              </View>
              <Switch
                value={maintenanceAlerts}
                onValueChange={setMaintenanceAlerts}
                trackColor={{ false: '#767577', true: '#3498db' }}
                thumbColor={maintenanceAlerts ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="people-outline" size={20} color="#333" />
                <Text style={styles.settingLabel}>Driver Notifications</Text>
              </View>
              <Switch
                value={driverNotifications}
                onValueChange={setDriverNotifications}
                trackColor={{ false: '#767577', true: '#3498db' }}
                thumbColor={driverNotifications ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* System Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Settings</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={20} color="#333" />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#767577', true: '#3498db' }}
                thumbColor={notifications ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="warning-outline" size={20} color="#e74c3c" />
                <Text style={styles.settingLabel}>Emergency Mode</Text>
              </View>
              <Switch
                value={emergencyMode}
                onValueChange={setEmergencyMode}
                trackColor={{ false: '#767577', true: '#e74c3c' }}
                thumbColor={emergencyMode ? '#fff' : '#f4f3f4'}
              />
            </View>

            <TouchableOpacity style={styles.settingItem} onPress={handleBackup}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-upload-outline" size={20} color="#333" />
                <Text style={styles.settingLabel}>Backup Data</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={handleSystemReset}>
              <View style={styles.settingInfo}>
                <Ionicons name="refresh-outline" size={20} color="#e74c3c" />
                <Text style={styles.settingLabel}>Reset Settings</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction} onPress={() => setShowFleetMap(true)}>
                <Ionicons name="map" size={24} color="#3498db" />
                <Text style={styles.quickActionText}>Fleet Map</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="analytics" size={24} color="#27ae60" />
                <Text style={styles.quickActionText}>Reports</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="people" size={24} color="#f39c12" />
                <Text style={styles.quickActionText}>Drivers</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickAction}>
                <Ionicons name="settings" size={24} color="#9b59b6" />
                <Text style={styles.quickActionText}>Config</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Section */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
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
    color: '#333',
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  mapHeader: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  mapFooter: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  fleetStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  companyLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  companyStats: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  quickAction: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    minWidth: 70,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  logoutContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  bottomSpacer: {
    height: 20,
  },
});

export default CompanySettings;
