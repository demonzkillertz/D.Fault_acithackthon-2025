import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

// Add the onBack prop to the component interface
interface SearchScreenProps {
  onBack?: () => void;
  activeTab?: string;
  onNavigate?: (tab: string) => void;
}

export default function Search({ onBack, activeTab = 'search', onNavigate }: SearchScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentTime, setCurrentTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
    console.log('Navigate back - User: Kreeman08 - Time: 2025-08-28 17:59:14');
    if (onBack) {
      onBack();
    }
  };

  const handleMenu = () => {
    console.log('Open menu - User: Kreeman08 - Time: 2025-08-28 17:59:14');
  };

  const handleNavigation = (tab: string) => {
    console.log(`Navigate to ${tab} - User: Kreeman08 - Time: 2025-08-28 17:59:14`);
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      console.log(`Search query: "${searchQuery}" - User: Kreeman08 - Time: 2025-08-28 17:59:14`);
      // Here you would typically search for routes and navigate to results
      alert(`Searching for routes to: ${searchQuery}\nUser: Kreeman08\nTime: 2025-08-28 17:59:14`);
    }
  };

  const handleVoiceSearch = () => {
    console.log('Voice search pressed - User: Kreeman08 - Time: 2025-08-28 17:59:14');
    alert('Voice search activated for Kreeman08');
  };

  const handleRecentSearchPress = (driverName: string, busNumber: string) => {
    console.log(`Recent search pressed: ${driverName} - Bus: ${busNumber} - User: Kreeman08 - Time: 2025-08-28 17:59:14`);
    // Navigate to routes or bus details
    if (onNavigate) {
      onNavigate('routes');
    }
  };

  // Recent searches data
  const recentSearches = [
    {
      id: 1,
      driverName: "Kriman Basi",
      busLicenseNo: "Ba 1 Ka 8848",
      phoneNo: "9812345677",
      status: "On Duty",
      statusColor: "#4CAF50",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 2,
      driverName: "Nabi Bajracharya", 
      userType: "User",
      userId: "800334",
      phoneNo: "9809131017",
      status: "Available",
      statusColor: "#2196F3",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    },
    {
      id: 3,
      driverName: "Alison Shivahari",
      busLicenseNo: "Ba 1 Ka 8849", 
      phoneNo: "9812345676",
      status: "Off Duty",
      statusColor: "#9E9E9E",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    }
  ];

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingBottom: insets.bottom + 80 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, isSearchFocused && styles.searchBoxFocused]}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            placeholder="Search destinations, routes..."
            style={styles.searchInput}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={handleVoiceSearch}>
            <MaterialIcons name="keyboard-voice" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent Searches Section */}
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.recentSearchesTitle}>Recent searches:</Text>
          
          {recentSearches.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.recentSearchItem}
              onPress={() => handleRecentSearchPress(item.driverName, item.busLicenseNo || item.userId || '')}
            >
              <View style={styles.avatarContainer}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {item.driverName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.searchItemDetails}>
                <Text style={styles.driverName}>
                  {item.userType ? `${item.userType}'s name: ` : "Driver's name: "}
                  {item.driverName}
                </Text>
                
                {item.busLicenseNo && (
                  <Text style={styles.busDetails}>
                    Bus License No. : {item.busLicenseNo}
                  </Text>
                )}
                
                {item.userId && (
                  <Text style={styles.busDetails}>
                    User ID : {item.userId}
                  </Text>
                )}
                
                <Text style={styles.phoneNumber}>
                  Phn No. : {item.phoneNo}
                </Text>
                
                <View style={styles.statusContainer}>
                  <Text style={[styles.statusText, { color: item.statusColor }]}>
                    Status: {item.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Search Suggestions */}
        <View style={styles.quickSearchContainer}>
          <Text style={styles.quickSearchTitle}>Quick Search</Text>
          <View style={styles.quickSearchGrid}>
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => setSearchQuery('Airport')}>
              <Ionicons name="airplane" size={20} color="#2196F3" />
              <Text style={styles.quickSearchText}>Airport</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => setSearchQuery('Bus Station')}>
              <Ionicons name="bus" size={20} color="#2196F3" />
              <Text style={styles.quickSearchText}>Bus Station</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => setSearchQuery('Mall')}>
              <Ionicons name="storefront" size={20} color="#2196F3" />
              <Text style={styles.quickSearchText}>Shopping Mall</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickSearchItem} onPress={() => setSearchQuery('Hospital')}>
              <Ionicons name="medical" size={20} color="#2196F3" />
              <Text style={styles.quickSearchText}>Hospital</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Tips */}
        <View style={styles.searchTipsContainer}>
          <Text style={styles.searchTipsTitle}>Search Tips</Text>
          <View style={styles.searchTip}>
            <Ionicons name="bulb" size={16} color="#FF9800" />
            <Text style={styles.searchTipText}>Try searching for specific landmarks or bus stop names</Text>
          </View>
          <View style={styles.searchTip}>
            <Ionicons name="location" size={16} color="#FF9800" />
            <Text style={styles.searchTipText}>Use current location to find nearby routes</Text>
          </View>
          <View style={styles.searchTip}>
            <Ionicons name="time" size={16} color="#FF9800" />
            <Text style={styles.searchTipText}>Check real-time bus schedules and delays</Text>
          </View>
        </View>

        {/* User Info */}
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfoTitle}>Search Session</Text>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>User:</Text>
            <Text style={styles.userInfoValue}>Kreeman08</Text>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>Date:</Text>
            <Text style={styles.userInfoValue}>2025-08-28</Text>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>Time:</Text>
            <Text style={styles.userInfoValue}>17:59:14 UTC</Text>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.userInfoLabel}>Search History:</Text>
            <Text style={styles.userInfoValue}>Available</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
    </KeyboardAvoidingView>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchBoxFocused: {
    borderColor: '#2196F3',
    backgroundColor: '#fff',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 15,
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
  },
  recentSearchesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchItemDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  busDetails: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 2,
  },
  phoneNumber: {
    fontSize: 12,
    color: '#ccc',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickSearchContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  quickSearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  quickSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickSearchItem: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  quickSearchText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  searchTipsContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  searchTipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  searchTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  searchTipText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  userInfoContainer: {
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
    borderRadius: 12,
    padding: 16,
  },
  userInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  userInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
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