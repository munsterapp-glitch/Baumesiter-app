import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { WorkerUser } from '../types';

interface AuthContextType {
  currentUser: User | null;
  workerProfile: WorkerUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  const translateAuthError = (code: string): string => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'Diese E-Mail-Adresse wird bereits für ein Konto verwendet.';
      case 'auth/invalid-email':
        return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
      case 'auth/operation-not-allowed':
        return 'Die E-Mail/Passwort-Anmeldung ist derzeit nicht aktiviert.';
      case 'auth/weak-password':
        return 'Das Passwort ist zu schwach (mindestens 6 Zeichen erforderlich).';
      case 'auth/user-disabled':
        return 'Dieses Benutzerkonto wurde deaktiviert.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Ungültige E-Mail-Adresse oder falsches Passwort.';
      case 'auth/too-many-requests':
        return 'Zu viele fehlgeschlagene Versuche. Bitte versuchen Sie es in Kürze erneut.';
      case 'auth/network-request-failed':
        return 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
      default:
        return 'Ein Fehler ist aufgetreten. Bitte prüfen Sie Ihre Eingaben.';
    }
  };

  const fetchOrCreateProfile = async (user: User, fallbackName?: string): Promise<WorkerUser> => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        const profile: WorkerUser = {
          workerId: user.uid,
          name: data.name || user.displayName || fallbackName || 'Mitarbeiter',
          email: data.email || user.email || '',
          createdAt: data.createdAt || new Date().toISOString(),
        };
        setWorkerProfile(profile);
        return profile;
      } else {
        const newProfile: WorkerUser = {
          workerId: user.uid,
          name: fallbackName || user.displayName || user.email?.split('@')[0] || 'Mitarbeiter',
          email: user.email || '',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userRef, newProfile);
        setWorkerProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.error('Error fetching/creating profile:', err);
      // Fallback local state if firestore fails
      const fallback: WorkerUser = {
        workerId: user.uid,
        name: fallbackName || user.displayName || user.email?.split('@')[0] || 'Mitarbeiter',
        email: user.email || '',
        createdAt: new Date().toISOString(),
      };
      setWorkerProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchOrCreateProfile(user);
      } else {
        setWorkerProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    clearAuthError();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await fetchOrCreateProfile(cred.user);
    } catch (error: any) {
      const message = translateAuthError(error.code || '');
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    clearAuthError();
    setLoading(true);
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      const user = cred.user;

      try {
        await updateProfile(user, { displayName: trimmedName });
      } catch (e) {
        console.warn('Could not set displayName on auth user:', e);
      }

      // Store in Firestore 'users' collection with document ID = user.uid
      const profileData: WorkerUser = {
        workerId: user.uid,
        name: trimmedName,
        email: trimmedEmail,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), profileData);
      setWorkerProfile(profileData);
    } catch (error: any) {
      const message = translateAuthError(error.code || '');
      setAuthError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setWorkerProfile(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        workerProfile,
        loading,
        login,
        register,
        logout,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
