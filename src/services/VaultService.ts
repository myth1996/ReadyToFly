/**
 * VaultService — Trip Vault document storage
 *
 * Free:    Stores file metadata + base64 thumbnail in AsyncStorage (local only)
 * Premium: Full files uploaded to Firebase Storage under users/{uid}/vault/
 *
 * Document categories: boarding_pass, visa, hotel, passport, insurance, other
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import storage from '@react-native-firebase/storage';

export type VaultDocCategory =
  | 'boarding_pass'
  | 'visa'
  | 'hotel'
  | 'passport'
  | 'insurance'
  | 'other';

export interface VaultDoc {
  id: string;
  name: string;
  category: VaultDocCategory;
  mimeType: string;
  sizeBytes: number;
  addedAt: number;
  // Free users: local base64 URI (AsyncStorage)
  localUri?: string;
  // Premium: Firebase Storage download URL
  downloadUrl?: string;
  isPremiumDoc: boolean;
}

const LOCAL_VAULT_KEY = 'flyeasy_vault_docs';

// ─── Category helpers ──────────────────────────────────────────────────────────

export const VAULT_CATEGORIES: Array<{ key: VaultDocCategory; emoji: string; label: string }> = [
  { key: 'boarding_pass', emoji: '🎫', label: 'Boarding Pass' },
  { key: 'visa',          emoji: '🛂', label: 'Visa' },
  { key: 'hotel',         emoji: '🏨', label: 'Hotel Booking' },
  { key: 'passport',      emoji: '📘', label: 'Passport' },
  { key: 'insurance',     emoji: '🛡️', label: 'Insurance' },
  { key: 'other',         emoji: '📎', label: 'Other' },
];

export function categoryEmoji(category: VaultDocCategory): string {
  return VAULT_CATEGORIES.find(c => c.key === category)?.emoji ?? '📎';
}

export function categoryLabel(category: VaultDocCategory): string {
  return VAULT_CATEGORIES.find(c => c.key === category)?.label ?? 'Document';
}

// ─── Local storage (Free) ────────────────────────────────────────────────────

export async function getLocalDocs(): Promise<VaultDoc[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveLocalDoc(doc: VaultDoc): Promise<void> {
  const docs = await getLocalDocs();
  const filtered = docs.filter(d => d.id !== doc.id);
  await AsyncStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify([...filtered, doc]));
}

export async function deleteLocalDoc(id: string): Promise<void> {
  const docs = await getLocalDocs();
  await AsyncStorage.setItem(LOCAL_VAULT_KEY, JSON.stringify(docs.filter(d => d.id !== id)));
}

// ─── Firebase Storage (Premium) ───────────────────────────────────────────────

export async function uploadToVault(
  uid: string,
  localUri: string,
  doc: Omit<VaultDoc, 'downloadUrl'>,
): Promise<string> {
  const path = `users/${uid}/vault/${doc.id}_${doc.name}`;
  const ref = storage().ref(path);
  await ref.putFile(localUri);
  const url = await ref.getDownloadURL();
  return url;
}

export async function deleteFromVault(uid: string, docId: string, docName: string): Promise<void> {
  try {
    const path = `users/${uid}/vault/${docId}_${docName}`;
    await storage().ref(path).delete();
  } catch {
    // File may not exist — non-fatal
  }
}

export async function getVaultDocs(uid: string | null, isPremium: boolean): Promise<VaultDoc[]> {
  // Always get local docs
  const local = await getLocalDocs();

  if (!isPremium || !uid) {
    return local.filter(d => !d.isPremiumDoc);
  }

  // Premium: list from Firebase Storage
  try {
    const ref = storage().ref(`users/${uid}/vault`);
    const list = await ref.listAll();
    const premiumDocs: VaultDoc[] = await Promise.all(
      list.items.map(async (item) => {
        const url = await item.getDownloadURL();
        const meta = await item.getMetadata();
        const parts = item.name.split('_');
        const id = parts[0];
        const name = parts.slice(1).join('_');
        return {
          id,
          name,
          category: (meta.customMetadata?.category as VaultDocCategory) ?? 'other',
          mimeType: meta.contentType ?? 'application/octet-stream',
          sizeBytes: meta.size ?? 0,
          addedAt: new Date(meta.timeCreated ?? Date.now()).getTime(),
          downloadUrl: url,
          isPremiumDoc: true,
        };
      }),
    );
    // Merge: premium docs override local with same id
    const premiumIds = new Set(premiumDocs.map(d => d.id));
    const localOnly = local.filter(d => !premiumIds.has(d.id));
    return [...premiumDocs, ...localOnly];
  } catch {
    return local;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)        { return `${bytes} B`; }
  if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
