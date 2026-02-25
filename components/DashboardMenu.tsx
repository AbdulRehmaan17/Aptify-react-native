import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { isAdmin } from '../src/utils/accessControl';
import { colors, spacing, radius, shadows } from '../src/theme';

interface DashboardMenuProps {
  visible: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  requireAuth?: boolean;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: 'properties',
    title: 'Properties',
    icon: 'home',
    route: '/(tabs)/properties',
  },
  {
    id: 'rentals',
    title: 'Rentals',
    icon: 'apartment',
    route: '/rentals',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    icon: 'contact-support',
    route: '/contact',
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    route: '/(tabs)/settings',
    requireAuth: true,
  },
  {
    id: 'admin',
    title: 'Admin Tools',
    icon: 'admin-panel-settings',
    route: '/admin/dashboard',
    requireAuth: true,
    adminOnly: true,
  },
  {
    id: 'contact-messages',
    title: 'Contact Messages',
    icon: 'contact-mail',
    route: '/admin/contact-messages',
    requireAuth: true,
    adminOnly: true,
  },
];

export function DashboardMenu({ visible, onClose }: DashboardMenuProps) {
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const handleItemPress = (item: MenuItem) => {
    if (item.requireAuth && !user) {
      // Could show login prompt here
      return;
    }

    if (item.adminOnly && !isAdmin(user)) {
      // Could show access denied
      return;
    }

    onClose();
    router.push(item.route as any);
  };

  const filteredItems = menuItems.filter((item) => {
    if (item.requireAuth && !user) return false;
    if (item.adminOnly && !isAdmin(user)) return false;
    return true;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={styles.menuContainer}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Menu</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.menuItems} showsVerticalScrollIndicator={false}>
                {filteredItems.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}>
                    <View style={styles.menuItemIcon}>
                      <MaterialIcons
                        name={item.icon}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.menuItemText}>{item.title}</Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    ...shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  menuItems: {
    padding: spacing.base,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
