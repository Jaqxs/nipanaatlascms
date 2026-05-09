"use client";
import "./globals.css";
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { RoleProvider } from "./lib/role-context";
import { CurrencyProvider } from "./lib/currency-context";
import { DateRangeProvider } from "./lib/date-range-context";
import { AuthProvider } from "./lib/auth-context";
import { AuthGate } from "./components/AuthGate";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css"
        />
      </head>
      <body className="h-screen overflow-hidden">
        <div className="bg-yellow-400 text-black text-[10px] font-bold py-1 px-4 text-center sticky top-0 z-[100] uppercase tracking-widest">
          V3-ULTRA System Active • Build: 0314AM • Local Database Bypass Enabled
        </div>
        <AuthProvider>
          <RoleProvider>
            <CurrencyProvider>
              <DateRangeProvider>
              <AuthGate>
                <div className="flex h-screen w-screen overflow-hidden">
                  <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                  <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                    <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
                    <main className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
                      <div className="max-w-[1480px] mx-auto">{children}</div>
                      <footer className="mt-12 px-0 py-6 text-xs text-ink-faint max-w-[1480px] mx-auto flex justify-between">
                        <div>NIPANA Atlas · GBMS v1.0.42 · Mwanza Operations</div>
                        <div className="text-gold-600 font-mono font-bold">LIVE_BUILD_0202AM</div>
                      </footer>
                    </main>
                  </div>
                </div>
              </AuthGate>
              </DateRangeProvider>
            </CurrencyProvider>
          </RoleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
