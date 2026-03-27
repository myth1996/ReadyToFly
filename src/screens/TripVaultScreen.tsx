/**
 * TripVaultScreen — Store travel documents
 *
 * Free:    Up to 5 docs stored locally on device
 * Premium: Unlimited docs in Firebase Storage (cloud backup, survives reinstall)
 *
 * Supports: PDF, JPG, PNG — boarding pass, visa, hotel booking, passport
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigation } from '@react-navigation/native';
import { haptic } from '../services/HapticService';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { adService } from '../services/AdService';
import { AdGuard } from '../services/AdGuard';
import {
  VaultDoc,
  VaultDocCategory,
  VAULT_CATEGORIES,
  categoryEmoji,
  categoryLabel,
  getVaultDocs,
  saveLocalDoc,
  deleteLocalDoc,
  uploadToVault,
  deleteFromVault,
  formatFileSize,
} from '../services/VaultService';

const FREE_LIMIT = 5;

function DocCard({
  doc,
  onDelete,
  onOpen,
  themeColors,
}: {
  doc: VaultDoc;
  onDelete: () => void;
  onOpen: () => void;
  themeColors: any;
}) {
  const c = themeColors;
  const date = new Date(doc.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  return (
    <View style={[styles.docCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <TouchableOpacity style={styles.docMain} onPress={onOpen} activeOpacity={0.7}>
        <Text style={styles.docEmoji}>{categoryEmoji(doc.category)}</Text>
        <View style={styles.docInfo}>
          <Text style={[styles.docName, { color: c.text }]} numberOfLines={1}>{doc.name}</Text>
          <Text style={[styles.docMeta, { color: c.textSecondary }]}>
            {categoryLabel(doc.category)}  ·  {formatFileSize(doc.sizeBytes)}  ·  {date}
          </Text>
          {doc.isPremiumDoc && (
            <View style={styles.cloudBadge}>
              <Text style={styles.cloudBadgeText}>☁️ Cloud</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={{ color: '#EF4444', fontSize: 16 }}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

export function TripVaultScreen() {
  const { user, isPremiumUser } = useAuth();
  const { themeColors: c } = useSettings();
  const navigation = useNavigation<any>();

  const [docs, setDocs]               = useState<VaultDoc[]>([]);
  const [loading, setLoading]         = useState(true);
  const [uploading, setUploading]     = useState(false);
  const [selectedCategory, setCategory] = useState<VaultDocCategory>('boarding_pass');

  const loadDocs = useCallback(async () => {
    const list = await getVaultDocs(user?.uid ?? null, isPremiumUser);
    setDocs(list.sort((a, b) => b.addedAt - a.addedAt));
    setLoading(false);
  }, [user?.uid, isPremiumUser]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      adService.showInterstitial(AdGuard.canShowAd(isPremiumUser, null));
    });
    return unsub;
  }, [navigation, isPremiumUser]);

  const handleAdd = async () => {
    if (!isPremiumUser && docs.length >= FREE_LIMIT) {
      Alert.alert(
        '📦 Storage limit reached',
        `Free accounts can store up to ${FREE_LIMIT} documents. Upgrade to Premium for unlimited cloud storage.`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: '👑 Upgrade', onPress: () => navigation.navigate('Premium') },
        ],
      );
      return;
    }

    try {
      const result: DocumentPickerResponse = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
        copyTo: 'cachesDirectory',
      });

      setUploading(true);
      const id = Date.now().toString();
      const localUri = result.fileCopyUri ?? result.uri;

      const doc: VaultDoc = {
        id,
        name: result.name ?? 'document',
        category: selectedCategory,
        mimeType: result.type ?? 'application/octet-stream',
        sizeBytes: result.size ?? 0,
        addedAt: Date.now(),
        localUri,
        isPremiumDoc: isPremiumUser,
      };

      if (isPremiumUser && user?.uid) {
        try {
          const url = await uploadToVault(user.uid, localUri, doc);
          doc.downloadUrl = url;
          doc.localUri = undefined; // stored in cloud
        } catch {
          // Cloud upload failed — save locally as fallback
          doc.isPremiumDoc = false;
        }
      }

      await saveLocalDoc(doc);
      await loadDocs();
      haptic.success();
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Upload failed', 'Could not read this file. Please try a different format.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: VaultDoc) => {
    Alert.alert('Delete document?', `Remove "${doc.name}" from your vault?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          haptic.impact();
          await deleteLocalDoc(doc.id);
          if (doc.isPremiumDoc && user?.uid) {
            await deleteFromVault(user.uid, doc.id, doc.name);
          }
          await loadDocs();
        },
      },
    ]);
  };

  const handleOpen = (doc: VaultDoc) => {
    const uri = doc.downloadUrl ?? doc.localUri;
    if (uri) { Linking.openURL(uri); }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Storage info banner */}
      <View style={[styles.banner, { backgroundColor: isPremiumUser ? '#D1FAE5' : c.card, borderColor: isPremiumUser ? '#10B981' : c.border }]}>
        <Text style={[styles.bannerText, { color: isPremiumUser ? '#065F46' : c.text }]}>
          {isPremiumUser
            ? `☁️ Premium — Unlimited cloud storage · ${docs.length} doc${docs.length !== 1 ? 's' : ''} saved`
            : `📦 Free — ${docs.length}/${FREE_LIMIT} documents · Local only`
          }
        </Text>
        {!isPremiumUser && (
          <TouchableOpacity onPress={() => navigation.navigate('Premium')}>
            <Text style={[styles.upgradeLink, { color: c.primary }]}>Upgrade for cloud →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category selector */}
      <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>SAVE AS</Text>
      <View style={styles.categoryRow}>
        {VAULT_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.catBtn,
              { borderColor: c.border, backgroundColor: c.card },
              selectedCategory === cat.key && { borderColor: c.primary, backgroundColor: c.primary + '18' },
            ]}
            onPress={() => { haptic.selection(); setCategory(cat.key); }}>
            <Text style={styles.catEmoji}>{cat.emoji}</Text>
            <Text style={[styles.catLabel, { color: selectedCategory === cat.key ? c.primary : c.textSecondary }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add button */}
      <TouchableOpacity
        style={[styles.addBtn, { backgroundColor: c.primary }]}
        onPress={handleAdd}
        disabled={uploading}>
        {uploading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.addBtnText}>
              {isPremiumUser ? '☁️ Upload to Cloud Vault' : '📁 Add Document (Local)'}
            </Text>
        }
      </TouchableOpacity>

      {/* Docs list */}
      {loading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: 40 }} />
      ) : docs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🗂️</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>No documents yet</Text>
          <Text style={[styles.emptySub, { color: c.textSecondary }]}>
            Tap the button above to save your boarding pass, visa, or hotel booking
          </Text>
        </View>
      ) : (
        <FlatList
          data={docs}
          keyExtractor={d => d.id}
          renderItem={({ item }) => (
            <DocCard
              doc={item}
              onDelete={() => handleDelete(item)}
              onOpen={() => handleOpen(item)}
              themeColors={c}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={!isPremiumUser ? (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <BannerAd unitId={adService.getBannerUnitId()} size={BannerAdSize.ADAPTIVE_BANNER} />
            </View>
          ) : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  banner:      { margin: 16, borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerText:  { fontSize: 13, fontWeight: '600', flex: 1 },
  upgradeLink: { fontSize: 12, fontWeight: '700', marginLeft: 8 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginLeft: 16, marginBottom: 8 },

  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  catBtn:      { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  catEmoji:    { fontSize: 14 },
  catLabel:    { fontSize: 12, fontWeight: '600' },

  addBtn:     { marginHorizontal: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  docCard:    { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  docMain:    { flex: 1, flexDirection: 'row', alignItems: 'center' },
  docEmoji:   { fontSize: 28, marginRight: 12 },
  docInfo:    { flex: 1 },
  docName:    { fontSize: 14, fontWeight: '700' },
  docMeta:    { fontSize: 12, marginTop: 2 },
  cloudBadge: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#DBEAFE', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  cloudBadgeText: { color: '#1D4ED8', fontSize: 10, fontWeight: '700' },
  deleteBtn:  { padding: 4, marginLeft: 8 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 32 },
});
