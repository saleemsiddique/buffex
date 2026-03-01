/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Lock, Loader2 } from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, confirmPasswordReset } from "firebase/auth";
import { useTranslation } from "react-i18next";
export const dynamic = 'force-dynamic';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);

  useEffect(() => {
    // We get the oobCode from the URL query parameters
    const params = new URLSearchParams(window.location.search);
    setOobCode(params.get("oobCode"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.resetPassword.errors.mismatch"));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t("auth.resetPassword.errors.minLength"));
      setLoading(false);
      return;
    }

    if (!oobCode) {
      setError(t("auth.resetPassword.errors.invalidCode"));
      setLoading(false);
      return;
    }

    try {
      // Firebase handles secure hashing automatically
      const firebaseConfig = {
        // Replace with your Firebase project configuration
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
      };
      
      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setError(t("auth.resetPassword.errors.default"));
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = { border: "1px solid #E5E5E3", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" };
  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl bg-white text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-colors duration-200";
  const inputStyle = { border: "1px solid #E5E5E3" };

  if (success) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4" style={{ background: "#FAFAF9" }}>
        <div className="bg-white rounded-3xl p-8 w-full max-w-md text-center" style={cardStyle}>
          <h1 className="text-2xl md:text-3xl font-bold text-[#f97316] mb-4">
            {t("auth.resetPassword.successTitle")}
          </h1>
          <p className="text-[#6B7280] mb-8">
            {t("auth.resetPassword.successSubtitle")}
          </p>
          <a href="/auth/login" className="text-[#f97316] hover:text-[#ea580c] font-medium transition-colors">
            {t("auth.resetPassword.backToLogin")}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-4" style={{ background: "#FAFAF9" }}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md text-center" style={cardStyle}>
        <h1 className="text-2xl md:text-3xl font-bold text-[#111111] mb-2">
          {t("auth.resetPassword.title")}
        </h1>
        <p className="text-[#6B7280] mb-8">
          {t("auth.resetPassword.subtitle")}
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#111111] mb-2 text-left">
              {t("auth.resetPassword.newPasswordLabel")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-[#111111] mb-2 text-left">
              {t("auth.resetPassword.confirmPasswordLabel")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#6B7280]" />
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
                className={inputClass}
                style={inputStyle}
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
            {t("auth.resetPassword.submitButton")}
          </button>
        </form>
        <div className="mt-8">
          <a href="/auth/login" className="text-[#f97316] hover:text-[#ea580c] font-medium transition-colors">
            {t("auth.resetPassword.backToLogin")}
          </a>
        </div>
      </div>
    </div>
  );
}
