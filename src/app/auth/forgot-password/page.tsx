/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Loader2, ArrowLeft, ChefHat } from "lucide-react";
import { useUser } from "@/context/user-context";
import { useTranslation } from "react-i18next";

export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendPasswordResetEmail } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(email);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Error sending password reset email:", err);
      setError(t("auth.forgotPassword.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex pt-16">

      {/* Left panel — branding (desktop only) */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-14 relative overflow-hidden flex-none"
        style={{ background: "linear-gradient(135deg,#c2410c 0%,#ea580c 50%,#f97316 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10">
          <Image src="/Buffex-Banner-noback.png" alt="Buffex" height={34} width={120} priority />
        </div>

        <div className="relative z-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-7"
            style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.28)",
            }}
          >
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight mb-3">
            {t("auth.forgotPassword.heroTitle")}
          </h1>
          <p className="text-white/70 text-base leading-relaxed">
            {t("auth.forgotPassword.heroSubtitle")}
          </p>
        </div>

        <p className="relative z-10 text-white/40 text-sm">© 2025 Buffex</p>
      </div>

      {/* Right panel — form on light background */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-12"
        style={{ background: "#FAFAF9" }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Image src="/Buffex-Banner-noback.png" alt="Buffex" height={30} width={110} priority />
        </div>

        <div className="w-full max-w-md">
          {submitted ? (
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
                style={{ background: "rgba(249,115,22,0.10)", border: "1px solid rgba(249,115,22,0.2)" }}
              >
                <Mail className="w-7 h-7 text-[#f97316]" />
              </div>
              <h2 className="text-2xl font-bold text-[#111111] mb-2">
                {t("auth.forgotPassword.submittedTitle")}
              </h2>
              <p className="text-[#6B7280] mb-8">
                {t("auth.forgotPassword.submitted", { email })}
              </p>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#f97316] hover:text-[#ea580c] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("auth.forgotPassword.backToLogin", { defaultValue: "Volver al inicio de sesión" })}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#111111] mb-1">
                  {t("auth.forgotPassword.title", { defaultValue: "¿Olvidaste tu contraseña?" })}
                </h2>
                <p className="text-sm text-[#6B7280]">
                  {t("auth.forgotPassword.subtitle", {
                    defaultValue: "Escribe tu email y te enviamos un enlace para restablecerla.",
                  })}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#111111] mb-2">
                    {t("auth.forgotPassword.emailLabel", { defaultValue: "Correo electrónico" })}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t("auth.forgotPassword.emailPlaceholder", { defaultValue: "tu@email.com" })}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-[#111111] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 transition-all"
                      style={{ border: "1px solid #E5E5E3" }}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#f97316 0%,#ea580c 100%)" }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("auth.forgotPassword.submitButton", { defaultValue: "Enviar enlace" })}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#f97316] hover:text-[#ea580c] transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("auth.forgotPassword.backToLogin", { defaultValue: "Volver al inicio de sesión" })}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
