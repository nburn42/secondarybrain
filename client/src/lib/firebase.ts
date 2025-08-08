import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Debug logging to check what values are loaded
console.log('Firebase config loaded:', {
  hasApiKey: !!firebaseConfig.apiKey,
  apiKeyLength: firebaseConfig.apiKey?.length || 0,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId?.substring(0, 20) + '...'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();

// Helper functions
export const signInWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential;
};

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signOutUser = () => signOut(auth);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

// Auth state observer
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get ID token for API calls
export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};