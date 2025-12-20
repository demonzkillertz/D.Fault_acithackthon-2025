import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Switch, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthContext } from '@/context/AuthContext';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import api from '../../services/api';

const UserProfile = () => {
  const { user, logout } = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  
  // App settings states
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  
  // Modal states
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  
  // Edit profile states
  const [editName, setEditName] = useState(user?.username || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loading states
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Load user preferences
  useEffect(() => {
    if (user) {
      setEditName(user.username || '');
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
      setEditAddress(user.address || '');
      // Load saved preferences from storage/API if available
      loadUserPreferences();
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      // You can load from AsyncStorage or API
      // const preferences = await AsyncStorage.getItem('userPreferences');
      // if (preferences) {
      //   const prefs = JSON.parse(preferences);
      //   setNotifications(prefs.notifications ?? true);
      //   setLocationSharing(prefs.locationSharing ?? true);
      //   setDarkMode(prefs.darkMode ?? false);
      //   setAutoSync(prefs.autoSync ?? true);
      // }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const saveUserPreferences = async (preferences: any) => {
    try {
      // await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
      console.log('Preferences saved:', preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleEditProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setUpdating(true);
    try {
      const response = await api.put('/api/users/profile', {
        username: editName,
        email: editEmail,
        phone: editPhone,
        address: editAddress
      });

      if (response.data) {
        Alert.alert('Success', 'Profile updated successfully');
        setShowEditProfile(false);
        // Update user context if needed
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.put('/api/users/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data) {
        Alert.alert('Success', 'Password changed successfully');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Feature Coming Soon', 'Account deletion will be available in the next update.');
          }
        }
      ]
    );
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotifications(value);
    saveUserPreferences({ notifications: value, locationSharing, darkMode, autoSync });
  };

  const handleLocationSharingToggle = (value: boolean) => {
    setLocationSharing(value);
    saveUserPreferences({ notifications, locationSharing: value, darkMode, autoSync });
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    saveUserPreferences({ notifications, locationSharing, darkMode: value, autoSync });
    // Apply dark mode theme
    Alert.alert('Dark Mode', value ? 'Dark mode enabled' : 'Dark mode disabled');
  };

  const handleAutoSyncToggle = (value: boolean) => {
    setAutoSync(value);
    saveUserPreferences({ notifications, locationSharing, darkMode, autoSync: value });
  };

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom + 80 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Info */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ 
                uri: user?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' 
              }}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editImageButton}>
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.username || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'USER'}</Text>
        </View>

        {/* Profile Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Management</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowEditProfile(true)}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={20} color="#3498db" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowChangePassword(true)}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed-outline" size={20} color="#e74c3c" />
              <Text style={styles.menuItemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => setShowPrivacySettings(true)}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-outline" size={20} color="#f39c12" />
              <Text style={styles.menuItemText}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={20} color="#27ae60" />
              <Text style={styles.menuItemText}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={notifications ? '#3498db' : '#f4f3f4'}
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="location-outline" size={20} color="#9b59b6" />
              <Text style={styles.menuItemText}>Location Sharing</Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={handleLocationSharingToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={locationSharing ? '#3498db' : '#f4f3f4'}
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="moon-outline" size={20} color="#2c3e50" />
              <Text style={styles.menuItemText}>Dark Mode</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={darkMode ? '#3498db' : '#f4f3f4'}
            />
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="sync-outline" size={20} color="#16a085" />
              <Text style={styles.menuItemText}>Auto Sync</Text>
            </View>
            <Switch
              value={autoSync}
              onValueChange={handleAutoSyncToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={autoSync ? '#3498db' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Other Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#3498db" />
              <Text style={styles.menuItemText}>Help & FAQ</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="mail-outline" size={20} color="#27ae60" />
              <Text style={styles.menuItemText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text-outline" size={20} color="#f39c12" />
              <Text style={styles.menuItemText}>Terms & Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
              <Text style={[styles.menuItemText, { color: '#e74c3c' }]}>Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#e74c3c" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="trash-outline" size={20} color="#c0392b" />
              <Text style={[styles.menuItemText, { color: '#c0392b' }]}>Delete Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#c0392b" />
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Guruji Bus App</Text>
          <Text style={styles.versionNumber}>Version 1.0.0</Text>
          <Text style={styles.buildNumber}>Build 2025.09.01</Text>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleEditProfile} disabled={updating}>
              {updating ? (
                <ActivityIndicator size="small" color="#3498db" />
              ) : (
                <Text style={styles.saveButton}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Enter your address"
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowChangePassword(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity onPress={handleChangePassword} disabled={changingPassword}>
              {changingPassword ? (
                <ActivityIndicator size="small" color="#3498db" />
              ) : (
                <Text style={styles.saveButton}>Change</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password (min 6 characters)"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.passwordTips}>
              <Text style={styles.tipsTitle}>Password Requirements:</Text>
              <Text style={styles.tipItem}>• At least 6 characters long</Text>
              <Text style={styles.tipItem}>• Include uppercase and lowercase letters</Text>
              <Text style={styles.tipItem}>• Include at least one number</Text>
              <Text style={styles.tipItem}>• Avoid common passwords</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Privacy Settings Modal */}
      <Modal
        visible={showPrivacySettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPrivacySettings(false)}>
              <Text style={styles.cancelButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Privacy & Security</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>Data Sharing</Text>
              
              <View style={styles.privacyItem}>
                <View>
                  <Text style={styles.privacyItemTitle}>Share Location Data</Text>
                  <Text style={styles.privacyItemDesc}>Allow the app to share your location with bus operators</Text>
                </View>
                <Switch
                  value={locationSharing}
                  onValueChange={handleLocationSharingToggle}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={locationSharing ? '#3498db' : '#f4f3f4'}
                />
              </View>

              <View style={styles.privacyItem}>
                <View>
                  <Text style={styles.privacyItemTitle}>Usage Analytics</Text>
                  <Text style={styles.privacyItemDesc}>Help improve the app by sharing usage data</Text>
                </View>
                <Switch
                  value={autoSync}
                  onValueChange={handleAutoSyncToggle}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={autoSync ? '#3498db' : '#f4f3f4'}
                />
              </View>
            </View>

            <View style={styles.privacySection}>
              <Text style={styles.privacySectionTitle}>Account Security</Text>
              
              <TouchableOpacity style={styles.securityItem}>
                <Ionicons name="finger-print-outline" size={24} color="#3498db" />
                <View style={styles.securityItemContent}>
                  <Text style={styles.securityItemTitle}>Biometric Login</Text>
                  <Text style={styles.securityItemDesc}>Use fingerprint or face recognition</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.securityItem}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#27ae60" />
                <View style={styles.securityItemContent}>
                  <Text style={styles.securityItemTitle}>Two-Factor Authentication</Text>
                  <Text style={styles.securityItemDesc}>Add extra security to your account</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.securityItem}>
                <Ionicons name="time-outline" size={24} color="#f39c12" />
                <View style={styles.securityItemContent}>
                  <Text style={styles.securityItemTitle}>Login History</Text>
                  <Text style={styles.securityItemDesc}>View recent login activity</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#3498db',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3498db',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#3498db',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#2c3e50',
    marginLeft: 15,
    fontWeight: '500',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    marginTop: 20,
  },
  versionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  versionNumber: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  buildNumber: {
    fontSize: 12,
    color: '#bdc3c7',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  cancelButton: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
  },
  saveButton: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  passwordTips: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  tipItem: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  privacySection: {
    marginBottom: 30,
  },
  privacySectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  privacyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  privacyItemDesc: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  securityItemContent: {
    flex: 1,
    marginLeft: 15,
  },
  securityItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  securityItemDesc: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 2,
  },
});

export default UserProfile;
