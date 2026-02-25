// User types
export type UserRole = 'user' | 'admin' | 'Buyer' | 'Owner' | 'Constructor' | 'Renovator' | 'Admin';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  role?: UserRole;
  provider?: 'email' | 'google' | 'instagram'; // Auth provider used
  createdAt?: Date;
  updatedAt?: Date;
}

// Property types
export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  propertyType: 'house' | 'apartment' | 'condo' | 'townhouse' | 'land' | 'other';
  status: 'available' | 'pending' | 'sold' | 'rented';
  approved?: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rental types
export interface Rental {
  id: string;
  title: string;
  description: string;
  monthlyRent: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  propertyType: 'house' | 'apartment' | 'condo' | 'townhouse' | 'other';
  status: 'available' | 'rented' | 'pending';
  availableFrom?: Date;
  leaseDuration?: number; // months
  ownerId: string;
  approved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Contact Message types
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phoneNumber?: string;
  read: boolean;
  replied?: boolean;
  createdAt: Date;
}

// Chat/Message types
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageTime?: Date;
  createdAt: Date;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'message' | 'property' | 'system' | 'service';
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  phoneNumber?: string;
  role?: UserRole;
}

// Service Request types
export type ServiceRequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
export type ServiceType = 'renovation' | 'construction';

export interface ServiceRequest {
  id: string;
  requesterId: string;
  providerId: string;
  serviceType: ServiceType;
  propertyId?: string;
  title: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  status: ServiceRequestStatus;
  budget?: number;
  preferredDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceProvider {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  role: 'Constructor' | 'Renovator';
  bio?: string;
  specialties?: string[];
  rating?: number;
  totalJobs?: number;
  createdAt?: Date;
}
export interface Renovator {
  uid: string;
  email: string;
  name?: string;
  createdAt?: Date;
  officeAddress?: string;
}
