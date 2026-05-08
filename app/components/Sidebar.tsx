"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole } from "../lib/role-context";
import { useAuth } from "../lib/auth-context";

const NAV = [
  { href: "/", label: "Dashboard", icon: "ri-layout-grid-line", admin: false },
  { href: "/transactions", label: "Transactions", icon: "ri-exchange-line", admin: false },
  { href: "/inventory", label: "Inventory", icon: "ri-archive-line", admin: false },
  { href: "/invoices", label: "Invoices", icon: "ri-file-paper-2-line", admin: false },
  { href: "/quotations", label: "Quotations", icon: "ri-price-tag-3-line", admin: false },
  { href: "/contacts", label: "Contacts", icon: "ri-contacts-book-line", admin: false },
  { href: "/sites", label: "Sites", icon: "ri-map-pin-line", admin: false },
  { href: "/cash-flow", label: "Cash Flow", icon: "ri-water-flash-line", admin: true },
  { href: "/reports", label: "Reports", icon: "ri-stack-line", admin: true },
  { href: "/ai-insights", label: "AI Insights", icon: "ri-sparkling-2-line", admin: true },
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const { isAdmin } = useRole();
  const { logout } = useAuth();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-ink/20 backdrop-blur-[2px] z-[60] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-64 bg-white border-r border-line flex flex-col transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full px-4 py-6">
          <div className="px-2 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/asset/logo.jpeg"
                alt="NIPANA Logo"
                className="w-10 h-10 object-contain rounded-lg"
              />
              <div>
                <div className="font-display text-[17px] leading-tight text-ink">
                  NIPANA
                </div>
                <div className="text-[10px] tracking-[0.18em] uppercase text-gold-600 font-bold">
                  [DEBUG MODE] GBMS
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden w-8 h-8 flex items-center justify-center text-ink-faint"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
            {NAV.map((item) => {
              if (item.admin && !isAdmin) return null;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`nav-item ${active ? "active" : ""}`}
                  onClick={() => window.innerWidth < 768 && setIsOpen(false)}
                >
                  <i className={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4">
            <div className="divider-rule mb-4" />
            <Link 
              href="/profile" 
              className={`nav-item ${pathname?.startsWith("/profile") ? "active" : ""}`}
              onClick={() => window.innerWidth < 768 && setIsOpen(false)}
            >
              <i className="ri-user-3-line" />
              <span>Profile</span>
            </Link>
            {isAdmin && (
              <Link 
                href="/settings" 
                className={`nav-item ${pathname?.startsWith("/settings") ? "active" : ""}`}
                onClick={() => window.innerWidth < 768 && setIsOpen(false)}
              >
                <i className="ri-settings-3-line" />
                <span>Settings</span>
              </Link>
            )}
            <button onClick={logout} className="nav-item w-full text-left">
              <i className="ri-logout-circle-r-line" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
