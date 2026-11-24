"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, LayoutDashboard, LogOut } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/config";
import {
  logOut,
  toAuthUserProfile,
  type AuthUserProfile,
} from "@/lib/firebase/auth";
import { AuthModal } from "@/components/auth/AuthModal";

export function LandingAuthActions() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthUserProfile | null>(null);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup" | null>(
    null
  );

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const auth = getFirebaseAuth();
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setAuthUser(fbUser ? toAuthUserProfile(fbUser) : null);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 sm:gap-2.5">
        <Link
          href="/templates"
          className="hidden md:inline-flex items-center h-8 px-3 rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] text-[12px] font-medium transition-colors"
        >
          Galeri Template
        </Link>

        {authUser ? (
          <>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-[#E4E4E7] text-[#09090B] hover:bg-[#F4F4F5] text-[12px] font-medium transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#52525B]" />
              <span>Dashboard</span>
            </Link>
            <button
              type="button"
              onClick={() => void logOut()}
              title="Keluar (Sign Out)"
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md text-[#52525B] hover:text-[#EF4444] hover:bg-[#FEF2F2] text-[12px] font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setAuthModalMode("signin")}
              className="inline-flex items-center h-8 px-3 rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#F4F4F5] text-[12px] font-medium transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthModalMode("signup")}
              className="inline-flex items-center h-8 px-3 rounded-md bg-white border border-[#E4E4E7] text-[#09090B] hover:bg-[#F4F4F5] text-[12px] font-medium transition-colors"
            >
              Sign Up
            </button>
          </>
        )}

        <Link
          href="/editor"
          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-[#18181B] text-white text-[12px] font-medium hover:bg-[#27272A] transition-colors"
        >
          Buka Editor
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {authModalMode !== null && (
        <AuthModal
          key={authModalMode}
          open={true}
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onAuthSuccess={() => router.push("/dashboard")}
        />
      )}
    </>
  );
}
