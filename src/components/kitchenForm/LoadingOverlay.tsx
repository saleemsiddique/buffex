"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface LoadingOverlayProps {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: LoadingOverlayProps) {
  const { t } = useTranslation();
  const [tipIndex, setTipIndex] = useState(0);

  const tips = t("Buffex.form.loading.tips", { returnObjects: true }) as string[];

  useEffect(() => {
    if (!visible) return;
    setTipIndex(0);
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [visible, tips.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center space-y-5 max-w-sm mx-4"
          >
            {/* Spinner */}
            <div className="relative w-16 h-16">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-[var(--highlight)]/20 border-t-[var(--highlight)] rounded-full"
              />
            </div>

            <p className="text-lg font-semibold text-[var(--foreground)] text-center">
              {t("Buffex.form.loading.title")}
            </p>

            {/* Rotating tips */}
            <div className="h-6 relative w-full">
              <AnimatePresence mode="wait">
                <motion.p
                  key={tipIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-[var(--muted)] text-center absolute inset-0"
                >
                  {tips[tipIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
