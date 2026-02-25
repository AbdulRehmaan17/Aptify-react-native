import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { guestService } from '../../src/services/guestService';
import { Property } from '../../src/types';
import { Colors, Spacing, Radius, Typography, Shadows } from '../../src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { PropertyCardSkeleton } from '../../components/SkeletonComponents';
import { EmptyState } from '../../src/components/EmptyState';

type FilterState = {
  minPrice: string;
  maxPrice: string;
  city: string;
  state: string;
};

export default function GuestListingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    minPrice: '',
    maxPrice: '',
    city: '',
    state: '',
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const loadLocations = async () => {
    try {
      const citiesSet = new Set<string>();
      const statesSet = new Set<string>();
      properties.forEach((property) => {
        if (property.location.city) citiesSet.add(property.location.city);
        if (property.location.state) statesSet.add(property.location.state);
      });
      setCities(Array.from(citiesSet).sort());
      setStates(Array.from(statesSet).sort());
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading locations:', error);
      }
    }
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await guestService.getListings();
      setProperties(data);
      setFilteredProperties(data);
      const citiesSet = new Set<string>();
      const statesSet = new Set<string>();
      data.forEach((property) => {
        if (property.location.city) citiesSet.add(property.location.city);
        if (property.location.state) statesSet.add(property.location.state);
      });
      setCities(Array.from(citiesSet).sort());
      setStates(Array.from(statesSet).sort());
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error loading listings:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    await loadLocations();
    setRefreshing(false);
  };

  const applyFilters = () => {
    let filtered = [...properties];

    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter((p) => p.price >= minPrice);
      }
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter((p) => p.price <= maxPrice);
      }
    }

    if (filters.city) {
      filtered = filtered.filter((p) => p.location.city === filters.city);
    }

    if (filters.state) {
      filtered = filtered.filter((p) => p.location.state === filters.state);
    }

    setFilteredProperties(filtered);
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      city: '',
      state: '',
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Properties</Text>
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={[styles.filterButton, { backgroundColor: colors.primary }, Shadows.sm]}>
              <MaterialIcons name="filter-list" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>

          {/* Guest Notice Card */}
          <View style={[styles.guestCard, { backgroundColor: `${colors.primary}10`, borderColor: colors.border }, Shadows.sm]}>
            <View style={[styles.guestIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <MaterialIcons name="info" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.guestText, { color: colors.text }]}>
              Sign in to contact owners and save favorites
            </Text>
          </View>

          {/* Properties List */}
          {loading ? (
            <View style={styles.propertiesList}>
              {[1, 2, 3].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </View>
          ) : filteredProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="home"
                title="No properties found"
                message="Try adjusting your filters or check back later"
              />
            </View>
          ) : (
            <View style={styles.propertiesList}>
              {filteredProperties.map((property) => (
                <TouchableOpacity
                  key={property.id}
                  style={[styles.propertyCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}
                  onPress={() => router.push(`/property/${property.id}`)}
                  activeOpacity={0.7}>
                  {property.images && property.images.length > 0 ? (
                    <Image source={{ uri: property.images[0] }} style={styles.propertyImage} />
                  ) : (
                    <View style={[styles.propertyImagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                      <MaterialIcons name="home" size={32} color={colors.icon} />
                    </View>
                  )}
                  <View style={styles.propertyContent}>
                    <Text style={[styles.propertyPrice, { color: colors.primary }]}>
                      ${property.price.toLocaleString()}
                    </Text>
                    <Text style={[styles.propertyTitle, { color: colors.text }]} numberOfLines={1}>
                      {property.title}
                    </Text>
                    <View style={styles.propertyLocationRow}>
                      <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
                      <Text style={[styles.propertyLocationText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {property.location.city}, {property.location.state}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Filter Modal */}
          <Modal visible={showFilters} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.card }, Shadows.lg]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <View style={styles.modalHeaderTitleContainer}>
                    <MaterialIcons name="filter-list" size={24} color={colors.primary} />
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowFilters(false)}>
                    <MaterialIcons name="close" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Min Price</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      value={filters.minPrice}
                      onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Max Price</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                      placeholder="No limit"
                      placeholderTextColor={colors.textSecondary}
                      value={filters.maxPrice}
                      onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>City</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                      placeholder="Any city"
                      placeholderTextColor={colors.textSecondary}
                      value={filters.city}
                      onChangeText={(text) => setFilters({ ...filters, city: text })}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>State</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text, borderColor: colors.border }]}
                      placeholder="Any state"
                      placeholderTextColor={colors.textSecondary}
                      value={filters.state}
                      onChangeText={(text) => setFilters({ ...filters, state: text })}
                    />
                  </View>
                </ScrollView>

                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: colors.border }]}
                    onPress={clearFilters}>
                    <Text style={[styles.modalButtonText, { color: colors.text }]}>Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: colors.primary }, Shadows.sm]}
                    onPress={() => setShowFilters(false)}>
                    <Text style={[styles.modalButtonText, { color: colors.textInverse }]}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
    borderRadius: Radius.sm,
  },
  title: {
    flex: 1,
    ...Typography.h2,
    fontWeight: '700',
  },
  filterButton: {
    padding: Spacing.sm,
    borderRadius: Radius.md,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  guestIconContainer: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestText: {
    flex: 1,
    ...Typography.body,
  },
  propertiesList: {
    gap: Spacing.md,
  },
  propertyCard: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  propertyImage: {
    height: 200,
    resizeMode: 'cover',
    width: '100%',
  },
  propertyImagePlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  propertyContent: {
    padding: Spacing.md,
  },
  propertyPrice: {
    ...Typography.h4,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  propertyTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  propertyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  propertyLocationText: {
    ...Typography.caption,
    flex: 1,
  },
  emptyContainer: {
    marginTop: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    paddingBottom: Spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  modalHeaderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    ...Typography.body,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  modalButtonPrimary: {
    // backgroundColor set inline
  },
  modalButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
