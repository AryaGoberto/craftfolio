"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Sparkles,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  mapFirebaseAuthError,
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/firebase/auth";

type AuthMode = "signin" | "signup" | "reset";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  reason?: string;
  onAuthSuccess?: () => void;
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export function AuthModal({
  open,
  onClose,
  initialMode = "signin",
  reason,
  onAuthSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setInfo(null);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Masukkan alamat email Anda terlebih dahulu.");
      return;
    }

    if (mode === "reset") {
      setSubmitting(true);
      try {
        await resetPassword(trimmedEmail);
        setInfo(
          "Tautan reset kata sandi telah dikirim ke email Anda. Periksa kotak masuk atau folder spam."
        );
      } catch (err) {
        setError(mapFirebaseAuthError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (password.length < 6) {
      setError("Kata sandi minimal harus 6 karakter.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(trimmedEmail, password, displayName);
      } else {
        await signInWithEmail(trimmedEmail, password);
      }
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || googleSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        className="w-full max-w-md bg-white border border-[#E4E4E7] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E4E4E7] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-6 w-auto shrink-0" />
            <div>
              <h2
                id="auth-modal-title"
                className="text-[14px] font-semibold text-[#09090B]"
              >
                {mode === "signin"
                  ? "Masuk & Simpan ke Cloud"
                  : mode === "signup"
                    ? "Buat Akun Craftfolio"
                    : "Reset Kata Sandi"}
              </h2>
              <p className="text-[11px] text-[#52525B]">
                Sinkronkan CV lintas perangkat via Firebase Firestore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal autentikasi"
            className="p-1.5 rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Contextual Feature Gate Banner */}
          {reason && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#09090B] font-medium leading-relaxed">
              <Sparkles className="w-4 h-4 text-[#18181B] shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          )}

          {/* Guest-to-Cloud Reassurance Banner */}
          {!reason && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#FAFAFA] border border-[#E4E4E7] text-[11.5px] text-[#52525B] leading-relaxed">
              <Cloud className="w-4 h-4 text-[#18181B] shrink-0 mt-0.5" />
              <span>
                Draf CV yang sedang Anda buat di browser ini akan{" "}
                <strong className="text-[#09090B] font-medium">
                  otomatis digabungkan
                </strong>{" "}
                ke akun Cloud tanpa menghapus data lokal.
              </span>
            </div>
          )}

          {!firebaseReady && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[11.5px] text-[#92400E] leading-relaxed">
              <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">
                  Konfigurasi Firebase belum diisi di <code>.env.local</code>
                </p>
                <p className="mt-0.5">
                  Tambahkan <code>NEXT_PUBLIC_FIREBASE_API_KEY</code> dan{" "}
                  <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code> (lihat{" "}
                  <code>.env.example</code>). Mode Guest tetap berfungsi penuh.
                </p>
              </div>
            </div>
          )}

          {/* Mode Tabs */}
          {mode !== "reset" && (
            <div className="grid grid-cols-2 gap-1 bg-[#F4F4F5] p-1 rounded-lg border border-[#E4E4E7]">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  mode === "signin"
                    ? "bg-white text-[#09090B] shadow-xs"
                    : "text-[#52525B] hover:text-[#09090B]"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  mode === "signup"
                    ? "bg-white text-[#09090B] shadow-xs"
                    : "text-[#52525B] hover:text-[#09090B]"
                }`}
              >
                Daftar Akun
              </button>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[12px] text-[#B91C1C]">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[12px] text-[#065F46]">
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          {/* Google Sign-In */}
          {mode !== "reset" && (
            <>
              <button
                type="button"
                disabled={!firebaseReady || isBusy}
                onClick={handleGoogleSignIn}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E4E4E7] hover:bg-[#F4F4F5] disabled:opacity-50 text-[12.5px] font-medium text-[#09090B] inline-flex items-center justify-center gap-2 transition-colors"
              >
                {googleSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#52525B]" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Lanjutkan dengan Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <span className="w-full border-t border-[#E4E4E7]" />
                <span className="bg-white px-2.5 text-[11px] text-[#A1A1AA] shrink-0">
                  atau gunakan email
                </span>
                <span className="w-full border-t border-[#E4E4E7]" />
              </div>
            </>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="auth-display-name"
                  className="block text-[11px] font-medium text-[#52525B] mb-1"
                >
                  Nama Lengkap (Opsional)
                </label>
                <input
                  id="auth-display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Raka Pratama"
                  disabled={!firebaseReady || isBusy}
                  className="w-full h-9 px-3 text-[13px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B] disabled:opacity-50"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-[11px] font-medium text-[#52525B] mb-1"
              >
                Alamat Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                disabled={!firebaseReady || isBusy}
                className="w-full h-9 px-3 text-[13px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B] disabled:opacity-50"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="auth-password"
                    className="block text-[11px] font-medium text-[#52525B]"
                  >
                    Kata Sandi
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("reset")}
                      className="text-[11px] font-medium text-[#52525B] hover:text-[#09090B] hover:underline"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    disabled={!firebaseReady || isBusy}
                    className="w-full h-9 pl-3 pr-9 text-[13px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#A1A1AA] hover:text-[#09090B]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!firebaseReady || isBusy}
              className="w-full h-9 px-4 rounded-md bg-[#18181B] hover:bg-[#27272A] disabled:opacity-50 text-white text-[12.5px] font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              <span>
                {mode === "signin"
                  ? "Masuk dengan Email"
                  : mode === "signup"
                    ? "Daftar & Simpan ke Cloud"
                    : "Kirim Link Reset Kata Sandi"}
              </span>
            </button>

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="w-full py-1.5 text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:underline"
              >
                ← Kembali ke halaman Masuk
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
