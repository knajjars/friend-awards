"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="btn-ghost flex items-center gap-2 text-sm"
      onClick={() => void signOut()}
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  );
}
