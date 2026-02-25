import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { propertyService } from '../services/propertyService';
import { chatService } from '../services/chatService';
import { Property } from '../types';
import { AppStackParamList } from '../navigation/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';

type PropertyDetailScreenNavigationProp = NativeStackNavigationProp<AppStackParamList, 'PropertyDetail'>;
type PropertyDetailScreenRouteProp = RouteProp<AppStackParamList, 'PropertyDetail'>;

const { width } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const navigation = useNavigation<PropertyDetailScreenNavigationProp>();
  const route = useRoute<PropertyDetailScreenRouteProp>();
  const { id } = route.params;
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [owner, setOwner] = useState<{ displayName?: string; email: string; photoURL?: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isOwner = user && property && user.uid === property.ownerId;
  const isTenant = user?.role === 'Buyer';

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
        Alert.alert('Not Found', 'This property does not exist or has been removed.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
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
            console.error('[PropertyDetailScreen] Error loading owner info:', error);
          }
        }
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[PropertyDetailScreen] ❌ Error loading property:', error);
      }
      Alert.alert('Error', 'Failed to load property details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!property) return;
    navigation.navigate('EditProperty', { id: property.id });
  };

  const handleDelete = () => {
    if (!property) return;

    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await propertyService.deleteProperty(property.id, user ?? null);
              Alert.alert('Success', 'Property deleted successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error: any) {
              if (__DEV__) {
                console.error('[PropertyDetailScreen] ❌ Error deleting property:', error);
              }
              Alert.alert('Error', error.message || 'Failed to delete property. Please try again.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleRequestService = () => {
    if (!property || !user) return;
    
    // Navigate to service providers screen or request service screen
    // You can pass the property ID to pre-fill location information
    navigation.navigate('RequestService', { providerId: '' }); // You may want to adjust this
    // Or navigate to a screen to select a service provider first
  };

  const handleContactOwner = async () => {
    if (!property || !user) return;

    try {
      // Get or create chat with the owner
      const chatId = await chatService.getOrCreateChat(user.uid, property.ownerId);
      
      // Get owner info for navigation
      const ownerInfo = owner || await chatService.getUserInfo(property.ownerId);
      const ownerName = ownerInfo?.displayName || ownerInfo?.email || 'Property Owner';
      
      // Navigate to chat
      navigation.navigate('ChatDetail', {
        id: chatId,
        otherUserId: property.ownerId,
        otherUserName: ownerName,
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error('[PropertyDetailScreen] ❌ Error creating chat:', error);
      }
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
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

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
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

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text variant="body" style={[styles.loadingText, { color: colors.text }]}>
              Loading property details...
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={64} color={colors.error || '#FF3B30'} />
            <Text variant="title" style={[styles.errorText, { color: colors.text }]}>
              Property not found
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.backButton, { backgroundColor: colors.tint }]}
            >
              <Text variant="body" style={styles.backButtonText}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonHeader}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Image Gallery */}
        <Card style={{ backgroundColor: colors.card, padding: 0, marginBottom: 0 }}>
          {property.images && property.images.length > 0 ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: property.images[imageIndex] }} style={styles.mainImage} />
              {property.images.length > 1 && (
                <View style={styles.imageControls}>
                  <TouchableOpacity style={styles.imageNavButton} onPress={prevImage}>
                    <MaterialIcons name="chevron-left" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <View style={[styles.imageIndicator, { backgroundColor: colors.background }]}>
                    <Text variant="body" style={styles.imageIndicatorText}>
                      {imageIndex + 1} / {property.images.length}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.imageNavButton} onPress={nextImage}>
                    <MaterialIcons name="chevron-right" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) }]}>
                <Text variant="body" style={styles.statusText}>
                  {property.status.toUpperCase()}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.placeholderImage, { backgroundColor: colors.border }]}>
              <MaterialIcons name="home" size={80} color={colors.text} />
              <Text variant="muted" style={styles.placeholderText}>
                No images available
              </Text>
            </View>
          )}
        </Card>

        {/* Title and Price */}
        <Card style={{ backgroundColor: colors.card }}>
          <Text variant="title" style={[styles.title, { color: colors.text }]}>
            {property.title}
          </Text>
          <Text variant="title" style={[styles.price, { color: colors.tint }]}>
            {formatPrice(property.price)}
          </Text>
        </Card>

        {/* Property Details */}
        <Card style={{ backgroundColor: colors.card }}>
          <View style={styles.detailsRow}>
            {property.bedrooms && (
              <View style={styles.detailItem}>
                <MaterialIcons name="bed" size={24} color={colors.tint} />
                <Text variant="muted" style={styles.detailLabel}>
                  Bedrooms
                </Text>
                <Text variant="title" style={{ color: colors.text }}>
                  {property.bedrooms}
                </Text>
              </View>
            )}
            {property.bathrooms && (
              <View style={styles.detailItem}>
                <MaterialIcons name="bathroom" size={24} color={colors.tint} />
                <Text variant="muted" style={styles.detailLabel}>
                  Bathrooms
                </Text>
                <Text variant="title" style={{ color: colors.text }}>
                  {property.bathrooms}
                </Text>
              </View>
            )}
            {property.area && (
              <View style={styles.detailItem}>
                <MaterialIcons name="square-foot" size={24} color={colors.tint} />
                <Text variant="muted" style={styles.detailLabel}>
                  Area
                </Text>
                <Text variant="title" style={{ color: colors.text }}>
                  {property.area} sqft
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Description */}
        <Card style={{ backgroundColor: colors.card }}>
          <Text variant="title" style={[styles.sectionTitle, { color: colors.text }]}>
            Description
          </Text>
          <Text variant="body" style={{ color: colors.text }}>
            {property.description}
          </Text>
        </Card>

        {/* Location */}
        <Card style={{ backgroundColor: colors.card }}>
          <Text variant="title" style={[styles.sectionTitle, { color: colors.text }]}>
            Location
          </Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={20} color={colors.tint} />
            <View style={styles.locationText}>
              <Text variant="body" style={{ color: colors.text }}>
                {property.location.address}
              </Text>
              <Text variant="muted" style={styles.locationSubtext}>
                {property.location.city}, {property.location.state} {property.location.zipCode}
              </Text>
            </View>
          </View>
        </Card>

        {/* Property Info */}
        <Card style={{ backgroundColor: colors.card }}>
          <View style={styles.infoRow}>
            <Text variant="body" style={{ color: colors.text }}>
              Property Type
            </Text>
            <View style={[styles.typeChip, { backgroundColor: colors.border }]}>
              <Text variant="body" style={styles.typeChipText}>
                {property.propertyType}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text variant="body" style={{ color: colors.text }}>
              Status
            </Text>
            <View style={[styles.statusChip, { backgroundColor: getStatusColor(property.status) }]}>
              <Text variant="body" style={styles.statusChipText}>
                {property.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Owner Info */}
        {owner && !isOwner && (
          <Card style={{ backgroundColor: colors.card }}>
            <Text variant="title" style={[styles.sectionTitle, { color: colors.text }]}>
              Property Owner
            </Text>
            <View style={styles.ownerRow}>
              {owner.photoURL ? (
                <Image source={{ uri: owner.photoURL }} style={styles.ownerAvatar} />
              ) : (
                <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder, { backgroundColor: colors.tint }]}>
                  <Text variant="body" style={styles.ownerAvatarText}>
                    {owner.displayName?.charAt(0).toUpperCase() || owner.email.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.ownerDetails}>
                <Text variant="body" style={{ color: colors.text, fontWeight: '600' }}>
                  {owner.displayName || 'Property Owner'}
                </Text>
                <Text variant="muted" style={styles.ownerEmail}>
                  {owner.email}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isOwner ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint, flex: 1, marginRight: 6 }]}
                onPress={handleEdit}
              >
                <MaterialIcons name="edit" size={20} color="#fff" />
                <Text variant="body" style={styles.actionButtonText}>
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF3B30', flex: 1, marginLeft: 6 }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="delete" size={20} color="#fff" />
                    <Text variant="body" style={styles.actionButtonText}>
                      Delete
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : isTenant ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint, flex: 1, marginRight: 6 }]}
                onPress={handleRequestService}
              >
                <MaterialIcons name="build" size={20} color="#fff" />
                <Text variant="body" style={styles.actionButtonText}>
                  Request Service
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border, borderWidth: 1, flex: 1, marginLeft: 6 }]}
                onPress={handleContactOwner}
              >
                <MaterialIcons name="message" size={20} color={colors.tint} />
                <Text variant="body" style={[styles.actionButtonText, { color: colors.tint }]}>
                  Contact Owner
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.tint }]}
              onPress={handleContactOwner}
            >
              <MaterialIcons name="message" size={20} color="#fff" />
              <Text variant="body" style={styles.actionButtonText}>
                Contact Owner
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
  backButtonHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  loadingText: {
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
  },
  imageNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  imageIndicatorText: {
    fontWeight: '600',
  },
  placeholderImage: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    marginBottom: 8,
  },
  price: {
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    marginTop: 4,
    marginBottom: 4,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationText: {
    flex: 1,
  },
  locationSubtext: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeChipText: {
    fontSize: 12,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  ownerAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  ownerDetails: {
    flex: 1,
  },
  ownerEmail: {
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

