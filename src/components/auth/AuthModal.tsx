"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { isFirebaseConfigured } from "@/lib/firebase/env";
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

let supportsDisplayTransitionCache: boolean | undefined;

function canTransitionDisplay(): boolean {
  if (supportsDisplayTransitionCache !== undefined) {
    return supportsDisplayTransitionCache;
  }
  if (
    typeof window === "undefined" ||
    !window.CSS?.supports?.("transition-behavior", "allow-discrete") ||
    !document.body
  ) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  void getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransitionCache = getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransitionCache;
}

function supportsTopLayerExit(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.CSS?.supports?.("overlay", "auto")) &&
    canTransitionDisplay()
  );
}

function isPointerOutsideDialog(
  e: React.PointerEvent<HTMLDialogElement>,
  dialog: HTMLDialogElement
): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    e.clientX < rect.left ||
    e.clientX > rect.right ||
    e.clientY < rect.top ||
    e.clientY > rect.bottom
  );
}

export function AuthModal({
  open,
  onClose,
  initialMode = "signin",
  reason,
  onAuthSuccess,
}: AuthModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutsideRef = useRef(false);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (open !== prevOpen || initialMode !== prevInitialMode) {
    setPrevOpen(open);
    setPrevInitialMode(initialMode);
    if (open) {
      setMode(initialMode);
      setError(null);
      setInfo(null);
    }
  }

  const firebaseReady = isFirebaseConfigured();

  const requestClose = useCallback(async () => {
    const dialog = dialogRef.current;
    if (!dialog) {
      onClose();
      return;
    }
    if (!dialog.open) {
      dialog.removeAttribute("data-closing");
      onClose();
      return;
    }
    if (!supportsTopLayerExit()) {
      if (dialog.hasAttribute("data-closing")) return;
      dialog.setAttribute("data-closing", "");
      const animations = dialog.getAnimations({ subtree: true });
      if (animations.length > 0) {
        await Promise.race([
          Promise.allSettled(animations.map((a) => a.finished)),
          new Promise((resolve) => setTimeout(resolve, 400)),
        ]);
      }
      if (!dialog.hasAttribute("data-closing")) return;
      dialog.removeAttribute("data-closing");
    }
    if (dialog.open) {
      dialog.close();
    }
  }, [onClose]);

  // Sync open prop with native top-layer <dialog>.showModal() / animated close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.removeAttribute("data-closing");
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      void requestClose();
    }
  }, [open, requestClose]);

  const handleNativeClose = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.removeAttribute("data-closing");
      dialog.returnValue = "";
    }
    onClose();
  };

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault();
    void requestClose();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
    pressedOutsideRef.current =
      e.target === dialog && isPointerOutsideDialog(e, dialog);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || "closedBy" in HTMLDialogElement.prototype) return;
    const shouldDismiss =
      pressedOutsideRef.current &&
      e.target === dialog &&
      isPointerOutsideDialog(e, dialog);
    pressedOutsideRef.current = false;
    if (shouldDismiss) {
      void requestClose();
    }
  };

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
      requestClose();
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
      requestClose();
    } catch (err) {
      setError(mapFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = submitting || googleSubmitting;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="auth-modal-title"
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      {...({ closedby: "any" } as Record<string, string>)}
      className="auth-dialog m-auto w-[calc(100%-2rem)] max-w-md max-h-[90dvh] overflow-y-auto p-0 bg-ui-card border border-ui-border rounded-xl shadow-2xl text-ui-text"
    >
      <div className="w-full">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ui-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-6 w-auto shrink-0" />
            <div>
              <h1
                id="auth-modal-title"
                className="text-[14px] font-semibold text-ui-text"
              >
                {mode === "signin"
                  ? "Masuk & Simpan ke Cloud"
                  : mode === "signup"
                    ? "Buat Akun Craftfolio"
                    : "Reset Kata Sandi"}
              </h1>
              <p className="text-[11px] text-ui-text-secondary">
                Sinkronkan CV lintas perangkat via Firebase Firestore
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void requestClose()}
            aria-label="Tutup modal autentikasi"
            title="Tutup (Esc)"
            className="p-1.5 rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Contextual Feature Gate Banner */}
          {reason && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-ui-subtle border border-ui-border text-[12px] text-ui-text font-medium leading-relaxed">
              <Sparkles className="w-4 h-4 text-ui-link shrink-0 mt-0.5" />
              <span>{reason}</span>
            </div>
          )}

          {/* Guest-to-Cloud Reassurance Banner */}
          {!reason && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-ui-panel border border-ui-border text-[11.5px] text-ui-text-secondary leading-relaxed">
              <Cloud className="w-4 h-4 text-ui-link shrink-0 mt-0.5" />
              <span>
                Draf CV yang sedang Anda buat di browser ini akan{" "}
                <strong className="text-ui-text font-medium">
                  otomatis digabungkan
                </strong>{" "}
                ke akun Cloud tanpa menghapus data lokal.
              </span>
            </div>
          )}

          {!firebaseReady && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-ui-warning-bg border border-ui-warning-border text-[11.5px] text-ui-warning-text leading-relaxed">
              <AlertCircle className="w-4 h-4 text-ui-warning shrink-0 mt-0.5" />
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
            <div className="grid grid-cols-2 gap-1 bg-ui-subtle p-1 rounded-lg border border-ui-border">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  mode === "signin"
                    ? "bg-ui-card text-ui-text shadow-xs"
                    : "text-ui-text-secondary hover:text-ui-text"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                  mode === "signup"
                    ? "bg-ui-card text-ui-text shadow-xs"
                    : "text-ui-text-secondary hover:text-ui-text"
                }`}
              >
                Daftar Akun
              </button>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-ui-error-bg border border-ui-error-border text-[12px] text-ui-error-text">
              <AlertCircle className="w-4 h-4 text-ui-error shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-ui-success-bg border border-ui-success-border text-[12px] text-ui-success-text">
              <CheckCircle2 className="w-4 h-4 text-ui-success shrink-0 mt-0.5" />
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
                className="w-full h-9 px-3 rounded-md bg-ui-card border border-ui-border hover:bg-ui-subtle disabled:opacity-50 text-[12.5px] font-medium text-ui-text inline-flex items-center justify-center gap-2 transition-colors"
              >
                {googleSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-ui-text-secondary" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Lanjutkan dengan Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <span className="w-full border-t border-ui-border" />
                <span className="bg-ui-card px-2.5 text-[11px] text-ui-text-placeholder shrink-0">
                  atau gunakan email
                </span>
                <span className="w-full border-t border-ui-border" />
              </div>
            </>
          )}

          {/* Email & Password Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="auth-display-name"
                  className="block text-[11px] font-medium text-ui-text-secondary mb-1"
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
                  className="w-full h-9 px-3 text-[13px] text-ui-text bg-ui-card border border-ui-border rounded-md focus:outline-none focus:ring-1 focus:ring-ui-focus disabled:opacity-50"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-[11px] font-medium text-ui-text-secondary mb-1"
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
                className="w-full h-9 px-3 text-[13px] text-ui-text bg-ui-card border border-ui-border rounded-md focus:outline-none focus:ring-1 focus:ring-ui-focus disabled:opacity-50"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="auth-password"
                    className="block text-[11px] font-medium text-ui-text-secondary"
                  >
                    Kata Sandi
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("reset")}
                      className="text-[11px] font-medium text-ui-text-secondary hover:text-ui-text hover:underline"
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
                    className="w-full h-9 pl-3 pr-9 text-[13px] text-ui-text bg-ui-card border border-ui-border rounded-md focus:outline-none focus:ring-1 focus:ring-ui-focus disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword
                        ? "Sembunyikan kata sandi"
                        : "Tampilkan kata sandi"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ui-text-placeholder hover:text-ui-text"
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
              className="w-full h-9 px-4 rounded-md bg-ui-primary hover:bg-ui-primary-hover disabled:opacity-50 text-white text-[12.5px] font-medium inline-flex items-center justify-center gap-2 transition-colors"
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
                className="w-full py-1.5 text-[12px] font-medium text-ui-text-secondary hover:text-ui-text hover:underline"
              >
                ← Kembali ke halaman Masuk
              </button>
            )}
          </form>

          <div className="pt-2 border-t border-ui-divider flex items-center justify-between text-[11px] text-ui-text-muted">
            <span>Tetap lanjut tanpa login?</span>
            <button
              type="button"
              onClick={() => void requestClose()}
              className="px-2.5 py-1 rounded-md text-[11.5px] font-medium text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
