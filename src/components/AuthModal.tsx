"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChefHat, Eye, EyeOff, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";

interface AuthModalProps {
  onClose: () => void;
}

const spring = { type: "spring" as const, stiffness: 400, damping: 34 };

export default function AuthModal({ onClose }: AuthModalProps) {
  useBodyScrollLock(true);
  const { t } = useTranslation();
  const { login, loginWithGoogle } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.login.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();

      if (result?.isNewUser) {
        await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: result.user!.email,
            type: "welcome",
            data: { firstName: result.user!.firstName },
            lang: i18n.language,
          }),
        });
        onClose();
        router.push("/kitchen?onboarding=1");
      } else {
        onClose();
        router.push("/kitchen");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.login.error"));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="auth-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog"
        aria-modal="true"
        aria-label={t("auth.login.title")}
      >
        <motion.div
          key="auth-panel"
          initial={{ opacity: 0, y: 56 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={spring}
          className="w-full sm:max-w-[420px] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ background: "#111111" }}
        >
          {/* Gradient header */}
          <div className="relative overflow-hidden flex-none">
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg,#c2410c 0%,#ea580c 45%,#f97316 100%)" }}
            />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2) 0%, transparent 60%)",
              }}
            />
            <div className="relative z-10 px-5 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className="rounded-2xl flex items-center justify-center flex-none"
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  <ChefHat style={{ width: 22, height: 22, color: "#fff" }} />
                </div>
                <div>
                  <h2 className="text-[15px] font-extrabold text-white leading-tight tracking-tight">
                    {t("auth.modal.title")}
                  </h2>
                  <p className="text-[12px] text-white/70 mt-0.5 font-medium">
                    {t("auth.modal.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label={t("tokens.modal.close", { defaultValue: "Cerrar" })}
                className="rounded-full p-1.5 transition-colors"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)" }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} className="px-5 pt-5 pb-6 flex flex-col gap-3.5">
            {error && (
              <div
                className="px-3 py-2.5 rounded-xl text-[13px] font-medium"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl text-[14px] font-medium outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.register.passwordPlaceholder", { defaultValue: "Contraseña" })}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-11 rounded-xl text-[14px] font-medium outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(249,115,22,0.6)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                onClick={onClose}
                className="text-[12px] font-medium transition-colors"
                style={{ color: "rgba(255,255,255,0.45)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f97316")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >
                {t("auth.login.forgotPassword", { defaultValue: "Olvidé mi contraseña" })}
              </Link>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 relative overflow-hidden disabled:opacity-60 transition-opacity"
              style={{
                background: "linear-gradient(135deg,#f97316 0%,#ea580c 100%)",
                boxShadow: "0 4px 20px rgba(249,115,22,.40)",
              }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("auth.login.button", { defaultValue: "Iniciar sesión" })
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
                {t("auth.login.socialDivider", { defaultValue: "O continúa con" })}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* Google button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FcGoogle size={18} />
              )}
              {t("auth.login.googleButton")}
            </button>

            {/* Register link */}
            <p className="text-center text-[12px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {t("auth.login.noAccount", { defaultValue: "¿No tienes cuenta?" })}{" "}
              <Link
                href="/auth/register"
                onClick={onClose}
                className="font-semibold transition-colors"
                style={{ color: "#f97316" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fb923c")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#f97316")}
              >
                {t("auth.modal.registerLink")}
              </Link>
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
