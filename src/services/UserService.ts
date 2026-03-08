/**
 * Firestore user document service.
 * Manages user profiles, premium status, and preferences.
 */
import firestore from '@react-native-firebase/firestore';

export interface UserDoc {
  phone: string;
  isPremium: boolean;
  premiumExpiry: Date | null;
  createdAt: Date;
  gmailPermission: boolean;
  language: 'en' | 'hi';
  darkMode: boolean;
}

const usersRef = firestore().collection('users');

/**
 * Get or create a user document in Firestore.
 * If the document doesn't exist, creates it with defaults.
 */
export async function getOrCreateUser(uid: string, phone: string): Promise<UserDoc> {
  try {
    const doc = await usersRef.doc(uid).get();

    if (doc.exists()) {
      const data = doc.data()!;
      return {
        phone: data.phone ?? phone,
        isPremium: data.isPremium ?? false,
        premiumExpiry: data.premiumExpiry?.toDate() ?? null,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        gmailPermission: data.gmailPermission ?? false,
        language: data.language ?? 'en',
        darkMode: data.darkMode ?? false,
      };
    }

    // New user — create doc with defaults
    const newDoc: Record<string, any> = {
      phone,
      isPremium: false,
      premiumExpiry: null,
      createdAt: firestore.FieldValue.serverTimestamp(),
      gmailPermission: false,
      language: 'en',
      darkMode: false,
    };

    await usersRef.doc(uid).set(newDoc);

    return {
      phone,
      isPremium: false,
      premiumExpiry: null,
      createdAt: new Date(),
      gmailPermission: false,
      language: 'en',
      darkMode: false,
    };
  } catch (error) {
    // Return safe defaults if Firestore is unreachable
    return {
      phone,
      isPremium: false,
      premiumExpiry: null,
      createdAt: new Date(),
      gmailPermission: false,
      language: 'en',
      darkMode: false,
    };
  }
}

/**
 * Update specific fields in the user document.
 */
export async function updateUser(uid: string, updates: Partial<UserDoc>): Promise<void> {
  try {
    await usersRef.doc(uid).update(updates);
  } catch (_) {
    // Silently fail — settings are also cached locally via AsyncStorage
  }
}

/**
 * Check if a user's premium subscription is still active.
 */
export function isPremiumActive(userDoc: UserDoc): boolean {
  if (!userDoc.isPremium) { return false; }
  if (!userDoc.premiumExpiry) { return true; } // lifetime
  return userDoc.premiumExpiry.getTime() > Date.now();
}
