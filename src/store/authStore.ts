import { create } from 'zustand';
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

interface AuthState {
  currentUser: IUser | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  loginWithGoogle: () => Promise<void>;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  
  // Internal methods
  setUser: (user: IUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAdmin: false,
  loading: true,
  error: null,
  
  // Action para login com Google
  loginWithGoogle: async () => {
    try {
      set({ loading: true, error: null });
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        await checkUserInDatabase(result.user);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      set({ error: error instanceof Error ? error.message : 'Erro ao fazer login com Google' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  // Action para login com email/senha
  loginWithEmailPassword: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (result.user) {
        await checkUserInDatabase(result.user);
      }
    } catch (error) {
      console.error('Email/password sign in error:', error);
      set({ error: error instanceof Error ? error.message : 'Erro ao fazer login' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  // Action para logout
  signOut: async () => {
    try {
      set({ loading: true });
      await firebaseSignOut(auth);
      set({ currentUser: null, isAdmin: false });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ error: error instanceof Error ? error.message : 'Erro ao fazer logout' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  // Métodos para manipular o estado
  setUser: (user) => set({ currentUser: user, isAdmin: user?.isAdmin || false }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

// Inicializar listener de autenticação
const initializeAuthListener = () => {
  onAuthStateChanged(auth, async (user) => {
    const { setUser, setLoading } = useAuthStore.getState();
    
    if (user) {
      const userData = await checkUserInDatabase(user);
      setUser(userData);
    } else {
      setUser(null);
    }
    
    setLoading(false);
  });
};

// Função auxiliar para verificar/criar usuário no Firestore
const checkUserInDatabase = async (user: any): Promise<IUser | null> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data() as IUser;
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

// Iniciar o listener de autenticação
initializeAuthListener();

export default useAuthStore; 