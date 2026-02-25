import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { serviceRequestService } from '../../src/services/serviceRequestService';
import { ServiceProvider, ServiceType } from '../../src/types';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ProviderCardSkeleton } from '../../components/SkeletonComponents';

export default function ProvidersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<ServiceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProviders();
  }, [selectedType]);

  useEffect(() => {
    filterProviders();
  }, [providers, searchQuery]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const serviceType = selectedType === 'all' ? undefined : selectedType;
      const data = await serviceRequestService.getServiceProviders(serviceType);
      setProviders(data);
      setFilteredProviders(data);
    } catch (error: any) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProviders();
    setRefreshing(false);
  };

  const filterProviders = () => {
    let filtered = [...providers];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (provider) =>
          provider.displayName?.toLowerCase().includes(query) ||
          provider.email.toLowerCase().includes(query) ||
          provider.bio?.toLowerCase().includes(query) ||
          provider.specialties?.some((s) => s.toLowerCase().includes(query))
      );
    }

    setFilteredProviders(filtered);
  };

  const getRoleColor = (role: string): string => {
    return role === 'Constructor' ? '#FF9500' : '#AF52DE';
  };

  const getRoleIcon = (role: string): keyof typeof MaterialIcons.glyphMap => {
    return role === 'Constructor' ? 'construction' : 'handyman';
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Service Providers</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={[styles.filterScroll, { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }]}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === 'all' ? { backgroundColor: colors.primary } : { backgroundColor: colors.border },
              ]}
              onPress={() => setSelectedType('all')}>
              <Text
                style={[
                  styles.filterChipText,
                  { color: selectedType === 'all' ? '#fff' : colors.text },
                ]}>
                All
              </Text>
            </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedType === 'construction' ? { backgroundColor: colors.primary } : { backgroundColor: colors.border },
            ]}
            onPress={() => setSelectedType('construction')}>
            <MaterialIcons
              name="construction"
              size={16}
              color={selectedType === 'construction' ? '#fff' : colors.text}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: selectedType === 'construction' ? '#fff' : colors.text },
              ]}>
              Construction
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedType === 'renovation' ? { backgroundColor: colors.primary } : { backgroundColor: colors.border },
            ]}
            onPress={() => setSelectedType('renovation')}>
            <MaterialIcons
              name="handyman"
              size={16}
              color={selectedType === 'renovation' ? '#fff' : colors.text}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: selectedType === 'renovation' ? '#fff' : colors.text },
              ]}>
              Renovation
            </Text>
          </TouchableOpacity>
          </View>
        </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.border, color: colors.text }]}
          placeholder="Search providers..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <MaterialIcons name="close" size={20} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

        {/* Content */}
        {loading ? (
          <View style={styles.providersList}>
            {[1, 2, 3].map((i) => (
              <ProviderCardSkeleton key={i} />
            ))}
          </View>
        ) : filteredProviders.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialIcons name="person-search" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {searchQuery ? 'No providers found' : 'No service providers available'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.icon }]}>
              {searchQuery ? 'Try a different search term' : 'Check back later for new providers'}
            </Text>
          </View>
        ) : (
          <View style={styles.providersList}>
            {filteredProviders.map((provider) => (
              <TouchableOpacity
                key={provider.uid}
                style={[styles.providerCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => router.push(`/services/${provider.uid}`)}
                activeOpacity={0.7}>
                {/* Provider Header */}
                <View style={styles.providerHeader}>
                  {provider.photoURL ? (
                    <Image source={{ uri: provider.photoURL }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: getRoleColor(provider.role) }]}>
                      <Text style={styles.avatarText}>
                        {provider.displayName?.charAt(0).toUpperCase() || provider.email.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.providerInfo}>
                    <View style={styles.providerNameRow}>
                      <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>
                        {provider.displayName || 'Service Provider'}
                      </Text>
                      <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(provider.role)}20` }]}>
                        <MaterialIcons name={getRoleIcon(provider.role)} size={14} color={getRoleColor(provider.role)} />
                        <Text style={[styles.roleText, { color: getRoleColor(provider.role) }]}>
                          {provider.role}
                        </Text>
                      </View>
                    </View>
                    {provider.rating && (
                      <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={16} color="#FFB800" />
                        <Text style={[styles.ratingText, { color: colors.text }]}>
                          {provider.rating.toFixed(1)}
                        </Text>
                        {provider.totalJobs && (
                          <Text style={[styles.jobsText, { color: colors.icon }]}>
                            ({provider.totalJobs} jobs)
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Bio */}
                {provider.bio && (
                  <Text style={[styles.bio, { color: colors.icon }]} numberOfLines={2}>
                    {provider.bio}
                  </Text>
                )}

                {/* Specialties */}
                {provider.specialties && provider.specialties.length > 0 && (
                  <View style={styles.specialtiesContainer}>
                    {provider.specialties.slice(0, 3).map((specialty, index) => (
                      <View
                        key={index}
                        style={[styles.specialtyChip, { backgroundColor: colors.border }]}>
                        <Text style={[styles.specialtyText, { color: colors.text }]}>{specialty}</Text>
                      </View>
                    ))}
                    {provider.specialties.length > 3 && (
                      <Text style={[styles.moreSpecialties, { color: colors.icon }]}>
                        +{provider.specialties.length - 3} more
                      </Text>
                    )}
                  </View>
                )}

                {/* Contact Info */}
                <View style={styles.contactRow}>
                  {provider.phoneNumber && (
                    <View style={styles.contactItem}>
                      <MaterialIcons name="phone" size={16} color={colors.icon} />
                      <Text style={[styles.contactText, { color: colors.icon }]} numberOfLines={1}>
                        {provider.phoneNumber}
                      </Text>
                    </View>
                  )}
                  <View style={styles.contactItem}>
                    <MaterialIcons name="email" size={16} color={colors.icon} />
                    <Text style={[styles.contactText, { color: colors.icon }]} numberOfLines={1}>
                      {provider.email}
                    </Text>
                  </View>
                </View>

                {/* Request Button */}
                <TouchableOpacity
                  style={[styles.requestButton, { backgroundColor: colors.primary }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push(`/services/request?providerId=${provider.uid}`);
                  }}>
                  <MaterialIcons name="send" size={18} color="#fff" />
                  <Text style={styles.requestButtonText}>Request Service</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
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
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterScroll: {
    marginTop: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    borderRadius: 12,
  },
  clearButton: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyText: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: FontSizes.caption,
    textAlign: 'center',
    opacity: 0.7,
  },
  list: {
    flex: 1,
  },
  providersList: {
    padding: 16,
  },
  providerCard: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.base,
    borderWidth: 1,
  },
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  providerInfo: {
    flex: 1,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  providerName: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    flex: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 2,
  },
  jobsText: {
    fontSize: 12,
    marginLeft: 4,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  specialtyChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreSpecialties: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 12,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base + 4,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


