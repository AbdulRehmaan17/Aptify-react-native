import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { propertyService } from '../services/propertyService';
import { Property } from '../types';
import { AppStackParamList } from '../navigation/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';

type PropertyListScreenNavigationProp = NativeStackNavigationProp<AppStackParamList>;

interface PropertyListScreenProps {
  filters?: {
    city?: string;
    state?: string;
    propertyType?: Property['propertyType'];
    status?: Property['status'];
    minPrice?: number;
    maxPrice?: number;
    approved?: boolean;
  };
}

export default function PropertyListScreen({ filters }: PropertyListScreenProps = {}) {
  const navigation = useNavigation<PropertyListScreenNavigationProp>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await propertyService.getAllProperties({
        approved: true,
        status: 'available',
        ...filters,
      });
      
      setProperties(data);
    } catch (error: any) {
      if (__DEV__) {
        console.error('[PropertyListScreen] ❌ Error loading properties:', error);
      }
      setError(error.message || 'Failed to load properties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProperties();
    setRefreshing(false);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'sold':
      case 'rented':
        return '#0a7ea4';
      default:
        return '#687076';
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetail', { id: propertyId });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text variant="body" style={[styles.loadingText, { color: colors.text }]}>
              Loading properties...
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.centerContainer}>
            <MaterialIcons name="error-outline" size={48} color={colors.error || '#FF3B30'} />
            <Text variant="title" style={[styles.errorText, { color: colors.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={loadProperties}
              style={[styles.retryButton, { backgroundColor: colors.tint }]}
            >
              <Text variant="body" style={styles.retryButtonText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
      {properties.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="home" size={64} color={colors.text} />
          <Text variant="title" style={[styles.emptyTitle, { color: colors.text }]}>
            No Properties Found
          </Text>
          <Text variant="muted" style={styles.emptySubtitle}>
            {filters ? 'Try adjusting your filters' : 'Check back later for new listings'}
          </Text>
        </View>
      ) : (
        properties.map((property) => (
          <TouchableOpacity
            key={property.id}
            onPress={() => handlePropertyPress(property.id)}
            activeOpacity={0.7}
          >
            <Card style={{ backgroundColor: colors.card }}>
              {/* Property Image */}
              <View style={styles.imageContainer}>
                {property.images && property.images.length > 0 ? (
                  <Image
                    source={{ uri: property.images[0] }}
                    style={styles.propertyImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
                    <MaterialIcons name="home" size={48} color={colors.text} />
                  </View>
                )}
                {/* Status Badge */}
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) }]}>
                  <Text variant="body" style={styles.statusText}>
                    {property.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text variant="title" style={[styles.propertyTitle, { color: colors.text }]} numberOfLines={1}>
                {property.title}
              </Text>

              {/* Location */}
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={16} color={colors.text} />
                <Text variant="muted" style={styles.locationText} numberOfLines={1}>
                  {property.location.address}, {property.location.city}, {property.location.state}
                </Text>
              </View>

              {/* Property Details */}
              {(property.bedrooms || property.bathrooms || property.area) && (
                <View style={styles.detailsRow}>
                  {property.bedrooms && (
                    <View style={styles.detailItem}>
                      <MaterialIcons name="bed" size={16} color={colors.text} />
                      <Text variant="muted" style={styles.detailText}>
                        {property.bedrooms} bed
                      </Text>
                    </View>
                  )}
                  {property.bathrooms && (
                    <View style={styles.detailItem}>
                      <MaterialIcons name="bathroom" size={16} color={colors.text} />
                      <Text variant="muted" style={styles.detailText}>
                        {property.bathrooms} bath
                      </Text>
                    </View>
                  )}
                  {property.area && (
                    <View style={styles.detailItem}>
                      <MaterialIcons name="square-foot" size={16} color={colors.text} />
                      <Text variant="muted" style={styles.detailText}>
                        {property.area} sqft
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Price and Type */}
              <View style={styles.footerRow}>
                <Text variant="title" style={[styles.price, { color: colors.tint }]}>
                  {formatPrice(property.price)}
                </Text>
                <View style={[styles.typeChip, { backgroundColor: colors.border }]}>
                  <Text variant="muted" style={styles.typeChipText}>
                    {property.propertyType}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 220,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 8,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  propertyTitle: {
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  locationText: {
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    // Muted text handled by variant
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  price: {
    fontWeight: 'bold',
  },
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeChipText: {
    fontSize: 11,
  },
});



