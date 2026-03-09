import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: W } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '✈️',
    title: 'Never Miss a Flight',
    desc: 'Live countdown from the moment you add your trip. Know exactly how long before boarding — always.',
    bg: '#1A56A6',
    accent: '#60A5FA',
  },
  {
    emoji: '🕐',
    title: 'Smart Leave-By Times',
    desc: 'We calculate exactly when you need to leave home — including check-in, security, and travel mode.',
    bg: '#0F4C81',
    accent: '#34D399',
  },
  {
    emoji: '🧳',
    title: 'Your Airport Toolkit',
    desc: 'Document checklists, baggage rules, visa requirements, and airport guides — all in one place.',
    bg: '#1E3A5F',
    accent: '#FBBF24',
  },
  {
    emoji: '😌',
    title: 'Stay Calm, Fly Easy',
    desc: 'Guided 4-7-8 breathing exercises designed for anxious flyers. Start free, go deeper with Premium.',
    bg: '#2D1B69',
    accent: '#A78BFA',
  },
  {
    emoji: '🛬',
    title: 'Keep Loved Ones in the Loop',
    desc: 'Add an emergency contact and send a one-tap "I have landed" message via WhatsApp or SMS.',
    bg: '#1A3A2E',
    accent: '#6EE7B7',
  },
];

export const ONBOARDING_KEY = 'flyeasy_onboarding_done';

type Props = { onDone: () => void };

export function OnboardingScreen({ onDone }: Props) {
  const [index, setIndex] = useState(0);
  const slideAnim  = useRef(new Animated.Value(0)).current;
  const iconScales = useRef(SLIDES.map(() => new Animated.Value(0))).current;
  const dotAnims   = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  // Bounce the first icon in on mount
  React.useEffect(() => {
    Animated.spring(iconScales[0], {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (next: number) => {
    // Slide out current, slide in next
    Animated.timing(slideAnim, {
      toValue: -next * W,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Bounce new icon
    iconScales[next].setValue(0);
    Animated.spring(iconScales[next], {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();

    // Animate dot indicators
    Animated.parallel([
      Animated.timing(dotAnims[index], { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(dotAnims[next],  { toValue: 1, duration: 200, useNativeDriver: false }),
    ]).start();

    setIndex(next);
  };

  const handleNext = async () => {
    if (index < SLIDES.length - 1) {
      goTo(index + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      onDone();
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onDone();
  };

  const slide = SLIDES[index];

  return (
    <View style={[styles.root, { backgroundColor: slide.bg }]}>
      <StatusBar backgroundColor={slide.bg} barStyle="light-content" />
      <SafeAreaView style={styles.safe}>

        {/* Skip button */}
        {index < SLIDES.length - 1 && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slides row (clipped) */}
        <View style={styles.slidesWrapper}>
          <Animated.View
            style={[styles.slidesRow, { transform: [{ translateX: slideAnim }] }]}
          >
            {SLIDES.map((s, i) => (
              <View key={i} style={styles.slide}>
                {/* Icon */}
                <Animated.Text
                  style={[styles.emoji, { transform: [{ scale: iconScales[i] }] }]}
                >
                  {s.emoji}
                </Animated.Text>

                {/* Accent glow ring */}
                <View style={[styles.glowRing, { borderColor: s.accent + '40' }]} />

                {/* Text */}
                <Text style={styles.title}>{s.title}</Text>
                <Text style={styles.desc}>{s.desc}</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: slide.accent,
                  width: dotAnims[i].interpolate({
                    inputRange: [0, 1], outputRange: [8, 24],
                  }),
                  opacity: dotAnims[i].interpolate({
                    inputRange: [0, 1], outputRange: [0.35, 1],
                  }),
                },
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: slide.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, { color: slide.bg }]}>
            {index === SLIDES.length - 1 ? 'Get Started →' : 'Next →'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.progress}>
          {index + 1} of {SLIDES.length}
        </Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingTop: 16,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  skipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
  slidesWrapper: {
    flex: 1,
    width: W - 48,
    overflow: 'hidden',
    alignItems: 'flex-start',
  },
  slidesRow: {
    flexDirection: 'row',
    width: W * SLIDES.length,
  },
  slide: {
    width: W - 48,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  glowRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 60,
    opacity: 0.15,
  },
  emoji: {
    fontSize: 88,
    marginBottom: 32,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
    zIndex: 1,
  },
  desc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 26,
    zIndex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progress: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginBottom: 16,
  },
});
