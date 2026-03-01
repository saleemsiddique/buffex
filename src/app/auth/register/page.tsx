// app/auth/register/page.tsx
"use client";

import { AuthForm } from "@/components/AuthForm";
import { SocialAuth } from "@/components/SocialAuth";
import { AuthRedirect } from "@/components/AuthRedirect";
import Link from "next/link";
import { useTranslation } from "react-i18next";
export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <AuthRedirect>
      <main className="h-full w-full pt-24 pb-12 px-4 flex items-center justify-center" style={{ background: "#FAFAF9" }}>
        <section className="w-full max-w-md bg-white p-8 rounded-3xl flex flex-col items-center" style={{ border: "1px solid #E5E5E3", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <h1 className="text-2xl font-bold mb-8 text-[#111111]">{t("auth.register.title")}</h1>
          <AuthForm type="register" />
          <div className="my-6 w-full flex items-center gap-2">
            <span className="flex-1 border-t" style={{ borderColor: "#E5E5E3" }} />
            <span className="text-[#6B7280] text-xs">{t("auth.register.socialDivider")}</span>
            <span className="flex-1 border-t" style={{ borderColor: "#E5E5E3" }} />
          </div>
          <SocialAuth />
          <Link href="/auth/login" className="text-xs text-[#f97316] hover:text-[#ea580c] transition-colors mt-6">
            {t("auth.register.alreadyAccount")}
          </Link>
        </section>
      </main>
    </AuthRedirect>
  );
}
