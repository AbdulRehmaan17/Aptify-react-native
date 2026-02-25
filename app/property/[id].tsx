import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { propertyService } from '../../src/services/propertyService';
import { Property, User } from '../../src/types';
import { Colors, Spacing, Radius, FontSizes, Shadows } from '../../src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '../../src/context/AuthContext';
import { AuthGate } from '../../components/AuthGate';
import { chatService } from '../../src/services/chatService';
import { PropertyDetailSkeleton } from '../../components/SkeletonComponents';

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated, user } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [owner, setOwner] = useState<{ displayName?: string; email: string; photoURL?: string } | null>(null);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const data = await propertyService.getPropertyById(id, user ?? null);
      if (!data) {
        Alert.alert('Not Found', 'This property does not exist or has been removed.');
        router.back();
        return;
      }
      setProperty(data);
      
      // Load owner information
      if (data.ownerId) {
        try {
          const ownerInfo = await chatService.getUserInfo(data.ownerId);
          setOwner(ownerInfo);
        } catch (error) {
          if (__DEV__) {
            console.error('Error loading owner info:', error);
          }
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading property:', error);
      }
      Alert.alert('Error', 'Failed to load property details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactOwner = async () => {
    if (!property || !isAuthenticated || !user) {
      return;
    }

    try {
      setContacting(true);
      // Get or create chat with the owner
      const chatId = await chatService.getOrCreateChat(user.uid, property.ownerId);
      
      // Get owner info for navigation
      const ownerInfo = owner || await chatService.getUserInfo(property.ownerId);
      const ownerName = ownerInfo?.displayName || ownerInfo?.email || 'Property Owner';
      
      // Navigate to chat
      router.push(`/chat/${chatId}?otherUserId=${property.ownerId}&otherUserName=${ownerName}`);
    } catch (error: any) {
      if (__DEV__) {
        console.error('Error creating chat:', error);
      }
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    } finally {
      setContacting(false);
    }
  };

  const handleSaveFavorite = () => {
    // TODO: Implement favorite functionality
    Alert.alert('Success', 'Property saved to favorites!');
  };

  const nextImage = () => {
    if (property && property.images.length > 0) {
      setImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property && property.images.length > 0) {
      setImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <PropertyDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.text }]}>Property not found</Text>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButtonHeader, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Large Image Section */}
        {property.images && property.images.length > 0 ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: property.images[imageIndex] }} style={styles.mainImage} />
            {property.images.length > 1 && (
              <>
                <TouchableOpacity 
                  style={styles.imageNavButton} 
                  onPress={prevImage}
                  activeOpacity={0.7}>
                  <MaterialIcons name="chevron-left" size={32} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.imageNavButton, styles.imageNavButtonRight]} 
                  onPress={nextImage}
                  activeOpacity={0.7}>
                  <MaterialIcons name="chevron-right" size={32} color="#fff" />
                </TouchableOpacity>
                <View style={styles.imageIndicator}>
                  <Text style={styles.imageIndicatorText}>
                    {imageIndex + 1} / {property.images.length}
                  </Text>
                </View>
              </>
            )}
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{property.status.toUpperCase()}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
            <MaterialIcons name="home" size={80} color={colors.icon} />
            <Text style={[styles.placeholderText, { color: colors.icon }]}>No images available</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Price Card */}
          <View style={[styles.titleCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
            <Text style={[styles.title, { color: colors.text }]}>{property.title}</Text>
            <Text style={[styles.price, { color: colors.primary }]}>${property.price.toLocaleString()}</Text>
          </View>

          {/* Property Details Card */}
          <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Property Details</Text>
            <View style={styles.detailsRow}>
              {property.bedrooms && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <MaterialIcons name="bed" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{property.bedrooms}</Text>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>Bedrooms</Text>
                </View>
              )}
              {property.bathrooms && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <MaterialIcons name="bathroom" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{property.bathrooms}</Text>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>Bathrooms</Text>
                </View>
              )}
              {property.area && (
                <View style={styles.detailItem}>
                  <View style={[styles.detailIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <MaterialIcons name="square-foot" size={24} color={colors.primary} />
                  </View>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{property.area}</Text>
                  <Text style={[styles.detailLabel, { color: colors.icon }]}>Sqft</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description Card */}
          <View style={[styles.descriptionCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: colors.icon }]}>{property.description}</Text>
          </View>

          {/* Location Card */}
          <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Location</Text>
            <View style={styles.locationContent}>
              <MaterialIcons name="location-on" size={24} color={colors.primary} />
              <View style={styles.locationText}>
                <Text style={[styles.locationAddress, { color: colors.text }]}>{property.location.address}</Text>
                <Text style={[styles.locationCity, { color: colors.icon }]}>
                  {property.location.city}, {property.location.state} {property.location.zipCode}
                </Text>
              </View>
            </View>
          </View>

          {/* Property Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Property Information</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Property Type</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{property.propertyType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Status</Text>
              <View style={[styles.statusChip, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[styles.statusChipText, { color: colors.primary }]}>
                  {property.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Owner Info Card */}
          {owner && (
            <View style={[styles.ownerCard, { backgroundColor: colors.card, borderColor: colors.border }, Shadows.sm]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Property Owner</Text>
              <View style={styles.ownerInfo}>
                {owner.photoURL ? (
                  <Image source={{ uri: owner.photoURL }} style={styles.ownerAvatar} />
                ) : (
                  <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder, { backgroundColor: colors.primary }]}>
                    <Text style={styles.ownerAvatarText}>
                      {owner.displayName?.charAt(0).toUpperCase() || owner.email.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.ownerDetails}>
                  <Text style={[styles.ownerName, { color: colors.text }]}>
                    {owner.displayName || 'Property Owner'}
                  </Text>
                  <Text style={[styles.ownerEmail, { color: colors.icon }]}>{owner.email}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <AuthGate action="contact the owner">
              <TouchableOpacity
                style={[styles.contactButton, { backgroundColor: colors.primary }, Shadows.md, contacting && styles.buttonDisabled]}
                onPress={handleContactOwner}
                disabled={contacting}
                activeOpacity={0.8}>
                {contacting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="message" size={20} color="#fff" />
                    <Text style={styles.contactButtonText}>Contact Owner</Text>
                  </>
                )}
              </TouchableOpacity>
            </AuthGate>

            <AuthGate action="save this property">
              <TouchableOpacity
                style={[styles.favoriteButton, { borderColor: colors.primary }]}
                onPress={handleSaveFavorite}
                activeOpacity={0.8}>
                <MaterialIcons name="favorite-border" size={20} color={colors.primary} />
                <Text style={[styles.favoriteButtonText, { color: colors.primary }]}>Save</Text>
              </TouchableOpacity>
            </AuthGate>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: Spacing.xl,
    zIndex: 10,
  },
  backButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: FontSizes.body,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  errorText: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginTop: Spacing.base,
    marginBottom: Spacing.xl,
  },
  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  backButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: Spacing.base,
    fontSize: FontSizes.body,
  },
  imageNavButton: {
    position: 'absolute',
    left: Spacing.base,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNavButtonRight: {
    left: 'auto',
    right: Spacing.base,
  },
  imageIndicator: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  imageIndicatorText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.base,
    right: Spacing.base,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  statusText: {
    color: '#fff',
    fontSize: FontSizes.small,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    padding: Spacing.xl,
  },
  titleCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
    lineHeight: 34,
  },
  price: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
  },
  detailsCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginBottom: Spacing.lg,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailIconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSizes.caption,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: FontSizes.h4,
    fontWeight: 'bold',
  },
  descriptionCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  description: {
    fontSize: FontSizes.body,
    lineHeight: 24,
    opacity: 0.8,
  },
  locationCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationText: {
    marginLeft: Spacing.base,
    flex: 1,
  },
  locationAddress: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  locationCity: {
    fontSize: FontSizes.caption,
    opacity: 0.7,
  },
  infoCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  infoLabel: {
    fontSize: FontSizes.body,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: FontSizes.body,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  statusChipText: {
    fontSize: FontSizes.small,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.xxl,
  },
  contactButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingVertical: Spacing.base + 4,
    gap: Spacing.sm,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  favoriteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    paddingVertical: Spacing.base + 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
    gap: Spacing.sm,
  },
  favoriteButtonText: {
    fontSize: FontSizes.body,
    fontWeight: '600',
  },
  ownerCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    marginRight: Spacing.base,
  },
  ownerAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerAvatarText: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
    color: '#fff',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerName: {
    fontSize: FontSizes.h4,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  ownerEmail: {
    fontSize: FontSizes.caption,
    opacity: 0.7,
  },
});
