import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { haptic } from '../services/HapticService';

type Params = { url: string; title: string };

export function AppWebViewScreen() {
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const navigation = useNavigation<any>();
  const { themeColors: c } = useSettings();
  const { url, title } = route.params;

  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const onNavChange = (e: WebViewNavigation) => {
    setCanGoBack(e.canGoBack);
    setCanGoForward(e.canGoForward);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* ── Progress / Loading ── */}
      {loading && !error && (
        <View style={[styles.loadingBar, { backgroundColor: c.card }]}>
          <ActivityIndicator color={c.primary} size="small" />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading…</Text>
        </View>
      )}

      {/* ── Error State ── */}
      {error ? (
        <View style={styles.errorWrap}>
          <Text style={styles.errorEmoji}>🌐</Text>
          <Text style={[styles.errorTitle, { color: c.text }]}>Couldn't load page</Text>
          <Text style={[styles.errorSub, { color: c.textSecondary }]}>
            Check your internet connection
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: c.primary }]}
            onPress={() => { setError(false); webRef.current?.reload(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.browserLink}
            onPress={() => Linking.openURL(url)}>
            <Text style={[styles.browserLinkText, { color: c.primary }]}>Open in browser ↗</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webRef}
          source={{ uri: url }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          onNavigationStateChange={onNavChange}
          style={{ flex: 1 }}
        />
      )}

      {/* ── Bottom Navigation Bar ── */}
      {!error && (
        <View style={[styles.navBar, { backgroundColor: c.card, borderTopColor: c.border }]}>
          <TouchableOpacity
            style={styles.navBtn}
            disabled={!canGoBack}
            onPress={() => { haptic.selection(); webRef.current?.goBack(); }}>
            <Text style={[styles.navBtnText, { color: canGoBack ? c.primary : c.textSecondary }]}>‹ Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            disabled={!canGoForward}
            onPress={() => { haptic.selection(); webRef.current?.goForward(); }}>
            <Text style={[styles.navBtnText, { color: canGoForward ? c.primary : c.textSecondary }]}>Forward ›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => { haptic.selection(); webRef.current?.reload(); }}>
            <Text style={[styles.navBtnText, { color: c.primary }]}>⟳ Reload</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => { haptic.selection(); Linking.openURL(url); }}>
            <Text style={[styles.navBtnText, { color: c.primary }]}>↗ Browser</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  loadingText: { fontSize: 13 },
  errorWrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40,
  },
  errorEmoji: { fontSize: 56, marginBottom: 16 },
  errorTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  errorSub: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  retryBtn: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginBottom: 12,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  browserLink: { padding: 8 },
  browserLinkText: { fontSize: 14, fontWeight: '600' },
  navBar: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10, paddingHorizontal: 4, paddingBottom: 24,
  },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navBtnText: { fontSize: 13, fontWeight: '600' },
});
