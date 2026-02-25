import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../src/theme';

export type QuickActionItem = {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
};

interface QuickActionCardProps {
  item: QuickActionItem;
  index: number;
  cardWidth: number;
  onPress: (item: QuickActionItem) => void;
}

export default function QuickActionCard({
  item,
  index,
  cardWidth,
  onPress,
}: QuickActionCardProps) {
  const handlePress = () => {
    onPress(item);
  };

  return (
    <View style={[styles.container, { width: cardWidth }]}>
      <TouchableOpacity
        style={[styles.quickActionCard, { width: cardWidth, height: cardWidth }]}
        onPress={handlePress}
        activeOpacity={0.8}>
        <View style={styles.quickActionIconContainer}>
          <MaterialIcons name={item.icon} size={32} color={colors.primary} />
        </View>
        <Text style={styles.quickActionTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 140,
  },
  quickActionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    // Fix text wrapping - allow max 2 lines
    maxWidth: '100%',
  },
});
