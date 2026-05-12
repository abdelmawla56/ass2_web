import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isMockAuth = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true";

let onAuthStateChanged: any;

if (isMockAuth) {
  auth = {
    currentUser: {
      uid: "mock-user-123",
      displayName: "Test Ghost",
      photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost",
      getIdToken: async () => "mock-token",
    },
    signOut: async () => {
      window.location.reload();
    },
  };
  onAuthStateChanged = (a: any, callback: any) => {
    callback(auth.currentUser);
    return () => {};
  };
  provider = {};
  signInWithPopup = async () => {
    return { user: auth.currentUser };
  };
} else {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  onAuthStateChanged = (a: any, c: any) => import("firebase/auth").then(m => m.onAuthStateChanged(a, c));
  provider = new GoogleAuthProvider();
  signInWithPopup = (a: any, p: any) => import("firebase/auth").then(m => m.signInWithPopup(a, p));
}

export { auth, provider, signInWithPopup, onAuthStateChanged };
