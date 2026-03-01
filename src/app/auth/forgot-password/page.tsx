
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
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
      // El mensaje es genérico por seguridad.
      setError(t("auth.forgotPassword.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4" style={{ background: "#FAFAF9" }}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md text-center" style={{ border: "1px solid #E5E5E3", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <h1 className="text-2xl md:text-3xl font-bold text-[#111111] mb-2">
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="text-[#6B7280] mb-8">
          {t("auth.forgotPassword.subtitle")}
        </p>
        {submitted ? (
          <div className="text-center text-[#f97316] font-semibold">
            {t("auth.forgotPassword.submitted", { email })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#111111] mb-2 text-left">
                {t("auth.forgotPassword.emailLabel")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t("auth.forgotPassword.emailPlaceholder")}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-colors duration-200"
                  style={{ border: "1px solid #E5E5E3" }}
                />
              </div>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#f97316] text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 size={20} className="animate-spin" />}
              {t("auth.forgotPassword.submitButton")}
            </button>
          </form>
        )}
        <div className="mt-8">
          <Link href="/auth/login" className="text-[#f97316] hover:text-[#ea580c] font-medium transition-colors">
            {t("auth.forgotPassword.backToLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}