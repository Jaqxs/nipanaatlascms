"use client";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { useRole } from "../lib/role-context";

export function LoginScreen() {
  const { login } = useAuth();
  const { setRole } = useRole();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "Login failed.");
    } else {
      // Sync the demo role toggle to the logged-in user's role
      const lower = email.trim().toLowerCase();
      if (lower === "m.rwey@nipana.tz") setRole("sales_ops");
      else setRole("admin");
    }
  };

  const fillDemo = (which: "admin" | "ops") => {
    setEmail(which === "admin" ? "j.assey@nipana.tz" : "m.rwey@nipana.tz");
    setPassword("demo");
    setError(null);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div
        className="hidden lg:flex lg:w-[44%] flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #7a571c 0%, #b8893d 100%)" }}
      >
        <div className="absolute -bottom-32 -right-32 opacity-10 pointer-events-none">
          <i className="ri-coin-line text-[520px]" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center bg-white/15"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)" }}
            >
              <i className="ri-coin-line text-white text-2xl" />
            </div>
            <div>
              <div className="font-display text-lg leading-tight">NIPANA Atlas</div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-white/70">GBMS · Mwanza</div>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <div className="font-display text-[40px] leading-tight mb-4">
            Run the whole gold business from one place.
          </div>
          <p className="text-white/80 text-base leading-relaxed">
            From the buying floor to the books — purchases, refining, sales, and cash, all in real time.
          </p>
        </div>

        <div className="relative text-xs text-white/60 tracking-wide">
          © 2026 NIPANA Atlas
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-paper-50/30">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "#b8893d" }}
            >
              <i className="ri-coin-line text-white text-xl" />
            </div>
            <div>
              <div className="font-display text-base text-ink">NIPANA Atlas</div>
              <div className="text-[10px] tracking-[0.18em] uppercase text-ink-muted">GBMS</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-[32px] leading-tight text-ink">Welcome back</h1>
            <p className="text-ink-muted text-sm mt-2">
              Sign in to your GBMS account.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <label className="block">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1.5">Email</div>
              <div className="relative">
                <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@nipana.tz"
                  className="input"
                  style={{ paddingLeft: "44px" }}
                />
              </div>
            </label>

            <label className="block">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">Password</span>
                <button type="button" className="text-[11px] text-gold-700 hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <i className="ri-lock-2-line absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input"
                  style={{ paddingLeft: "44px", paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
                  aria-label="Toggle password visibility"
                >
                  <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"} />
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-gold-500"
                />
                Remember this device
              </label>
            </div>

            {error && (
              <div className="surface-flat border-rose-500/30 bg-rose-100/40 px-3 py-2.5 text-sm text-rose-700 flex items-center gap-2">
                <i className="ri-error-warning-line" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? (
                <><i className="ri-loader-4-line animate-spin" /> Signing in...</>
              ) : (
                <><i className="ri-login-circle-line" /> Sign in</>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-line" />
            <span className="text-[10px] uppercase tracking-[0.18em] text-ink-faint">Demo accounts</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => fillDemo("admin")} className="surface-flat p-3 text-left hover:border-gold-500 transition">
              <div className="text-[11px] uppercase tracking-[0.14em] text-gold-700 mb-1">Admin</div>
              <div className="text-sm text-ink font-medium">Julius Assey</div>
              <div className="text-[11px] text-ink-muted truncate">j.assey@nipana.tz</div>
            </button>
            <button onClick={() => fillDemo("ops")} className="surface-flat p-3 text-left hover:border-gold-500 transition">
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-muted mb-1">Sales & Ops</div>
              <div className="text-sm text-ink font-medium">Maria Rweyemamu</div>
              <div className="text-[11px] text-ink-muted truncate">m.rwey@nipana.tz</div>
            </button>
          </div>

          <p className="text-[11px] text-ink-faint mt-4 text-center">
            Use password <span className="kbd">demo</span> for either account.
          </p>

          <p className="text-xs text-ink-faint mt-10 text-center">
            Need an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
