import {
  getFirestore,
  initializeFirestore,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseApp } from "@/lib/firebase/config";

let cachedDb: Firestore | null = null;

/**
 * Lazily initialized Firestore client separated from Auth/App setup so pages
 * that do not sync with Cloud Firestore avoid bundling the Firestore SDK.
 */
export function getFirebaseDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  if (cachedDb) return cachedDb;

  try {
    cachedDb = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
    });
  } catch {
    // Firestore may already be initialized during HMR / Fast Refresh
    cachedDb = getFirestore(app);
  }
  return cachedDb;
}
