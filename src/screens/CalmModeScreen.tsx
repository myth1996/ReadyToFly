import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, SafeAreaView,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { haptic } from '../services/HapticService';

// ─── 4-7-8 Breathing phases ────────────────────────────────────────────────────
const PHASES = [
  { label: 'Breathe In',  labelHi: 'सांस लें',    duration: 4, color: '#3B82F6', instruction: 'Slowly inhale through your nose' },
  { label: 'Hold',        labelHi: 'रोकें',       duration: 7, color: '#8B5CF6', instruction: 'Hold your breath gently' },
  { label: 'Breathe Out', labelHi: 'सांस छोड़ें', duration: 8, color: '#10B981', instruction: 'Slowly exhale through your mouth' },
];

export function CalmModeScreen() {
  const { themeColors: c, language } = useSettings();
  const { isPremiumUser } = useAuth();

  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].duration);
  const [cycleCount, setCycleCount] = useState(0);

  const circleScale = useRef(new Animated.Value(0.5)).current;
  const bgOpacity  = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef    = useRef<Animated.CompositeAnimation | null>(null);

  const phase = PHASES[phaseIndex];

  useEffect(() => {
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); }
      animRef.current?.stop();
    };
  }, []);

  const animatePhase = (idx: number) => {
    const p = PHASES[idx];
    animRef.current?.stop();

    if (idx === 0) {
      // Inhale — expand
      animRef.current = Animated.timing(circleScale, {
        toValue: 1, duration: p.duration * 1000, useNativeDriver: true,
      });
    } else if (idx === 1) {
      // Hold — stay
      animRef.current = Animated.timing(circleScale, {
        toValue: 1, duration: p.duration * 1000, useNativeDriver: true,
      });
    } else {
      // Exhale — shrink
      animRef.current = Animated.timing(circleScale, {
        toValue: 0.5, duration: p.duration * 1000, useNativeDriver: true,
      });
    }
    animRef.current.start();
  };

  const startSession = () => {
    haptic.impact();
    setRunning(true);
    setPhaseIndex(0);
    setSecondsLeft(PHASES[0].duration);
    setCycleCount(0);
    animatePhase(0);

    Animated.timing(bgOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();

    let currentPhase = 0;
    let currentSec = PHASES[0].duration;

    timerRef.current = setInterval(() => {
      currentSec -= 1;
      setSecondsLeft(currentSec);

      if (currentSec <= 0) {
        const nextPhase = (currentPhase + 1) % PHASES.length;
        if (nextPhase === 0) {
          haptic.selection();
          setCycleCount(n => n + 1);
        }
        currentPhase = nextPhase;
        currentSec = PHASES[nextPhase].duration;
        setPhaseIndex(nextPhase);
        setSecondsLeft(currentSec);
        animatePhase(nextPhase);
      }
    }, 1000);
  };

  const stopSession = () => {
    haptic.impact();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    animRef.current?.stop();
    setRunning(false);
    setPhaseIndex(0);
    setSecondsLeft(PHASES[0].duration);
    Animated.timing(bgOpacity, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    Animated.timing(circleScale, { toValue: 0.5, duration: 600, useNativeDriver: true }).start();
  };

  const phaseLabel = language === 'hi' ? phase.labelHi : phase.label;

  // ── Premium gate ──────────────────────────────────────────────────────────
  if (!isPremiumUser) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.gateCard, { backgroundColor: c.card }]}>
          <Text style={styles.gateEmoji}>😌</Text>
          <Text style={[styles.gateTitle, { color: c.text }]}>Calm Mode is Premium</Text>
          <Text style={[styles.gateDesc, { color: c.textSecondary }]}>
            Guided 4-7-8 breathing exercises, ambient sounds, and a distraction-free space for anxious flyers.
            Upgrade to Premium to unlock.
          </Text>
          <View style={[styles.gateFeaturesList, { backgroundColor: c.background }]}>
            {['4-7-8 Breathing cycle timer', 'Visual breathing guide animation', 'Cycle counter to track progress', 'Do Not Disturb mode'].map(f => (
              <Text key={f} style={[styles.gateFeatureItem, { color: c.text }]}>✓  {f}</Text>
            ))}
          </View>
          <Text style={[styles.gateNote, { color: c.textSecondary }]}>
            Navigate to the Premium screen via the hamburger menu → Upgrade to Premium
          </Text>
        </View>
      </View>
    );
  }

  // ── Calm Mode ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0F0A2E" barStyle="light-content" />

      {/* Dynamic background */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.bg, { opacity: bgOpacity }]} />

      <SafeAreaView style={styles.safeArea}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.dndBadge}>🔕 Do Not Disturb</Text>
          {running && (
            <Text style={styles.cycleCount}>
              {cycleCount} cycle{cycleCount !== 1 ? 's' : ''} completed
            </Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>4 • 7 • 8 Breathing</Text>
        <Text style={styles.subtitle}>
          {running ? 'Focus on your breath' : 'Tap the circle to begin'}
        </Text>

        {/* Animated circle */}
        <View style={styles.circleContainer}>
          {/* Outer glow rings */}
          <Animated.View style={[
            styles.ring3,
            { borderColor: phase.color + '20', transform: [{ scale: circleScale }] },
          ]} />
          <Animated.View style={[
            styles.ring2,
            { borderColor: phase.color + '40', transform: [{ scale: circleScale }] },
          ]} />
          <Animated.View style={[
            styles.ring1,
            { backgroundColor: phase.color + '18', borderColor: phase.color + '60', transform: [{ scale: circleScale }] },
          ]} />

          {/* Main circle — tap to start */}
          <TouchableOpacity
            onPress={running ? undefined : startSession}
            activeOpacity={running ? 1 : 0.85}>
            <Animated.View style={[
              styles.mainCircle,
              { backgroundColor: phase.color, transform: [{ scale: circleScale }] },
            ]}>
              {running ? (
                <>
                  <Text style={styles.phaseLabel}>{phaseLabel}</Text>
                  <Text style={styles.phaseSeconds}>{secondsLeft}</Text>
                </>
              ) : (
                <Text style={styles.startLabel}>Begin</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Instruction */}
        {running && (
          <Text style={styles.instruction}>{phase.instruction}</Text>
        )}

        {/* Phase indicators */}
        <View style={styles.phaseRow}>
          {PHASES.map((p, i) => (
            <View key={p.label} style={styles.phaseItem}>
              <View style={[
                styles.phaseDot,
                { backgroundColor: p.color + (running && phaseIndex === i ? 'FF' : '40') },
              ]} />
              <Text style={[styles.phaseItemLabel, { color: running && phaseIndex === i ? '#fff' : 'rgba(255,255,255,0.4)' }]}>
                {language === 'hi' ? p.labelHi : p.label}
              </Text>
              <Text style={[styles.phaseItemSec, { color: 'rgba(255,255,255,0.4)' }]}>
                {p.duration}s
              </Text>
            </View>
          ))}
        </View>

        {/* Stop button */}
        {running && (
          <TouchableOpacity style={styles.stopBtn} onPress={stopSession}>
            <Text style={styles.stopBtnText}>Stop Session</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0A2E' },
  bg: {
    backgroundColor: '#0F0A2E',
  },
  safeArea: { flex: 1, alignItems: 'center', paddingHorizontal: 24 },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', paddingTop: 16, marginBottom: 8,
  },
  dndBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600',
  },
  cycleCount: {
    color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600',
    alignSelf: 'center',
  },
  title: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    marginTop: 8, letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14, color: 'rgba(255,255,255,0.6)',
    marginTop: 6, marginBottom: 20,
  },
  circleContainer: {
    width: 280, height: 280,
    alignItems: 'center', justifyContent: 'center',
    marginVertical: 20,
  },
  ring3: {
    position: 'absolute',
    width: 280, height: 280, borderRadius: 140, borderWidth: 1,
  },
  ring2: {
    position: 'absolute',
    width: 240, height: 240, borderRadius: 120, borderWidth: 1.5,
  },
  ring1: {
    position: 'absolute',
    width: 200, height: 200, borderRadius: 100, borderWidth: 2,
  },
  mainCircle: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 20,
  },
  phaseLabel: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  phaseSeconds: { color: '#fff', fontSize: 44, fontWeight: '800', lineHeight: 50 },
  startLabel: { color: '#fff', fontSize: 22, fontWeight: '800' },
  instruction: {
    color: 'rgba(255,255,255,0.7)', fontSize: 14,
    textAlign: 'center', marginBottom: 32, lineHeight: 22,
  },
  phaseRow: {
    flexDirection: 'row', gap: 24, marginBottom: 40,
  },
  phaseItem: { alignItems: 'center', gap: 6 },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseItemLabel: { fontSize: 12, fontWeight: '600' },
  phaseItemSec: { fontSize: 11 },
  stopBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40,
  },
  stopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Premium gate
  gateCard: {
    margin: 20, borderRadius: 20, padding: 28,
    alignItems: 'center', elevation: 2,
  },
  gateEmoji: { fontSize: 52, marginBottom: 12 },
  gateTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10 },
  gateDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  gateFeaturesList: {
    width: '100%', borderRadius: 12, padding: 16, marginBottom: 20,
  },
  gateFeatureItem: { fontSize: 14, marginBottom: 8, fontWeight: '500' },
  gateNote: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
