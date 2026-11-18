"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Invalid email or password");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #3e2009 0%, #5c3317 50%, #7a4520 100%)" }}>
      <div className="bg-white  p-10 w-full max-w-sm shadow-2xl">
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
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:border-[#C9952A] focus:outline-none focus:ring-2 focus:ring-[#C9952A]"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-600">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3  border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9952A] focus:border-[#C9952A]"
              placeholder="Enter admin password"
              required
            />
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
