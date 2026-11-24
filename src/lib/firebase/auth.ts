import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/config";

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export function toAuthUserProfile(user: User): AuthUserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

function requireAuth() {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error(
      "Firebase belum dikonfigurasi. Lengkapi variabel NEXT_PUBLIC_FIREBASE_* di .env.local terlebih dahulu."
    );
  }
  return auth;
}

export async function signInWithGoogle(): Promise<AuthUserProfile> {
  const auth = requireAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return toAuthUserProfile(result.user);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUserProfile> {
  const auth = requireAuth();
  const result = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password
  );
  const trimmedName = displayName?.trim();
  if (trimmedName) {
    await updateProfile(result.user, { displayName: trimmedName });
  }
  return {
    uid: result.user.uid,
    email: result.user.email,
    displayName: trimmedName || result.user.displayName,
    photoURL: result.user.photoURL,
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthUserProfile> {
  const auth = requireAuth();
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return toAuthUserProfile(result.user);
}

export async function resetPassword(email: string): Promise<void> {
  const auth = requireAuth();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function mapFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";

  switch (code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email atau kata sandi tidak cocok. Periksa kembali data Anda.";
    case "auth/invalid-email":
      return "Format alamat email tidak valid.";
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan masuk menggunakan tab Masuk atau Google.";
    case "auth/weak-password":
      return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Jendela login Google ditutup sebelum proses selesai.";
    case "auth/popup-blocked":
      return "Popup login diblokir oleh browser. Izinkan popup untuk situs ini lalu coba lagi.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan login. Tunggu beberapa menit lalu coba kembali.";
    case "auth/network-request-failed":
      return "Koneksi internet bermasalah. Periksa jaringan Anda lalu coba lagi.";
    case "auth/operation-not-allowed":
      return "Metode login ini belum diaktifkan di Firebase Console (Authentication → Sign-in method).";
    case "auth/unauthorized-domain":
      return "Domain ini belum terdaftar di Authorized Domains pada Firebase Console.";
    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return "Terjadi kendala saat autentikasi. Silakan coba lagi.";
  }
}
