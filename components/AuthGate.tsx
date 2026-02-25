import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors, Spacing, Radius, Typography, ButtonStyles } from '../src/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AuthGateProps {
  children: React.ReactNode;
  action?: string;
}

export function AuthGate({ children, action = 'perform this action' }: AuthGateProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showModal, setShowModal] = useState(false);

  const handlePress = () => {
    if (!isAuthenticated) {
      setShowModal(true);
    }
  };

  const handleLogin = () => {
    setShowModal(false);
    router.push('/(auth)/login');
  };

  const handleRegister = () => {
    setShowModal(false);
    router.push('/(auth)/register');
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <MaterialIcons name="lock" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Login Required</Text>
              <Text style={[styles.modalMessage, { color: colors.icon }]}>
                You need to login to {action}. Create an account or sign in to continue.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, ButtonStyles.primary(colors)]}
                onPress={handleRegister}>
                <Text style={ButtonStyles.primaryText(colors)}>Register</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, ButtonStyles.outline(colors)]}
                onPress={handleLogin}>
                <Text style={ButtonStyles.outlineText(colors)}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, ButtonStyles.ghost(colors)]}
                onPress={() => setShowModal(false)}>
                <Text style={[ButtonStyles.ghostText(colors), { opacity: 0.7 }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...Typography.body,
    textAlign: 'center',
  },
  modalButtons: {
    gap: Spacing.md,
  },
  button: {
    width: '100%',
  },
});






