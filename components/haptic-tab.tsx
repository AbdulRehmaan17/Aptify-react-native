import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(PlatformPressable);

export function HapticTab(props: BottomTabBarButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (props.accessibilityState?.selected) {
      scale.value = withSpring(1.1, { damping: 15, stiffness: 150 });
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }
  }, [props.accessibilityState?.selected]);

  return (
    <AnimatedPressable
      {...props}
      style={[props.style, animatedStyle]}
      onPressIn={(ev) => {
        scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      onPressOut={(ev) => {
        scale.value = withSpring(
          props.accessibilityState?.selected ? 1.1 : 1,
          { damping: 15, stiffness: 150 }
        );
        props.onPressOut?.(ev);
      }}
    />
  );
}
