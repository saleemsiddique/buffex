// app/auth/login/page.tsx
"use client";

import { AuthForm } from "@/components/AuthForm";
import { SocialAuth } from "@/components/SocialAuth";
import { AuthRedirect } from "@/components/AuthRedirect";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ChefHat } from "lucide-react";
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <AuthRedirect>
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
              {t("auth.login.heroTitle")}
            </h1>
            <p className="text-white/70 text-base leading-relaxed">
              {t("auth.login.heroSubtitle")}
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
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#111111] mb-1">
                {t("auth.login.title", { defaultValue: "Bienvenido de nuevo" })}
              </h2>
              <p className="text-sm text-[#6B7280]">
                {t("auth.login.subtitle", { defaultValue: "Inicia sesión en tu cuenta de Buffex" })}
              </p>
            </div>

            <AuthForm type="login" />

            <div className="my-6 flex items-center gap-3">
              <span className="flex-1 border-t" style={{ borderColor: "#E5E5E3" }} />
              <span className="text-xs text-[#6B7280]">
                {t("auth.login.socialDivider", { defaultValue: "O continúa con" })}
              </span>
              <span className="flex-1 border-t" style={{ borderColor: "#E5E5E3" }} />
            </div>

            <SocialAuth />

            <p className="text-center text-sm mt-8 text-[#6B7280]">
              {t("auth.login.noAccount", { defaultValue: "¿No tienes cuenta?" })}{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-[#f97316] hover:text-[#ea580c] transition-colors"
              >
                {t("auth.login.registerLink", { defaultValue: "Regístrate gratis" })}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </AuthRedirect>
  );
}
