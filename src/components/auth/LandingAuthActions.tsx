"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { ColorSchemeToggle } from "@/components/ColorSchemeToggle";
import { isFirebaseConfigured } from "@/lib/firebase/env";
import type { AuthUserProfile } from "@/lib/firebase/auth";

const AuthModal = dynamic(
  () => import("@/components/auth/AuthModal").then((mod) => mod.AuthModal),
  { ssr: false }
);

export function LandingAuthActions() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUserProfile | null>(null);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup" | null>(
    null
  );

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const [{ onAuthStateChanged }, { getFirebaseAuth }, { toAuthUserProfile }] =
          await Promise.all([
            import("firebase/auth"),
            import("@/lib/firebase/config"),
            import("@/lib/firebase/auth"),
          ]);
        if (cancelled) return;
        const auth = getFirebaseAuth();
        if (!auth) return;

        unsubscribe = onAuthStateChanged(auth, (fbUser) => {
          if (!cancelled) {
            setAuthUser(fbUser ? toAuthUserProfile(fbUser) : null);
          }
        });
      } catch {
        // Ignore transient dynamic chunk load failures on landing navbar
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const handleLogOut = async () => {
    const { logOut } = await import("@/lib/firebase/auth");
    await logOut();
  };

  return (
    <>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {authUser ? (
          <>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle text-[12.5px] font-medium transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-md bg-ui-primary text-white text-[12.5px] font-medium hover:bg-ui-primary-hover transition-colors"
            >
              <span>Buka Editor</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <span
              className="hidden sm:inline-block h-4 w-px bg-ui-border mx-0.5"
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => void handleLogOut()}
              title="Keluar (Sign Out)"
              aria-label="Keluar"
              className="inline-flex items-center gap-1 h-8 px-2 sm:px-2.5 rounded-md text-ui-text-secondary hover:text-ui-error hover:bg-ui-error-bg text-[12px] font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setAuthModalMode("signin")}
              className="inline-flex items-center h-8 px-2.5 sm:px-3 rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-subtle text-[12.5px] font-medium transition-colors"
            >
              Masuk
            </button>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1.5 h-8 px-3 sm:px-3.5 rounded-md bg-ui-primary text-white text-[12.5px] font-medium hover:bg-ui-primary-hover transition-colors"
            >
              <span>Buka Editor</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <span
              className="h-4 w-px bg-ui-border mx-0.5"
              aria-hidden="true"
            />
          </>
        )}

        <ColorSchemeToggle />
      </div>

      {authModalMode !== null && (
        <AuthModal
          open={authModalMode !== null}
          initialMode={authModalMode ?? "signin"}
          onClose={() => setAuthModalMode(null)}
          onAuthSuccess={() => router.push("/dashboard")}
        />
      )}
    </>
  );
}
