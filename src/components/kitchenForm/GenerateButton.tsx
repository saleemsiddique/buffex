"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, UserCheck, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FormStatus } from "@/types/kitchen";
import { useAuthModal } from "@/context/auth-modal-context";

interface GenerateButtonProps {
  status: FormStatus;
  loadingUser: boolean;
  hasRecipes: boolean;
  tokenCost: number;
  onGetMoreRecipes: () => void;
  isLoggedIn: boolean;
}

export default function GenerateButton({
  status,
  loadingUser,
  hasRecipes,
  tokenCost,
  onGetMoreRecipes,
  isLoggedIn,
}: GenerateButtonProps) {
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();
  const isDisabled = loadingUser || status === "loading";

  // Not logged in — show "generate recipe" CTA that redirects to login
  if (!isLoggedIn && !loadingUser) {
    return (
      <button
        type="button"
        onClick={openAuthModal}
        className="w-full py-4 rounded-xl text-base font-bold bg-gradient-to-r from-[var(--highlight)] to-orange-500 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        {t("Buffex.form.generateRecipe", { defaultValue: "Generar receta" })}
      </button>
    );
  }

  // Logged in but no recipes — show "get more" CTA
  if (!hasRecipes && !loadingUser) {
    return (
      <button
        type="button"
        onClick={onGetMoreRecipes}
        className="w-full py-4 rounded-xl text-base font-bold bg-gradient-to-r from-[var(--highlight)] to-orange-500 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
      >
        <ShoppingCart className="w-5 h-5" />
        {t("Buffex.form.getMoreRecipes")}
      </button>
    );
  }

  return (
    <motion.button
      type="submit"
      whileHover={{ scale: isDisabled ? 1 : 1.01 }}
      whileTap={{ scale: isDisabled ? 1 : 0.99 }}
      className={`relative w-full py-4 rounded-xl text-base font-bold shadow-lg transition-all overflow-hidden ${
        isDisabled
          ? "bg-[var(--primary)]/30 cursor-not-allowed text-[var(--muted)]"
          : "bg-gradient-to-r from-[var(--highlight)] to-orange-500 text-white hover:shadow-xl"
      }`}
      disabled={isDisabled}
    >
      {/* Shimmer effect when idle */}
      {!isDisabled && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}

      <span className="relative z-10 flex flex-col items-center gap-0.5">
        {loadingUser ? (
          <>
            <span className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              {t("Buffex.form.buttons.generate.loadingUser")}
            </span>
          </>
        ) : status === "loading" ? (
          <>
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("Buffex.form.buttons.generate.generating")}
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              {t("Buffex.form.buttons.generate.ready")}
            </span>
            <span className="text-xs font-normal opacity-80">
              {t("Buffex.form.buttons.generate.cost", { cost: tokenCost })}
            </span>
          </>
        )}
      </span>
    </motion.button>
  );
}
