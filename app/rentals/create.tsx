import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { colors, spacing, radius, shadows, typography } from '../../src/theme';
import { rentalService } from '../../src/services/rentalService';
import { Rental } from '../../src/types';
import { FloatingLabelInput } from '../../components/forms/FloatingLabelInput';

type RentalFormData = {
  title: string;
  description: string;
  monthlyRent: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: string;
  bathrooms: string;
  area: string;
  propertyType: Rental['propertyType'];
  availableFrom: string;
  leaseDuration: string;
};

const PROPERTY_TYPES: Rental['propertyType'][] = ['house', 'apartment', 'condo', 'townhouse', 'other'];

export default function CreateRentalScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<RentalFormData>({
    title: '',
    description: '',
    monthlyRent: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    propertyType: 'apartment',
    availableFrom: '',
    leaseDuration: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need access to your photos to upload rental images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages((prev) => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.monthlyRent || parseFloat(formData.monthlyRent) <= 0) {
      newErrors.monthlyRent = 'Valid monthly rent is required';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const rentalData: Omit<Rental, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        monthlyRent: parseFloat(formData.monthlyRent),
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
        },
        images,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
        propertyType: formData.propertyType,
        status: 'available',
        availableFrom: formData.availableFrom ? new Date(formData.availableFrom) : undefined,
        leaseDuration: formData.leaseDuration ? parseInt(formData.leaseDuration) : undefined,
      };

      await rentalService.createRental(rentalData, user);

      Alert.alert(
        'Success!',
        'Your rental listing has been submitted and is pending approval.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create rental listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>List Rental</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <FloatingLabelInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, title: text }));
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              error={errors.title}
            />

            <FloatingLabelInput
              label="Description *"
              value={formData.description}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, description: text }));
                if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
              }}
              error={errors.description}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 100 }}
            />

            <FloatingLabelInput
              label="Monthly Rent ($) *"
              value={formData.monthlyRent}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, monthlyRent: text.replace(/[^0-9]/g, '') }));
                if (errors.monthlyRent) setErrors((prev) => ({ ...prev, monthlyRent: '' }));
              }}
              error={errors.monthlyRent}
              keyboardType="numeric"
            />

            <FloatingLabelInput
              label="Address *"
              value={formData.address}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, address: text }));
                if (errors.address) setErrors((prev) => ({ ...prev, address: '' }));
              }}
              error={errors.address}
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <FloatingLabelInput
                  label="City *"
                  value={formData.city}
                  onChangeText={(text) => {
                    setFormData((prev) => ({ ...prev, city: text }));
                    if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                  }}
                  error={errors.city}
                />
              </View>
              <View style={styles.halfWidth}>
                <FloatingLabelInput
                  label="State *"
                  value={formData.state}
                  onChangeText={(text) => {
                    setFormData((prev) => ({ ...prev, state: text }));
                    if (errors.state) setErrors((prev) => ({ ...prev, state: '' }));
                  }}
                  error={errors.state}
                />
              </View>
            </View>

            <FloatingLabelInput
              label="ZIP Code *"
              value={formData.zipCode}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, zipCode: text }));
                if (errors.zipCode) setErrors((prev) => ({ ...prev, zipCode: '' }));
              }}
              error={errors.zipCode}
              keyboardType="numeric"
            />

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <FloatingLabelInput
                  label="Bedrooms"
                  value={formData.bedrooms}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, bedrooms: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfWidth}>
                <FloatingLabelInput
                  label="Bathrooms"
                  value={formData.bathrooms}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, bathrooms: text.replace(/[^0-9]/g, '') }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <FloatingLabelInput
              label="Area (sq ft)"
              value={formData.area}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, area: text.replace(/[^0-9]/g, '') }))}
              keyboardType="numeric"
            />

            <View style={styles.imageSection}>
              <Text style={styles.sectionLabel}>Images</Text>
              <TouchableOpacity style={styles.addImageButton} onPress={pickImage} activeOpacity={0.7}>
                <MaterialIcons name="add-photo-alternate" size={24} color={colors.primary} />
                <Text style={styles.addImageText}>Add Images</Text>
              </TouchableOpacity>
              {images.length > 0 && (
                <View style={styles.imageList}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageItem}>
                      <Image source={{ uri }} style={styles.thumbnail} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}>
                        <MaterialIcons name="close" size={20} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}>
              <Text style={styles.submitButtonText}>
                {submitting ? 'Creating...' : 'Create Rental Listing'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
    ...typography.title,
    color: colors.text,
  },
  scrollContent: {
    padding: spacing.base,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  imageSection: {
    marginTop: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  addImageText: {
    ...typography.label,
    color: colors.primary,
  },
  imageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  imageItem: {
    position: 'relative',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: radius.sm,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.bodyBold,
    color: colors.white,
  },
});
