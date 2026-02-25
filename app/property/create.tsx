import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSizes, Radius, Spacing } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { propertyService } from '../../src/services/propertyService';
import { Property } from '../../src/types';
import { getFriendlyErrorMessage } from '../../src/utils/errorMessages';
import { showSuccessToast } from '../../src/utils/toast';

type PropertyFormData = {
  title: string;
  description: string;
  price: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  propertyType: Property['propertyType'];
};

const PROPERTY_TYPES: Property['propertyType'][] = ['house', 'apartment', 'condo', 'townhouse', 'land', 'other'];

export default function CreatePropertyScreen() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Redirect guests immediately
  useEffect(() => {
    if (isGuest) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isGuest, router]);

  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    propertyType: 'house',
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to upload property images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      if (__DEV__) {
        if (__DEV__) {
          console.error('Error picking image:', error);
        }
      }
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (propertyId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    setUploading(true);

    try {
      for (let i = 0; i < images.length; i++) {
        const imageUri = images[i];
        const imageName = `image_${i}_${Date.now()}.jpg`;
        const url = await propertyService.uploadPropertyImage(imageUri, propertyId, imageName);
        uploadedUrls.push(url);
      }
      return uploadedUrls;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a property title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a property description');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Validation Error', 'Please enter an address');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Validation Error', 'Please enter a city');
      return false;
    }
    if (!formData.state.trim()) {
      Alert.alert('Validation Error', 'Please enter a state');
      return false;
    }
    if (!formData.zipCode.trim()) {
      Alert.alert('Validation Error', 'Please enter a zip code');
      return false;
    }
    // if (images.length === 0) {
    //   Alert.alert('Validation Error', 'Please add at least one property image');
    //   return false;
    // }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to list a property');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      // Create property first (without images)
      const propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
        },
        images: [], // Will be updated after upload
        propertyType: formData.propertyType,
        status: 'pending',
        approved: false,
        ownerId: user.uid,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
      };

      // Create property in Firestore
      const propertyId = await propertyService.createProperty(propertyData, user);

      // Upload images
      const imageUrls = await uploadImages(propertyId);

      // Update property with image URLs
      await propertyService.updateProperty(propertyId, { images: imageUrls }, user);

      // Non-blocking success feedback
      showSuccessToast('Property listed successfully! It will be reviewed before being published.');
      router.back();
    } catch (error: any) {
      if (__DEV__) {
        console.warn('Error creating property:', {
          code: error?.code,
          message: error?.message,
        });
      }
      // Handle permission errors gracefully
      if (error?.message?.includes('Authentication required') || error?.message?.includes('Access denied')) {
        Alert.alert(
          'Access Denied',
          'You must be logged in as an Owner to create properties.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
        );
      } else {
        const friendly = getFriendlyErrorMessage(
          error,
          'Failed to create property. Please try again.'
        );
        Alert.alert('Error', friendly);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormField = (field: keyof PropertyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>List Property</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {/* Images Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Property Images *</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Add at least one image of your property
            </Text>
            <View style={styles.imageScroll}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageContainer}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}>
                    <MaterialIcons name="close" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addImageButton, { backgroundColor: colors.border }]}
                onPress={pickImage}
                disabled={uploading}>
                <MaterialIcons name="add-photo-alternate" size={32} color={colors.textSecondary} />
                <Text style={[styles.addImageText, { color: colors.textSecondary }]}>Add Photo</Text>
              </TouchableOpacity>
            </View>
            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>Uploading images...</Text>
              </View>
            )}
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Beautiful 3BR House in Downtown"
                placeholderTextColor={colors.textSecondary}
                value={formData.title}
                onChangeText={(value) => updateFormField('title', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Describe your property in detail..."
                placeholderTextColor={colors.textSecondary}
                value={formData.description}
                onChangeText={(value) => updateFormField('description', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Price ($) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={formData.price}
                onChangeText={(value) => updateFormField('price', value.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Property Type *</Text>
              <View style={styles.typeScroll}>
                {PROPERTY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeChip,
                      formData.propertyType === type
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.border },
                    ]}
                    onPress={() => updateFormField('propertyType', type)}>
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: formData.propertyType === type ? '#fff' : colors.text },
                      ]}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Address *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="Street address"
                placeholderTextColor={colors.textSecondary}
                value={formData.address}
                onChangeText={(value) => updateFormField('address', value)}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>City *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.city}
                  onChangeText={(value) => updateFormField('city', value)}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>State *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="State"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.state}
                  onChangeText={(value) => updateFormField('state', value)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Zip Code *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="12345"
                placeholderTextColor={colors.textSecondary}
                value={formData.zipCode}
                onChangeText={(value) => updateFormField('zipCode', value.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          {/* Property Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Property Details (Optional)</Text>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>Bedrooms</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.bedrooms}
                  onChangeText={(value) => updateFormField('bedrooms', value.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>Bathrooms</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.bathrooms}
                  onChangeText={(value) => updateFormField('bathrooms', value.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Area (sqft)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={formData.area}
                onChangeText={(value) => updateFormField('area', value.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting || uploading}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>List Property</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            * Your property will be reviewed before being published. Status will be set to "pending" until approved.
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
  },
  content: {
    marginBottom: Spacing.base,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: FontSizes.caption,
    marginBottom: Spacing.md,
    opacity: 0.7,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: Radius.md,
    padding: Spacing.base,
    fontSize: FontSizes.body,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: Radius.md,
    padding: Spacing.base,
    fontSize: FontSizes.body,
    minHeight: 120,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  imageScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: 140,
    height: 140,
    resizeMode: 'cover',
  },
  removeImageButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -132,
    marginLeft: 112,
  },
  addImageButton: {
    width: 140,
    height: 140,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addImageText: {
    marginTop: 8,
    fontSize: 12,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
  },
  typeScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  typeChipText: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.base + 4,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});

