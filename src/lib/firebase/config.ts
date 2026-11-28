import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirebaseConfig,
  isFirebaseConfigured,
  type FirebaseClientConfig,
} from "./env";

export { getFirebaseConfig, isFirebaseConfigured, type FirebaseClientConfig };

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (cachedApp) return cachedApp;

  cachedApp =
    getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
  return cachedApp;
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (cachedAuth) return cachedAuth;

  cachedAuth = getAuth(app);
  return cachedAuth;
}
