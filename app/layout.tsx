import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./lib/auth-context";
import { RoleProvider } from "./lib/role-context";
import { CurrencyProvider } from "./lib/currency-context";
import { ClientLayout } from "./components/ClientLayout";

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
      <body className={inter.className}>
        <div className="bg-red-600 text-white text-[10px] font-bold py-1 px-4 text-center sticky top-0 z-[100] uppercase tracking-widest shadow-lg animate-pulse">
          V5-NEON System Active • Build: 0314AM • Stone-Age Engine Enabled
        </div>
        <div className="h-1 w-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 sticky top-0 z-[100]" />
        <div className="bg-ink text-white text-[10px] font-bold py-1 px-4 text-center sticky top-1 z-[100] uppercase tracking-widest flex items-center justify-center gap-4">
          <span>PATHFINDER SYSTEM ACTIVE</span>
          <span className="opacity-50">Build: RAINBOW-V4</span>
        </div>
        <AuthProvider>
          <RoleProvider>
            <CurrencyProvider>
              <ClientLayout>{children}</ClientLayout>
            </CurrencyProvider>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
