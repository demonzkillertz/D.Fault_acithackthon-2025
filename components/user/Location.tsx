import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

// Custom Location Map Component
function LocationMapComponent({ 
  latitude = 23.8103, 
  longitude = 90.4125, 
  zoom = 15,
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
        <title>Your Location</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            html, body { height: 100%; margin: 0; padding: 0; }
            #map { height: 100vh; width: 100vw; }
            .custom-icon { background: transparent !important; border: none !important; }
            .pulsing-dot {
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            // Initialize map
            var map = L.map('map').setView([${latitude}, ${longitude}], ${zoom});
            
            // Add OpenStreetMap tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            
            // Custom user location icon with pulsing effect
            var userLocationIcon = L.divIcon({
                html: '<div class="pulsing-dot" style="background-color: #4CAF50; width: 20px; height: 20px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 10px rgba(76, 175, 80, 0.6); display: flex; align-items: center; justify-content: center;"><div style="width: 8px; height: 8px; background-color: white; border-radius: 50%;"></div></div>',
                iconSize: [28, 28],
                className: 'custom-icon'
            });
            
            // Accuracy circle around user location
            var accuracyCircle = L.circle([${latitude}, ${longitude}], {
                color: '#4CAF50',
                fillColor: '#4CAF50',
                fillOpacity: 0.1,
                radius: 50,
                weight: 2
            }).addTo(map);
            
            // Add user's current location marker
            var userMarker = L.marker([${latitude}, ${longitude}], {icon: userLocationIcon}).addTo(map)
                .bindPopup('<b>Kreeman08</b><br>📍 Your Current Location<br>📅 2025-08-28<br>🕐 18:41:35 UTC<br>✅ Location Active<br>🎯 Accuracy: ±50m');
            
            // Nearby bus stops
            var busStopIcon = L.divIcon({
                html: '<div style="background-color: #2196F3; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(33, 150, 243, 0.4);"></div>',
                iconSize: [20, 20],
                className: 'custom-icon'
            });
            
            // Add nearby bus stops
            var nearbyStops = [
                { pos: [${latitude + 0.002}, ${longitude + 0.001}], name: 'Vision & Value Bus Stop', distance: '200m', routes: ['362C', '245A'] },
                { pos: [${latitude - 0.001}, ${longitude + 0.002}], name: 'Linga Bhatiary Stop', distance: '150m', routes: ['500D', '362C'] },
                { pos: [${latitude + 0.003}, ${longitude - 0.001}], name: 'Korean Aesthetic Stop', distance: '300m', routes: ['245A', '180B'] },
                { pos: [${latitude - 0.002}, ${longitude - 0.002}], name: 'Maharajganj Terminal', distance: '400m', routes: ['362C', '500D', '245A'] }
            ];
            
            nearbyStops.forEach(function(stop) {
                L.marker(stop.pos, {icon: busStopIcon}).addTo(map)
                    .bindPopup('<b>' + stop.name + '</b><br>📍 Distance: ' + stop.distance + '<br>🚌 Routes: ' + stop.routes.join(', ') + '<br>👤 User: Kreeman08<br>🕐 Updated: 18:41:35');
            });
            
            // Active buses nearby
            var activeBusIcon = L.divIcon({
                html: '<div style="background-color: #FF9800; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(255, 152, 0, 0.4);"></div>',
                iconSize: [22, 22],
                className: 'custom-icon'
            });
            
            var nearbyBuses = [
                { pos: [${latitude + 0.001}, ${longitude + 0.002}], number: '362C', eta: '3 mins', direction: 'To Maharajganj' },
                { pos: [${latitude - 0.002}, ${longitude + 0.001}], number: '245A', eta: '8 mins', direction: 'To City Center' },
                { pos: [${latitude + 0.002}, ${longitude - 0.003}], number: '500D', eta: '12 mins', direction: 'To Airport' }
            ];
            
            nearbyBuses.forEach(function(bus) {
                L.marker(bus.pos, {icon: activeBusIcon}).addTo(map)
                    .bindPopup('<b>Bus ' + bus.number + '</b><br>🚌 ' + bus.direction + '<br>⏱️ ETA: ' + bus.eta + '<br>👤 Tracked by: Kreeman08<br>🕐 Live: 18:41:35');
            });
            
            // Add area labels
            L.marker([${latitude + 0.004}, ${longitude + 0.003}], {
                icon: L.divIcon({
                    html: '<div style="background: rgba(255,255,255,0.9); padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; color: #333; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">MAHARAJGANJ<br>মহারাজগঞ্জ</div>',
                    className: 'custom-icon',
                    iconSize: [120, 35]
                })
            }).addTo(map);
            
            // Add compass/direction indicator
            L.marker([${latitude + 0.005}, ${longitude - 0.004}], {
                icon: L.divIcon({
                    html: '<div style="background: rgba(33, 150, 243, 0.9); color: white; padding: 6px 10px; border-radius: 6px; font-size: 10px; font-weight: bold; text-align: center;">📍 Your Location<br>Kreeman08<br>18:41:35</div>',
                    className: 'custom-icon',
                    iconSize: [100, 50]
                })
            }).addTo(map);
            
            // Enable all map interactions
            map.scrollWheelZoom.enable();
            map.doubleClickZoom.enable();
            map.touchZoom.enable();
            map.dragging.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            
            // Auto-center on user location
            map.setView([${latitude}, ${longitude}], ${zoom});
            
            // Add a locate control button
            var locateControl = L.control({position: 'topright'});
            locateControl.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
                div.style.backgroundColor = 'white';
                div.style.backgroundImage = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCAxMEwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDEwTDEwLjkxIDguMjZMMTIgMloiIGZpbGw9IiM0Q0FGNTASCZ8L3N2Zz4K')";
                div.style.backgroundSize = '16px 16px';
                div.style.backgroundPosition = 'center';
                div.style.backgroundRepeat = 'no-repeat';
                div.style.width = '30px';
                div.style.height = '30px';
                div.style.cursor = 'pointer';
                div.title = 'Center on your location';
                div.onclick = function(){
                    map.setView([${latitude}, ${longitude}], ${zoom});
                }
                return div;
            };
            locateControl.addTo(map);
        </script>
    </body>
    </html>
  `;

  return (
    <View style={[locationMapStyles.container, style]}>
      <WebView
        source={{ html: htmlContent }}
        style={locationMapStyles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

const locationMapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

// Location Screen Props Interface
interface LocationScreenProps {
  onBack?: () => void;
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

export default function Location({ onBack, activeTab = 'location', onNavigate }: LocationScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState('');
  const [locationAccuracy, setLocationAccuracy] = useState('High');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    console.log('Navigate back - User: Kreeman08 - Time: 2025-08-28 18:41:35');
    if (onBack) {
      onBack();
    }
  };

  const handleMenu = () => {
    console.log('Open menu - User: Kreeman08 - Time: 2025-08-28 18:41:35');
  };

  const handleNavigation = (tab: string) => {
    console.log(`Navigate to ${tab} - User: Kreeman08 - Time: 2025-08-28 18:41:35`);
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleShareLocation = () => {
    console.log('Share location pressed - User: Kreeman08 - Time: 2025-08-28 18:41:35');
    alert('Location shared!\nUser: Kreeman08\nCoordinates: 23.8103, 90.4125\nTime: 2025-08-28 18:41:35');
  };

  const handleGetDirections = () => {
    console.log('Get directions pressed - User: Kreeman08 - Time: 2025-08-28 18:41:35');
    if (onNavigate) {
      onNavigate('routes');
    }
  };

  const handleNearbyStops = () => {
    console.log('Nearby stops pressed - User: Kreeman08 - Time: 2025-08-28 18:41:35');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 80 }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.time}>9:41</Text>
        <View style={styles.statusIcons}>
          <Ionicons name="cellular" size={16} color="#000" />
          <Ionicons name="wifi" size={16} color="#000" style={{ marginLeft: 4 }} />
          <Ionicons name="battery-full" size={16} color="#000" style={{ marginLeft: 4 }} />
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Ionicons name="bus" size={20} color="#333" />
        </View>
        <Text style={styles.title}>Guruji</Text>
        <View style={styles.profileContainer}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>K</Text>
          </View>
        </View>
      </View>

      {/* Menu Icon */}
      <View style={styles.menuContainer}>
        <TouchableOpacity onPress={handleMenu}>
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => handleNavigation('home')}>
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavigation('trackBus')}>
          <Text style={[styles.navText, activeTab === 'trackBus' && styles.activeNavText]}>Track Bus</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavigation('routes')}>
          <Text style={[styles.navText, activeTab === 'routes' && styles.activeNavText]}>Routes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleNavigation('book')}>
          <Text style={[styles.navText, activeTab === 'book' && styles.activeNavText]}>Book</Text>
        </TouchableOpacity>
      </View>

      {/* Location Info Header */}
      <View style={styles.locationHeader}>
        <View style={styles.locationHeaderLeft}>
          <Ionicons name="location" size={20} color="#4CAF50" />
          <View style={styles.locationHeaderText}>
            <Text style={styles.locationTitle}>Your Location</Text>
            <Text style={styles.locationSubtitle}>Kreeman08 • Live tracking</Text>
          </View>
        </View>
        <View style={styles.locationAccuracy}>
          <View style={[styles.accuracyDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={styles.accuracyText}>{locationAccuracy}</Text>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <LocationMapComponent
          latitude={23.8103}
          longitude={90.4125}
          zoom={15}
          style={styles.map}
        />
      </View>

      {/* Location Details */}
      <View style={styles.locationDetails}>
        <ScrollView 
          style={styles.detailsScroll} 
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Location Info */}
          <View style={styles.currentLocationCard}>
            <View style={styles.locationCardHeader}>
              <Ionicons name="location" size={18} color="#4CAF50" />
              <Text style={styles.locationCardTitle}>Current Position</Text>
            </View>
            <Text style={styles.coordinatesText}>23.8103°N, 90.4125°E</Text>
            <Text style={styles.addressText}>Maharajganj, Chittagong, Bangladesh</Text>
            <View style={styles.locationMeta}>
              <Text style={styles.metaText}>📅 2025-08-28 • 🕐 18:41:35 UTC</Text>
              <Text style={styles.metaText}>🎯 Accuracy: ±50m • 👤 Kreeman08</Text>
            </View>
          </View>

          {/* Nearby Bus Stops */}
          <View style={styles.nearbySection}>
            <Text style={styles.sectionTitle}>Nearby Bus Stops</Text>
            
            <TouchableOpacity style={styles.nearbyItem} onPress={handleNearbyStops}>
              <View style={styles.nearbyIcon}>
                <Ionicons name="bus" size={16} color="#2196F3" />
              </View>
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyName}>Vision & Value Bus Stop</Text>
                <Text style={styles.nearbyDistance}>200m away • Routes: 362C, 245A</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.nearbyItem} onPress={handleNearbyStops}>
              <View style={styles.nearbyIcon}>
                <Ionicons name="bus" size={16} color="#2196F3" />
              </View>
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyName}>Linga Bhatiary Stop</Text>
                <Text style={styles.nearbyDistance}>150m away • Routes: 500D, 362C</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.nearbyItem} onPress={handleNearbyStops}>
              <View style={styles.nearbyIcon}>
                <Ionicons name="bus" size={16} color="#2196F3" />
              </View>
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyName}>Korean Aesthetic Stop</Text>
                <Text style={styles.nearbyDistance}>300m away • Routes: 245A, 180B</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Active Buses */}
          <View style={styles.activeBusesSection}>
            <Text style={styles.sectionTitle}>Buses Near You</Text>
            
            <View style={styles.busItem}>
              <View style={styles.busNumber}>
                <Text style={styles.busNumberText}>362C</Text>
              </View>
              <View style={styles.busInfo}>
                <Text style={styles.busRoute}>To Maharajganj</Text>
                <Text style={styles.busEta}>ETA: 3 minutes</Text>
              </View>
              <View style={styles.busStatus}>
                <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            <View style={styles.busItem}>
              <View style={styles.busNumber}>
                <Text style={styles.busNumberText}>245A</Text>
              </View>
              <View style={styles.busInfo}>
                <Text style={styles.busRoute}>To City Center</Text>
                <Text style={styles.busEta}>ETA: 8 minutes</Text>
              </View>
              <View style={styles.busStatus}>
                <View style={[styles.statusDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.statusText}>Arriving</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShareLocation}>
          <Ionicons name="share" size={16} color="#2196F3" />
          <Text style={styles.actionButtonText}>Share Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
          <Ionicons name="navigate" size={16} color="#2196F3" />
          <Text style={styles.actionButtonText}>Get Directions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleNearbyStops}>
          <Ionicons name="list" size={16} color="#2196F3" />
          <Text style={styles.actionButtonText}>All Nearby</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: '#fff',
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  profileContainer: {
    width: 32,
    height: 32,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8D6E63',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  menuContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  navText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '400',
    paddingVertical: 4,
  },
  activeNavText: {
    color: '#333',
    fontWeight: '600',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  locationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationHeaderText: {
    marginLeft: 8,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationAccuracy: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accuracyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  accuracyText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  mapContainer: {
    height: 250,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  locationDetails: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailsScroll: {
    flex: 1,
  },
  currentLocationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  locationMeta: {
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  nearbySection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  nearbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  nearbyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  nearbyDistance: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  activeBusesSection: {
    padding: 16,
  },
  busItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  busNumber: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  busNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  busInfo: {
    flex: 1,
  },
  busRoute: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  busEta: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  busStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  bottomNavItem: {
    padding: 8,
  },
});