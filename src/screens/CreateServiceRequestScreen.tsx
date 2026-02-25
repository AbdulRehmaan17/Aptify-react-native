import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Surface,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { serviceRequestService } from '../services/serviceRequestService';
import { propertyService } from '../services/propertyService';
import { Property, ServiceType } from '../types';
import { AppStackParamList } from '../navigation/types';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/ui';
import { MaterialIcons } from '@expo/vector-icons';

type CreateServiceRequestScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;
type CreateServiceRequestScreenRouteProp = RouteProp<AppStackParamList, 'CreateServiceRequest'>;

interface ServiceRequestFormData {
  title: string;
  description: string;
  propertyId: string;
  serviceType: ServiceType;
  providerId?: string;
}

export default function CreateServiceRequestScreen() {
  const navigation = useNavigation<CreateServiceRequestScreenNavigationProp>();
  const route = useRoute<CreateServiceRequestScreenRouteProp>();
  const { user, loading: authLoading } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const routeParams = route.params as { providerId?: string } | undefined;
  const initialProviderId = routeParams?.providerId || '';

  const [formData, setFormData] = useState<ServiceRequestFormData>({
    title: '',
    description: '',
    propertyId: '',
    serviceType: 'renovation',
    providerId: initialProviderId,
  });

  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [propertyError, setPropertyError] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      setProperties([]);
      return;
    }

    loadUserProperties();
  }, [user, authLoading]);

  const loadUserProperties = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      // For tenants, we might want to show rented properties or all available properties
      // For now, let's show all approved properties they can select from
      const data = await propertyService.getAllProperties({
        approved: true,
        status: 'available',
      });
      setProperties(data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[CreateServiceRequestScreen] ❌ Error loading properties:', error);
      }
      Alert.alert('Error', 'Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate title
    if (!formData.title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError('');
    }

    // Validate description
    if (!formData.description.trim()) {
      setDescriptionError('Issue description is required');
      isValid = false;
    } else {
      setDescriptionError('');
    }

    // Validate property selection
    if (!formData.propertyId) {
      setPropertyError('Please select a property');
      isValid = false;
    } else {
      setPropertyError('');
    }

    return isValid;
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setFormData((prev) => ({
      ...prev,
      propertyId: property.id,
    }));
    setPropertyError('');
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a service request');
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!selectedProperty) {
      Alert.alert('Error', 'Please select a property');
      return;
    }

    // If no provider selected, we need to handle this
    // For now, we'll require a provider or show an error
    if (!formData.providerId) {
      Alert.alert(
        'Provider Required',
        'Please select a service provider first. Navigate to the Services tab to find a provider.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setSubmitting(true);

      const requestData: Omit<import('../types').ServiceRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        requesterId: user.uid,
        providerId: formData.providerId,
        serviceType: formData.serviceType,
        propertyId: selectedProperty.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: {
          address: selectedProperty.location.address,
          city: selectedProperty.location.city,
          state: selectedProperty.location.state,
          zipCode: selectedProperty.location.zipCode,
        },
      };

      await serviceRequestService.createServiceRequest(requestData);

      Alert.alert(
        'Success',
        'Service request created successfully! The provider will be notified.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      if (__DEV__) {
        console.error('[CreateServiceRequestScreen] ❌ Error creating request:', error);
      }
      Alert.alert('Error', error.message || 'Failed to create service request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!user && !authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text variant="bodyMedium" style={[styles.loadingText, { color: colors.textSecondary }]}>
            Please sign in to request a service.
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text variant="bodyMedium" style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading properties...
          </Text>
        </View>
      </View>
    );
  }

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
            Request Service
          </Text>
          <View style={{ width: 40 }} />
        </Surface>

        <View style={styles.content}>
          {/* Service Type Selection */}
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Service Type *
            </Text>
            <SegmentedButtons
              value={formData.serviceType}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, serviceType: value as ServiceType }))
              }
              buttons={[
                {
                  value: 'renovation',
                  label: 'Renovation',
                  icon: 'handyman',
                },
                {
                  value: 'construction',
                  label: 'Construction',
                  icon: 'construction',
                },
              ]}
              style={styles.typeButtons}
            />
          </Surface>

          {/* Property Selection */}
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Select Property *
            </Text>
            {propertyError ? (
              <Text variant="bodySmall" style={[styles.errorText, { color: '#FF3B30' }]}>
                {propertyError}
              </Text>
            ) : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.propertyScroll}
              contentContainerStyle={styles.propertyScrollContent}
            >
              {properties.map((property) => {
                const isSelected = formData.propertyId === property.id;
                return (
                  <TouchableOpacity
                    key={property.id}
                    onPress={() => handlePropertySelect(property)}
                    activeOpacity={0.7}
                  >
                    <Surface
                      style={[
                        styles.propertyCard,
                        {
                          backgroundColor: isSelected ? colors.tint : colors.background,
                          borderColor: isSelected ? colors.tint : colors.border,
                        },
                      ]}
                    >
                      {property.images && property.images.length > 0 ? (
                        <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
                      ) : (
                        <View style={[styles.propertyImagePlaceholder, { backgroundColor: colors.border }]}>
                          <MaterialIcons name="home" size={32} color={colors.textSecondary} />
                        </View>
                      )}
                      <View style={styles.propertyInfo}>
                        <Text
                          variant="bodyMedium"
                          style={[
                            styles.propertyTitle,
                            { color: isSelected ? '#fff' : colors.text },
                          ]}
                          numberOfLines={1}
                        >
                          {property.title}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={[
                            styles.propertyLocation,
                            { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {property.location.city}, {property.location.state}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={[
                            styles.propertyPrice,
                            { color: isSelected ? '#fff' : colors.tint },
                          ]}
                        >
                          {formatPrice(property.price)}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.selectedBadge}>
                          <MaterialIcons name="check-circle" size={20} color="#fff" />
                        </View>
                      )}
                    </Surface>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {properties.length === 0 && (
              <Text variant="bodyMedium" style={[styles.emptyText, { color: colors.textSecondary }]}>
                No properties available. Please add a property first.
              </Text>
            )}
          </Surface>

          {/* Request Details */}
          <Surface style={[styles.section, { backgroundColor: colors.card }]}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: colors.text }]}>
              Request Details
            </Text>

            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(value) => {
                setFormData((prev) => ({ ...prev, title: value }));
                if (titleError) setTitleError('');
              }}
              mode="outlined"
              placeholder="e.g., Kitchen Renovation Needed"
              error={!!titleError}
              style={styles.input}
            />
            {titleError ? (
              <Text variant="bodySmall" style={[styles.errorText, { color: '#FF3B30' }]}>
                {titleError}
              </Text>
            ) : null}

            <TextInput
              label="Issue Description *"
              value={formData.description}
              onChangeText={(value) => {
                setFormData((prev) => ({ ...prev, description: value }));
                if (descriptionError) setDescriptionError('');
              }}
              mode="outlined"
              multiline
              numberOfLines={6}
              placeholder="Describe the issue or service needed in detail..."
              error={!!descriptionError}
              style={styles.textArea}
            />
            {descriptionError ? (
              <Text variant="bodySmall" style={[styles.errorText, { color: '#FF3B30' }]}>
                {descriptionError}
              </Text>
            ) : null}

            {selectedProperty && (
              <Surface style={[styles.selectedPropertyInfo, { backgroundColor: colors.border }]}>
                <View style={styles.propertyInfoRow}>
                  <MaterialIcons name="location-on" size={20} color={colors.tint} />
                  <View style={styles.propertyInfoText}>
                    <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                      Service Location
                    </Text>
                    <Text variant="bodyMedium" style={{ color: colors.text }}>
                      {selectedProperty.location.address}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                      {selectedProperty.location.city}, {selectedProperty.location.state}{' '}
                      {selectedProperty.location.zipCode}
                    </Text>
                  </View>
                </View>
              </Surface>
            )}
          </Surface>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || !formData.providerId}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
            icon="send"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>

          {!formData.providerId && (
            <Text variant="bodySmall" style={[styles.note, { color: colors.textSecondary }]}>
              Note: Please select a service provider from the Services tab before creating a request.
            </Text>
          )}
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
    marginBottom: Spacing.base,
    fontWeight: '600',
  },
  typeButtons: {
    marginTop: Spacing.sm,
  },
  propertyScroll: {
    marginTop: Spacing.base,
  },
  propertyScrollContent: {
    paddingRight: Spacing.lg,
  },
  propertyCard: {
    width: 200,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.base,
    borderWidth: 2,
    ...Shadows.sm,
  },
  propertyImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  propertyImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propertyInfo: {
    padding: Spacing.sm,
  },
  propertyTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  propertyLocation: {
    marginBottom: Spacing.xs,
  },
  propertyPrice: {
    fontWeight: '600',
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.base,
    fontStyle: 'italic',
  },
  input: {
    marginBottom: Spacing.sm,
  },
  textArea: {
    marginBottom: Spacing.sm,
    minHeight: 120,
  },
  errorText: {
    marginLeft: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  selectedPropertyInfo: {
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  propertyInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propertyInfoText: {
    marginLeft: Spacing.sm,
    flex: 1,
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
    marginTop: Spacing.sm,
  },
});

