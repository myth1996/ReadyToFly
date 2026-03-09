import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getOrCreateUser, isPremiumActive } from '../services/UserService';

// ── IMPORTANT: Replace with your Web Client ID from Firebase Console
// Firebase Console → Project Settings → General → Your apps → Web app → Client ID
// (or Google Cloud Console → APIs & Credentials → OAuth 2.0 Client IDs → Web client)
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  offlineAccess: false,
});

type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  isPremiumUser: boolean;
  googleAccessToken: string | null;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremiumUser: false,
  googleAccessToken: null,
  signOut: async () => {},
  signInWithGoogle: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const prevUidRef = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        if (prevUidRef.current !== currentUser.uid) {
          prevUidRef.current = currentUser.uid;
          try {
            const userDoc = await getOrCreateUser(
              currentUser.uid,
              currentUser.phoneNumber ?? currentUser.email ?? '',
            );
            setIsPremiumUser(isPremiumActive(userDoc));
          } catch (_) {
            setIsPremiumUser(false);
          }
        }
      } else {
        prevUidRef.current = null;
        setIsPremiumUser(false);
        setGoogleAccessToken(null);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;
      if (!idToken) { throw new Error('No ID token from Google'); }

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);

      // Get access token for Gmail API calls
      const tokens = await GoogleSignin.getTokens();
      setGoogleAccessToken(tokens.accessToken);
    } catch (error: any) {
      // Re-throw so LoginScreen can show error
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) { await GoogleSignin.signOut(); }
    } catch (_) { /* ignore */ }
    setGoogleAccessToken(null);
    await auth().signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isPremiumUser,
      googleAccessToken,
      signOut,
      signInWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
