"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signIn.email({ email, password });
      if (!result.error) {
        router.replace("/admin");
        return;
      }
      setError("Invalid email or password");
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-6"
      style={{ background: "linear-gradient(135deg, #3e2009 0%, #5c3317 50%, #7a4520 100%)" }}>
      <div className="w-full max-w-sm bg-white p-6 shadow-2xl sm:p-10">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/p4.png" alt="SAC Logo" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-2xl font-black text-[#5C3317]" style={{ fontFamily: "Georgia, serif" }}>
            CMS Admin
          </h1>
          <p className="text-sm text-gray-500 mt-1">SAC Holy Family Province</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-600">
              Email address
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-base focus:border-[#C9952A] focus:outline-none focus:ring-2 focus:ring-[#C9952A] sm:text-sm"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-600">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 px-4 py-3 pr-11 text-base focus:border-[#C9952A] focus:outline-none focus:ring-2 focus:ring-[#C9952A] sm:text-sm"
                placeholder="Enter admin password"
                required
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center text-gray-500 hover:text-[#5C3317] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9952A]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                aria-controls="admin-password"
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3  font-black text-sm uppercase tracking-wider transition-opacity disabled:opacity-50"
            style={{ background: "#5C3317", color: "#C9952A" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
