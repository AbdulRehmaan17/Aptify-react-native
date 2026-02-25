/**
 * Onboarding Flow
 * 3-screen onboarding with smooth animations
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../src/components/layout/ScreenContainer';
import { ButtonStyles, Colors, Spacing, Typography } from '../src/constants/theme';
import { completeOnboarding } from '../src/utils/onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  color: string;
}

// Get slides with theme colors
const getSlides = (colors: typeof Colors.light | typeof Colors.dark): OnboardingSlide[] => [
  {
    id: 1,
    icon: 'search' as keyof typeof MaterialIcons.glyphMap,
    title: 'Discover Properties',
    description: 'Browse thousands of properties with advanced filters and search. Find your perfect home or investment opportunity.',
    color: colors.primary,
  },
  {
    id: 2,
    icon: 'chat' as keyof typeof MaterialIcons.glyphMap,
    title: 'Chat with Owners',
    description: 'Connect directly with property owners. Ask questions, schedule viewings, and negotiate deals seamlessly.',
    color: colors.secondary,
  },
  {
    id: 3,
    icon: 'home' as keyof typeof MaterialIcons.glyphMap,
    title: 'Manage Listings',
    description: 'List your properties, track inquiries, and manage your real estate portfolio all in one place.',
    color: colors.warning,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const slides = getSlides(colors);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Animation values for each slide
  const slideAnims = slides.map(() => ({
    fade: useRef(new Animated.Value(0)).current,
    slide: useRef(new Animated.Value(50)).current,
  }));

  // Animate slides on mount and when slide changes
  useEffect(() => {
    slideAnims.forEach((anim, index) => {
      if (index === currentSlide) {
        Animated.parallel([
          Animated.timing(anim.fade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(anim.slide, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        anim.fade.setValue(0);
        anim.slide.setValue(50);
      }
    });
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await completeOnboarding();
      // Navigate to guest home
      router.replace('/(guest)/home');
    } catch (error) {
      if (__DEV__) {
        console.error('Error completing onboarding:', error);
      }
      // Navigate anyway
      router.replace('/(guest)/home');
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const slideIndex = Math.round(offsetX / SCREEN_WIDTH);
        if (slideIndex !== currentSlide) {
          setCurrentSlide(slideIndex);
        }
      },
    }
  );

  return (
    <ScreenContainer
      scrollable={false}
      padding={false}
      style={{ backgroundColor: colors.background }}>
      {/* Skip Button */}
      <View style={[styles.skipContainer, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}>
        {slides.map((slide, index) => {
          const anim = slideAnims[index];
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
          });

          return (
            <View key={slide.id} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <Animated.View
                style={[
                  styles.slideContent,
                  {
                    opacity: anim.fade,
                    transform: [
                      { translateY: anim.slide },
                      { scale },
                    ],
                  },
                ]}>
                {/* Icon with animated background */}
                <Animated.View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor: `${slide.color}15`,
                      opacity,
                    },
                  ]}>
                  <MaterialIcons name={slide.icon} size={80} color={slide.color} />
                </Animated.View>

                {/* Title */}
                <Animated.Text
                  style={[
                    styles.title,
                    {
                      color: colors.text,
                      opacity: anim.fade,
                    },
                  ]}>
                  {slide.title}
                </Animated.Text>

                {/* Description */}
                <Animated.Text
                  style={[
                    styles.description,
                    {
                      color: colors.textSecondary,
                      opacity: anim.fade,
                    },
                  ]}>
                  {slide.description}
                </Animated.Text>
              </Animated.View>
            </View>
          );
        })}
      </Animated.ScrollView>

      {/* Indicators */}
      <View style={styles.indicators}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * SCREEN_WIDTH,
            index * SCREEN_WIDTH,
            (index + 1) * SCREEN_WIDTH,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [1, 3, 1], // 8px base * 3 = 24px max
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor: colors.primary,
                  opacity,
                  transform: [{ scaleX: scale }],
                },
              ]}
            />
          );
        })}
      </View>

      {/* Navigation Buttons */}
      <View style={[styles.navigation, { paddingBottom: insets.bottom + Spacing.md }]}>
        {currentSlide > 0 && (
          <TouchableOpacity
            style={[styles.backButton, ButtonStyles.outline(colors)]}
            onPress={() => {
              const prevSlide = currentSlide - 1;
              setCurrentSlide(prevSlide);
              scrollViewRef.current?.scrollTo({
                x: prevSlide * SCREEN_WIDTH,
                animated: true,
              });
            }}>
            <Text style={ButtonStyles.outlineText(colors)}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            ButtonStyles.primary(colors),
            { flex: currentSlide === 0 ? 1 : undefined },
          ]}
          onPress={handleNext}>
          <Text style={ButtonStyles.primaryText(colors)}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: Spacing.sm,
  },
  skipText: {
    ...Typography.bodyBold,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  indicator: {
    height: 8,
    width: 8, // Base width for scaleX transform
    borderRadius: 4,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    paddingTop: Spacing.md,
  },
  backButton: {
    minWidth: 100,
  },
  nextButton: {
    flex: 1,
  },
});
