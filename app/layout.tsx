import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./lib/auth-context";
import { RoleProvider } from "./lib/role-context";
import { CurrencyProvider } from "./lib/currency-context";
import { ClientLayout } from "./components/ClientLayout";
import { DateRangeProvider } from "./lib/date-range-context";
import { PersistenceProvider } from "./lib/persistence-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GBMS | Gold Business Management System",
  description: "Enterprise Gold Trading & Inventory Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 sticky top-0 z-[100]" />
        <div className="bg-black text-cyan-400 text-[10px] font-bold py-1 px-4 text-center sticky top-1 z-[100] uppercase tracking-widest flex items-center justify-center gap-4 border-b border-cyan-900 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            CLOUD MIRROR SYSTEM ACTIVE
          </span>
          <span className="opacity-50 tracking-normal">v0.2.0-NUCLEAR</span>
        </div>
        <AuthProvider>
          <RoleProvider>
            <CurrencyProvider>
              <DateRangeProvider>
                <PersistenceProvider>
                  <ClientLayout>{children}</ClientLayout>
                </PersistenceProvider>
              </DateRangeProvider>
            </CurrencyProvider>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
