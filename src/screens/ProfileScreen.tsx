import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const { user, updateUser } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    photoURL: user?.photoURL || '',
  });
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
      });
      setSelectedImageUri(null);
    }
  }, [user]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfilePicture = async (uri: string): Promise<string> => {
    try {
      const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error(
          'Profile image upload is not configured. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.'
        );
      }

      const imageName = `profile_${user?.uid}_${Date.now()}.jpg`;

      const formData = new FormData();
      // @ts-ignore - React Native FormData file type
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: imageName,
      });
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', `profiles/${user?.uid}`);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.secure_url) {
        console.error('[ProfileScreen] ❌ Cloudinary upload failed:', data);
        throw new Error(data.error?.message || 'Failed to upload profile picture.');
      }

      return data.secure_url as string;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload profile picture');
    }
  };

  const handleEditProfile = () => {
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Validation Error', 'Please enter a display name');
      return;
    }

    try {
      setEditing(true);
      let photoURL = formData.photoURL;

      // Upload new photo if one was selected
      if (selectedImageUri) {
        setUploadingPhoto(true);
        try {
          photoURL = await uploadProfilePicture(selectedImageUri);
        } catch (error: any) {
          console.error('Error uploading photo:', error);
          Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
          setUploadingPhoto(false);
          setEditing(false);
          return;
        }
        setUploadingPhoto(false);
      }

      await updateUser({
        displayName: formData.displayName.trim(),
        photoURL: photoURL || undefined,
      });

      setShowEditModal(false);
      setSelectedImageUri(null);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setEditing(false);
      setUploadingPhoto(false);
    }
  };

  const getRoleColor = (role?: string): string => {
    switch (role) {
      case 'Buyer':
        return '#34C759';
      case 'Owner':
        return '#0a7ea4';
      case 'Constructor':
        return '#FF9500';
      case 'Renovator':
        return '#AF52DE';
      case 'Admin':
        return '#FF3B30';
      default:
        return colors.icon;
    }
  };

  const getRoleIcon = (role?: string): keyof typeof MaterialIcons.glyphMap => {
    switch (role) {
      case 'Buyer':
        return 'shopping-cart';
      case 'Owner':
        return 'home';
      case 'Constructor':
        return 'construction';
      case 'Renovator':
        return 'handyman';
      case 'Admin':
        return 'admin-panel-settings';
      default:
        return 'person';
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-off" size={64} color={colors.text} />
            <Text variant="body" style={[styles.emptyText, { color: colors.text }]}>
              Please sign in to view your profile
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const displayImageUri = selectedImageUri || formData.photoURL;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Profile Section */}
        <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
          {displayImageUri ? (
            <Image source={{ uri: displayImageUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
          )}
          <Text style={[styles.name, { color: colors.text }]}>{user?.displayName || 'User'}</Text>
          <Text style={[styles.email, { color: colors.icon }]}>{user?.email}</Text>
          {user?.phoneNumber && <Text style={[styles.phone, { color: colors.icon }]}>{user.phoneNumber}</Text>}
          {user?.role && (
            <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(user.role)}20` }]}>
              <MaterialIcons name={getRoleIcon(user.role)} size={18} color={getRoleColor(user.role)} />
              <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>{user.role}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={handleEditProfile}>
            <MaterialIcons name="edit" size={18} color={colors.primary} />
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => {
                setShowEditModal(false);
                setSelectedImageUri(null);
              }}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Profile Picture Section */}
              <View style={styles.photoSection}>
                <Text style={[styles.label, { color: colors.text }]}>Profile Picture</Text>
                <View style={styles.photoContainer}>
                  {displayImageUri ? (
                    <Image source={{ uri: displayImageUri }} style={styles.previewAvatar} />
                  ) : (
                    <View style={[styles.previewAvatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={styles.previewAvatarText}>
                        {formData.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.changePhotoButton, { backgroundColor: colors.primary }]}
                    onPress={pickImage}
                    disabled={uploadingPhoto || editing}>
                    {uploadingPhoto ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="camera-alt" size={20} color="#fff" />
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  {selectedImageUri && (
                    <TouchableOpacity
                      style={[styles.removePhotoButton, { backgroundColor: colors.error }]}
                      onPress={() => setSelectedImageUri(null)}>
                      <MaterialIcons name="delete" size={18} color="#fff" />
                      <Text style={styles.removePhotoText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Display Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Display Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.border, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.icon}
                  value={formData.displayName}
                  onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                />
              </View>

              {/* Footer Buttons */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setShowEditModal(false);
                    setSelectedImageUri(null);
                  }}
                  disabled={editing}>
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveProfile}
                  disabled={editing || uploadingPhoto}>
                  {editing || uploadingPhoto ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  profileSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    marginBottom: 4,
    textAlign: 'center',
  },
  phone: {
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
    gap: 8,
  },
  roleText: {
    fontWeight: '600',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  editButtonText: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.xxxl,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...Typography.h3,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  photoSection: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  previewAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    ...Shadows.md,
  },
  previewAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  changePhotoText: {
    color: '#fff',
    ...Typography.captionBold,
  },
  removePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  removePhotoText: {
    color: '#fff',
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.bodyBold,
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: Typography.sizes.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor handled inline
  },
  modalButtonText: {
    ...Typography.bodyBold,
  },
});
