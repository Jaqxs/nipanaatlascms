import "./globals.css";
import type { Metadata } from "next";
import { Sidebar } from "./components/Sidebar";
import { TopBar } from "./components/TopBar";
import { RoleProvider } from "./lib/role-context";
import { CurrencyProvider } from "./lib/currency-context";
import { DateRangeProvider } from "./lib/date-range-context";
import { AuthProvider } from "./lib/auth-context";
import { AuthGate } from "./components/AuthGate";

export const metadata: Metadata = {
  title: "GBMS — Atlas",
  description: "Gold Business Management System — Executive Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css"
        />
      </head>
      <body className="h-screen overflow-hidden">
        <AuthProvider>
          <RoleProvider>
            <CurrencyProvider>
              <DateRangeProvider>
              <AuthGate>
                <div className="flex h-screen w-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                    <TopBar />
                    <main className="flex-1 overflow-y-auto px-6 md:px-10 py-8">
                      <div className="max-w-[1480px] mx-auto">{children}</div>
                      <footer className="mt-12 px-0 py-6 text-xs text-ink-faint max-w-[1480px] mx-auto">
                        <div className="divider-rule mb-4" />
                        NIPANA Atlas · GBMS v1.0 · Mwanza Operations
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
