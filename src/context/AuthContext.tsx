import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { getOrCreateUser, isPremiumActive } from '../services/UserService';

type AuthContextType = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  isPremiumUser: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isPremiumUser: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fetch or create Firestore user doc → check premium status
        try {
          const userDoc = await getOrCreateUser(
            currentUser.uid,
            currentUser.phoneNumber ?? '',
          );
          setIsPremiumUser(isPremiumActive(userDoc));
        } catch (_) {
          setIsPremiumUser(false);
        }
      } else {
        setIsPremiumUser(false);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await auth().signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, isPremiumUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
