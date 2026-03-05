"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ChefHat } from "lucide-react";
import { useTranslation } from "react-i18next";

type Instruction = { paso: number; texto: string };

interface CookingModeProps {
  instructions: Instruction[];
  title: string;
  onClose: () => void;
}

export default function CookingMode({ instructions, title, onClose }: CookingModeProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const totalSteps = instructions.length;
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goNext();
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") goPrev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, totalSteps]);

  // Touch/swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) {
      if (dx > 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
  };

  const currentInstruction = instructions[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={t("cookingMode.ariaLabel")}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <ChefHat className="w-5 h-5 text-[var(--highlight)]" />
          <span className="text-white/80 text-sm font-medium truncate max-w-[200px] sm:max-w-xs">
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          aria-label={t("cookingMode.closeAriaLabel")}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/10">
        <motion.div
          className="h-full bg-[var(--highlight)]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step counter */}
      <p className="text-center text-white/40 text-sm mt-4">
        {t("cookingMode.stepCounter", { current: currentStep + 1, total: totalSteps })}
      </p>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="text-white text-2xl md:text-3xl leading-relaxed text-center font-[Fraunces] max-w-2xl"
          >
            {currentInstruction?.texto}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between px-8 pb-10 gap-4">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-base transition-all
            ${currentStep === 0
              ? "bg-white/5 text-white/25 cursor-not-allowed"
              : "bg-white/10 text-white hover:bg-white/20"
            }`}
          aria-label={t("cookingMode.prevAriaLabel")}
        >
          <ChevronLeft className="w-5 h-5" />
          {t("cookingMode.prev")}
        </button>

        <button
          onClick={goNext}
          className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-base bg-[var(--highlight)] text-white hover:bg-[var(--highlight-dark)] transition-all shadow-lg"
          aria-label={currentStep === totalSteps - 1 ? t("cookingMode.finishAriaLabel") : t("cookingMode.nextAriaLabel")}
        >
          {currentStep === totalSteps - 1 ? t("cookingMode.finish") : t("cookingMode.next")}
          {currentStep < totalSteps - 1 && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </motion.div>
  );
}
