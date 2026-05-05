"use client";
import { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";
import { LoginScreen } from "./LoginScreen";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, ready } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted">
        <i className="ri-loader-4-line animate-spin text-2xl text-gold-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
