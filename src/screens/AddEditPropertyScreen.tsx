import { Colors } from '@/constants/colors';
import { BorderRadius, Shadows, Spacing } from '@/constants/ui';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  SegmentedButtons,
  Surface,
  Text,
  TextInput
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../navigation/types';
import { propertyService } from '../services/propertyService';
import { Property } from '../types';

type AddEditPropertyScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;
type AddEditPropertyScreenRouteProp = RouteProp<AppStackParamList, 'CreateProperty'> | RouteProp<AppStackParamList, 'EditProperty'>;

const PROPERTY_TYPES: Property['propertyType'][] = ['house', 'apartment', 'condo', 'townhouse', 'land', 'other'];

interface PropertyFormData {
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
}

export default function AddEditPropertyScreen() {
  const navigation = useNavigation<AddEditPropertyScreenNavigationProp>();
  const route = useRoute<AddEditPropertyScreenRouteProp>();
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Check if editing (propertyId would be passed via route params if editing)
  const isEditMode = route.name === 'EditProperty';
  const editRoute = route as RouteProp<AppStackParamList, 'EditProperty'>;
  const [propertyId, setPropertyId] = useState<string | null>(
    isEditMode ? editRoute.params.id : null
  );

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
  const [newImages, setNewImages] = useState<string[]>([]); // Local images to upload
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && propertyId) {
      loadProperty();
    }
  }, [isEditMode, propertyId]);

  const loadProperty = async () => {
    if (!propertyId) return;

    try {
      setLoading(true);
      const property = await propertyService.getPropertyById(propertyId, user ?? null);
      
      if (!property) {
        Alert.alert('Error', 'Property not found.');
        navigation.goBack();
        return;
      }

      // Check if user owns this property
      if (property.ownerId !== user?.uid) {
        Alert.alert('Error', 'You do not have permission to edit this property.');
        navigation.goBack();
        return;
      }

      // Populate form with property data
      setFormData({
        title: property.title,
        description: property.description,
        price: property.price.toString(),
        address: property.location.address,
        city: property.location.city,
        state: property.location.state,
        zipCode: property.location.zipCode,
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        area: property.area?.toString() || '',
        propertyType: property.propertyType,
      });

      setImages(property.images || []);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AddEditPropertyScreen] ❌ Error loading property:', error);
      }
      Alert.alert('Error', 'Failed to load property. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        const newImageUris = result.assets.map((asset) => asset.uri);
        setNewImages((prev) => [...prev, ...newImageUris]);
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AddEditPropertyScreen] ❌ Error picking image:', error);
      }
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index: number, isNewImage: boolean) => {
    if (isNewImage) {
      setNewImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadImages = async (propertyId: string, imageUris: string[]): Promise<string[]> => {
    if (imageUris.length === 0) return [];

    const uploadedUrls: string[] = [];
    setUploading(true);

    try {
      for (let i = 0; i < imageUris.length; i++) {
        const imageUri = imageUris[i];
        const imageName = `image_${Date.now()}_${i}.jpg`;
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
    // if (images.length === 0 && newImages.length === 0) {
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
        images: images, // Existing images (for edit mode)
        propertyType: formData.propertyType,
        status: isEditMode ? 'pending' : 'pending', // Keep status as pending for edits
        approved: isEditMode ? false : false, // Reset approval on edit
        ownerId: user.uid,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        area: formData.area ? parseFloat(formData.area) : undefined,
      };

      let finalPropertyId = propertyId;

      if (isEditMode && propertyId) {
        // Update existing property
        await propertyService.updateProperty(propertyId, propertyData, user);
      } else {
        // Create new property
        finalPropertyId = await propertyService.createProperty(propertyData, user);
        setPropertyId(finalPropertyId);
      }

      // Upload new images if any
      if (newImages.length > 0 && finalPropertyId) {
        const uploadedUrls = await uploadImages(finalPropertyId, newImages);
        const allImages = [...images, ...uploadedUrls];
        
        // Update property with all image URLs
        await propertyService.updateProperty(finalPropertyId, { images: allImages }, user);
      }

      Alert.alert(
        'Success',
        isEditMode
          ? 'Property updated successfully! It will be reviewed before being published.'
          : 'Property listed successfully! It will be reviewed before being published.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      if (__DEV__) {
        console.error('[AddEditPropertyScreen] ❌ Error saving property:', error);
      }
      Alert.alert('Error', error.message || 'Failed to save property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormField = (field: keyof PropertyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text variant="bodyMedium" style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading property...
          </Text>
        </View>
      </View>
    );
  }

  const allImages = [...images, ...newImages];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Surface style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text variant="titleLarge" style={[styles.title, { color: colors.text }]}>
            {isEditMode ? 'Edit Property' : 'List Property'}
          </Text>
          <View style={{ width: 40 }} />
        </Surface>

        <View style={styles.content}>
          {/* Images Section */}
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Property Images *
            </Text>
            <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Add at least one image of your property
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {allImages.map((uri, index) => {
                const isNewImage = index >= images.length;
                return (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(isNewImage ? index - images.length : index, isNewImage)}
                    >
                      <MaterialIcons name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
              <TouchableOpacity
                style={[styles.addImageButton, { borderColor: colors.border }]}
                onPress={()=>{
                  
                }}
                disabled={uploading}
              >
                <MaterialIcons name="add-photo-alternate" size={32} color={colors.textSecondary} />
                <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: Spacing.xs }}>
                  Add Photo
                </Text>
              </TouchableOpacity>
            </ScrollView>
            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={colors.tint} />
                <Text variant="bodySmall" style={{ color: colors.textSecondary, marginLeft: Spacing.sm }}>
                  Uploading images...
                </Text>
              </View>
            )}
          </Surface>

          {/* Basic Information */}
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Basic Information
            </Text>

            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(value) => updateFormField('title', value)}
              mode="outlined"
              placeholder="e.g., Beautiful 3BR House in Downtown"
              style={styles.input}
            />

            <TextInput
              label="Description *"
              value={formData.description}
              onChangeText={(value) => updateFormField('description', value)}
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Describe your property in detail..."
              style={styles.textArea}
            />

            <TextInput
              label="Price ($) *"
              value={formData.price}
              onChangeText={(value) => updateFormField('price', value.replace(/[^0-9.]/g, ''))}
              mode="outlined"
              keyboardType="numeric"
              placeholder="0"
              style={styles.input}
              left={<TextInput.Icon icon="currency-usd" />}
            />

            <View style={styles.typeContainer}>
              <Text variant="bodyLarge" style={[styles.typeLabel, { color: colors.text }]}>
                Property Type *
              </Text>
              <SegmentedButtons
                value={formData.propertyType}
                onValueChange={(value) => updateFormField('propertyType', value as Property['propertyType'])}
                buttons={PROPERTY_TYPES.map((type) => ({
                  value: type,
                  label: type.charAt(0).toUpperCase() + type.slice(1),
                }))}
                style={styles.typeButtons}
              />
            </View>
          </Surface>

          {/* Location */}
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Location
            </Text>

            <TextInput
              label="Address *"
              value={formData.address}
              onChangeText={(value) => updateFormField('address', value)}
              mode="outlined"
              placeholder="Street address"
              style={styles.input}
              left={<TextInput.Icon icon="map-marker" />}
            />

            <View style={styles.row}>
              <TextInput
                label="City *"
                value={formData.city}
                onChangeText={(value) => updateFormField('city', value)}
                mode="outlined"
                placeholder="City"
                style={[styles.input, styles.halfWidth]}
              />
              <TextInput
                label="State *"
                value={formData.state}
                onChangeText={(value) => updateFormField('state', value)}
                mode="outlined"
                placeholder="State"
                style={[styles.input, styles.halfWidth]}
              />
            </View>

            <TextInput
              label="Zip Code *"
              value={formData.zipCode}
              onChangeText={(value) => updateFormField('zipCode', value.replace(/[^0-9]/g, ''))}
              mode="outlined"
              keyboardType="numeric"
              placeholder="12345"
              maxLength={5}
              style={styles.input}
            />
          </Surface>

          {/* Property Details */}
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Property Details (Optional)
            </Text>

            <View style={styles.row}>
              <TextInput
                label="Bedrooms"
                value={formData.bedrooms}
                onChangeText={(value) => updateFormField('bedrooms', value.replace(/[^0-9]/g, ''))}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0"
                style={[styles.input, styles.halfWidth]}
                left={<TextInput.Icon icon="bed" />}
              />
              <TextInput
                label="Bathrooms"
                value={formData.bathrooms}
                onChangeText={(value) => updateFormField('bathrooms', value.replace(/[^0-9.]/g, ''))}
                mode="outlined"
                keyboardType="numeric"
                placeholder="0"
                style={[styles.input, styles.halfWidth]}
                left={<TextInput.Icon icon="shower" />}
              />
            </View>

            <TextInput
              label="Area (sqft)"
              value={formData.area}
              onChangeText={(value) => updateFormField('area', value.replace(/[^0-9.]/g, ''))}
              mode="outlined"
              keyboardType="numeric"
              placeholder="0"
              style={styles.input}
              left={<TextInput.Icon icon="square-foot" />}
            />
          </Surface>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || uploading}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
          >
            {isEditMode ? 'Update Property' : 'List Property'}
          </Button>

          <Text variant="bodySmall" style={[styles.note, { color: colors.textSecondary }]}>
            * Your property will be reviewed before being published. Status will be set to "pending" until approved.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  loadingText: {
    marginTop: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingTop: 60,
    ...Shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  sectionSubtitle: {
    marginBottom: Spacing.base,
  },
  input: {
    marginBottom: Spacing.base,
  },
  textArea: {
    marginBottom: Spacing.base,
    minHeight: 120,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.base,
  },
  halfWidth: {
    flex: 1,
  },
  typeContainer: {
    marginTop: Spacing.sm,
  },
  typeLabel: {
    marginBottom: Spacing.sm,
    fontWeight: '500',
  },
  typeButtons: {
    marginBottom: Spacing.xs,
  },
  imageScroll: {
    marginTop: Spacing.base,
  },
  imageContainer: {
    width: 140,
    height: 140,
    marginRight: Spacing.base,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 140,
    height: 140,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
  },
  submitButton: {
    marginTop: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.md,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
  note: {
    textAlign: 'center',
    lineHeight: 18,
  },
});

