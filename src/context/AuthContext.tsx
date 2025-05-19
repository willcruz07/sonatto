import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { IUser } from '@/types';

interface IAuthContext {
  currentUser: IUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<IAuthContext | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verifica se o usuário existe no Firestore, se não existir, cria
  const checkUserInDatabase = async (user: any) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data() as IUser;
        setIsAdmin(userData.isAdmin);
        return { ...userData, id: user.uid };
      } else {
        // Usuário não existe, criar novo documento (default: não é admin)
        const newUser: IUser = {
          id: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          isAdmin: false,
          photoURL: user.photoURL || '',
          createdAt: new Date(),
        };
        
        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (error) {
      console.error('Error checking user in database:', error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userData = await checkUserInDatabase(user);
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        await checkUserInDatabase(result.user);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const loginWithEmailPassword = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (result.user) {
        await checkUserInDatabase(result.user);
      }
    } catch (error) {
      console.error('Email/password sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    loginWithGoogle,
    loginWithEmailPassword,
    signOut,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 