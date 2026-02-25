import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { serviceRequestService } from '../../src/services/serviceRequestService';
import { propertyService } from '../../src/services/propertyService';
import { ServiceProvider, ServiceType, Property } from '../../src/types';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../src/constants/theme';
import { showSuccessToast } from '../../src/utils/toast';
import { getFriendlyErrorMessage } from '../../src/utils/errorMessages';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthGate } from '../../components/AuthGate';

type RequestFormData = {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  budget: string;
  preferredDate: string;
  propertyId: string;
};

export default function RequestServiceScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Redirect guests immediately
  useEffect(() => {
    if (isGuest) {
      router.replace('/(tabs)/home');
    }
  }, [isGuest, router]);

  if (isGuest) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<RequestFormData>({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    budget: '',
    preferredDate: '',
    propertyId: '',
  });

  useEffect(() => {
    if (providerId) {
      loadProvider();
      if (user) {
        loadUserProperties();
      }
    }
  }, [providerId, user]);

  const loadProvider = async () => {
    if (!providerId) return;

    try {
      setLoading(true);
      const data = await serviceRequestService.getServiceProvider(providerId);
      if (!data) {
        Alert.alert('Error', 'Provider not found');
        router.back();
        return;
      }
      setProvider(data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error loading provider:', error);
      }
      Alert.alert('Error', 'Failed to load provider information');
    } finally {
      setLoading(false);
    }
  };

  const loadUserProperties = async () => {
    if (!user) return;

    try {
      const data = await propertyService.getPropertiesByOwner(user.uid, user);
      setProperties(data);
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading properties:', error);
      }
    }
  };

  const handlePropertySelect = (property: Property) => {
    setFormData({
      ...formData,
      propertyId: property.id,
      address: property.location.address,
      city: property.location.city,
      state: property.location.state,
      zipCode: property.location.zipCode,
    });
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a request title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
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
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to request a service');
      return;
    }

    if (!provider) {
      Alert.alert('Error', 'Provider information not available');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const serviceType: ServiceType = provider.role === 'Constructor' ? 'construction' : 'renovation';

      const requestData = {
        requesterId: user.uid,
        providerId: provider.uid,
        serviceType,
        propertyId: formData.propertyId || undefined,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim(),
        },
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        preferredDate: formData.preferredDate ? new Date(formData.preferredDate) : undefined,
      };

      await serviceRequestService.createServiceRequest(requestData);

      showSuccessToast('Service request sent successfully. The provider will be notified.');
      router.back();
    } catch (error: any) {
      if (__DEV__) {
        console.warn('Error creating service request:', {
          code: error?.code,
          message: error?.message,
        });
      }
      const friendly = getFriendlyErrorMessage(
        error,
        'Failed to send service request. Please try again.'
      );
      Alert.alert('Error', friendly);
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormField = (field: keyof RequestFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading provider...</Text>
        </View>
      </View>
    );
  }

  if (!provider) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>Provider not found</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Request Service</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Provider Info */}
        <View style={[styles.providerCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.providerHeader}>
            {provider.photoURL ? (
              <Image source={{ uri: provider.photoURL }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: provider.role === 'Constructor' ? '#FF9500' : '#AF52DE' },
                ]}>
                <Text style={styles.avatarText}>
                  {provider.displayName?.charAt(0).toUpperCase() || provider.email.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: colors.text }]}>
                {provider.displayName || 'Service Provider'}
              </Text>
              <Text style={[styles.providerRole, { color: colors.textSecondary }]}>{provider.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* Select Property (if user has properties) */}
          {properties.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Property (Optional)</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Choose a property to auto-fill location
              </Text>
              <View style={styles.propertiesScroll}>
                {properties.map((property) => (
                  <TouchableOpacity
                    key={property.id}
                    style={[
                      styles.propertyChip,
                      formData.propertyId === property.id
                        ? { backgroundColor: colors.primary }
                        : { backgroundColor: colors.border },
                    ]}
                    onPress={() => handlePropertySelect(property)}>
                    <Text
                      style={[
                        styles.propertyChipText,
                        { color: formData.propertyId === property.id ? '#fff' : colors.text },
                      ]}
                      numberOfLines={1}>
                      {property.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Request Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Request Details</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
                placeholder="e.g., Kitchen Renovation"
                placeholderTextColor={colors.textSecondary}
                value={formData.title}
                onChangeText={(value) => updateFormField('title', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.border, color: colors.text }]}
                placeholder="Describe the work you need..."
                placeholderTextColor={colors.textSecondary}
                value={formData.description}
                onChangeText={(value) => updateFormField('description', value)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Service Location</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Address *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
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
                  style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
                  placeholder="City"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.city}
                  onChangeText={(value) => updateFormField('city', value)}
                />
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <Text style={[styles.label, { color: colors.text }]}>State *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
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
                style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
                placeholder="12345"
                placeholderTextColor={colors.textSecondary}
                value={formData.zipCode}
                onChangeText={(value) => updateFormField('zipCode', value.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Additional Information (Optional)</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Budget ($)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                value={formData.budget}
                onChangeText={(value) => updateFormField('budget', value.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Preferred Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.border, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={formData.preferredDate}
                onChangeText={(value) => updateFormField('preferredDate', value)}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Send Request</Text>
              </>
            )}
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
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
    marginTop: Spacing.xxxl,
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: FontSizes.body,
  },
  errorText: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginTop: Spacing.base,
  },
  providerCard: {
    marginBottom: Spacing.base,
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  providerRole: {
    fontSize: 14,
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
    borderRadius: Radius.base,
    padding: Spacing.base,
    fontSize: FontSizes.body,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: Radius.base,
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
  propertiesScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  propertyChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  propertyChipText: {
    fontSize: FontSizes.caption,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.base,
    paddingVertical: Spacing.base + 4,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
});

