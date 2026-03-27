/**
 * MultiLegScreen — Create and manage multi-leg / connecting flight trips
 *
 * Shows all current flights grouped by tripId.
 * Allows creating a named trip and assigning flights to it.
 * "Add Connecting Leg" button re-uses AddFlightScreen with a tripId pre-set.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useFlights } from '../context/FlightsContext';
import { useSettings } from '../context/SettingsContext';
import { FlightData, formatISOTime } from '../services/FlightService';
import { Trip, getTrips, createTrip, deleteTrip } from '../services/TripService';
import { AIRPORTS } from '../data/airports';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';

export function MultiLegScreen() {
  const { user, isPremiumUser } = useAuth();
  const { themeColors: c } = useSettings();
  const { flights, nextFlight } = useFlights();
  const navigation = useNavigation<any>();

  const [trips, setTrips]         = useState<Trip[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTripName, setNewTripName] = useState('');

  const loadTrips = useCallback(async () => {
    const list = await getTrips(user?.uid ?? null);
    setTrips(list);
  }, [user?.uid]);

  useEffect(() => { loadTrips(); }, [loadTrips]);

  // Interstitial on screen focus
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, nextFlight));
    });
    return unsub;
  }, [navigation, isPremiumUser, nextFlight]);

  // Group flights by tripId
  const groupedFlights = React.useMemo(() => {
    const groups: Record<string, FlightData[]> = {};
    flights.forEach(f => {
      const key = f.tripId ?? '__ungrouped';
      groups[key] = groups[key] ?? [];
      groups[key].push(f);
    });
    return groups;
  }, [flights]);

  const handleCreateTrip = async () => {
    if (!newTripName.trim()) { Alert.alert('Enter a trip name'); return; }
    haptic.impact();
    await createTrip(user?.uid ?? null, newTripName);
    await loadTrips();
    setNewTripName('');
    setShowCreate(false);
  };

  const handleDeleteTrip = async (trip: Trip) => {
    Alert.alert(`Delete trip "${trip.name}"?`, 'Flights in this trip will not be deleted — just ungrouped.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        haptic.impact();
        await deleteTrip(user?.uid ?? null, trip.id);
        await loadTrips();
      }},
    ]);
  };

  const renderFlightRow = (f: FlightData) => {
    const dep = AIRPORTS[f.dep.iata]?.city ?? f.dep.iata;
    const arr = AIRPORTS[f.arr.iata]?.city ?? f.arr.iata;
    const depTime = formatISOTime(f.dep.scheduledTime);
    return (
      <View key={f.flightIata + f.dep.scheduledTime} style={[styles.legRow, { borderColor: c.border }]}>
        {f.legNumber != null && (
          <View style={[styles.legNumBadge, { backgroundColor: c.primary }]}>
            <Text style={styles.legNumText}>Leg {f.legNumber}</Text>
          </View>
        )}
        <Text style={styles.legFlightEmoji}>✈️</Text>
        <View style={styles.legInfo}>
          <Text style={[styles.legCode, { color: c.text }]}>{f.flightIata}</Text>
          <Text style={[styles.legRoute, { color: c.textSecondary }]}>{dep} → {arr}</Text>
        </View>
        <Text style={[styles.legTime, { color: c.textSecondary }]}>{depTime}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]} contentContainerStyle={styles.content}>

      {/* Create trip button */}
      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: c.primary }]}
        onPress={() => setShowCreate(true)}>
        <Text style={styles.createBtnText}>✈️ + Create New Trip</Text>
      </TouchableOpacity>

      {/* Trips list */}
      {trips.map(trip => {
        const tripFlights = groupedFlights[trip.id] ?? [];
        return (
          <View key={trip.id} style={[styles.tripCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={styles.tripHeader}>
              <View>
                <Text style={[styles.tripName, { color: c.text }]}>{trip.name}</Text>
                <Text style={[styles.tripMeta, { color: c.textSecondary }]}>
                  {tripFlights.length} flight{tripFlights.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.tripActions}>
                <TouchableOpacity
                  style={[styles.addLegBtn, { borderColor: c.primary }]}
                  onPress={() => navigation.navigate('AddFlight', { tripId: trip.id, tripName: trip.name })}>
                  <Text style={[styles.addLegText, { color: c.primary }]}>+ Add Leg</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTrip(trip)} style={{ marginLeft: 8 }}>
                  <Text style={{ color: '#EF4444', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {tripFlights.length === 0 ? (
              <Text style={[styles.emptyLeg, { color: c.textSecondary }]}>
                Tap "+ Add Leg" to add your first flight to this trip
              </Text>
            ) : (
              tripFlights
                .sort((a, b) => (a.legNumber ?? 99) - (b.legNumber ?? 99))
                .map(renderFlightRow)
            )}

            {tripFlights.length >= 2 && (
              <View style={[styles.connectionBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.connectionText}>
                  🔁 Connecting: {tripFlights.map(f => f.dep.iata).join(' → ')} → {tripFlights[tripFlights.length - 1].arr.iata}
                </Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Ungrouped flights */}
      {(groupedFlights.__ungrouped ?? []).length > 0 && (
        <View style={[styles.tripCard, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.tripName, { color: c.textSecondary }]}>Ungrouped Flights</Text>
          {(groupedFlights.__ungrouped ?? []).map(renderFlightRow)}
        </View>
      )}

      {trips.length === 0 && Object.keys(groupedFlights).filter(k => k !== '__ungrouped').length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>✈️✈️</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No multi-leg trips yet</Text>
          <Text style={[styles.emptySub, { color: c.textSecondary }]}>
            Create a trip to group connecting flights together — e.g. DEL→SIN→SYD
          </Text>
        </View>
      )}

      {/* Create Trip Modal */}
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCreate(false)} />
        <View style={[styles.modalCard, { backgroundColor: c.card }]}>
          <Text style={[styles.modalTitle, { color: c.text }]}>Name Your Trip</Text>
          <TextInput
            style={[styles.modalInput, { color: c.text, borderColor: c.border }]}
            placeholder="e.g. Singapore Holiday 2026"
            placeholderTextColor={c.textSecondary}
            value={newTripName}
            onChangeText={setNewTripName}
            autoFocus
          />
          <View style={styles.modalBtns}>
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: c.border }]} onPress={() => setShowCreate(false)}>
              <Text style={[{ color: c.text, fontSize: 14, fontWeight: '600' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalCreateBtn, { backgroundColor: c.primary }]} onPress={handleCreateTrip}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Create Trip</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {!isPremiumUser && (
        <View style={{ alignItems: 'center', paddingVertical: 8 }}>
          <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 16, paddingBottom: 40 },

  createBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  tripCard:    { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  tripHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripName:    { fontSize: 16, fontWeight: '800' },
  tripMeta:    { fontSize: 12, marginTop: 2 },
  tripActions: { flexDirection: 'row', alignItems: 'center' },
  addLegBtn:   { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  addLegText:  { fontSize: 12, fontWeight: '700' },
  emptyLeg:    { fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },

  legRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  legNumBadge:{ borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 },
  legNumText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  legFlightEmoji: { fontSize: 16, marginRight: 10 },
  legInfo:    { flex: 1 },
  legCode:    { fontSize: 14, fontWeight: '700' },
  legRoute:   { fontSize: 12, marginTop: 1 },
  legTime:    { fontSize: 13, fontWeight: '600' },
  connectionBadge: { borderRadius: 8, padding: 8, marginTop: 10 },
  connectionText:  { color: '#92400E', fontSize: 12, fontWeight: '600' },

  empty:      { alignItems: 'center', paddingTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard:    { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:   { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  modalInput:   { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16 },
  modalBtns:    { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalCreateBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
});
