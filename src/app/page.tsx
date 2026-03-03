"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { motion } from 'framer-motion';
import { ChefHat, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthModal } from '@/context/auth-modal-context';

import InfoBox from "@/components/infoBox";
import FAQ from "@/components/faq";
import Pricing from "@/components/pricing";
import KitchenContent from "./kitchen/KitchenContent";
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    if (!loading && user) {
      router.push('/kitchen');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <main className="h-full w-full bg-[var(--background)]">

      {/* Recipe Form - the product front and center */}
      <section className="relative flex justify-center items-center min-h-[600px] md:min-h-[820px]">
        <KitchenContent />
      </section>

      {/* Key Features */}
      <section className="flex justify-center items-center w-full">
        <InfoBox />
      </section>

      {/* Pricing */}
      <section id="pricing" className="flex flex-col justify-between items-center">
        <Pricing />
      </section>

      {/* FAQ */}
      <section>
        <FAQ />
      </section>

      {/* CTA Final */}
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--highlight)] via-amber-500 to-[var(--highlight-dark)]" />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />

        <div className="relative py-24 px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-8"
            >
              <ChefHat className="w-10 h-10 text-white" aria-hidden="true" />
            </motion.div>

            <h2 className="font-display text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              {t("cta.title")}
            </h2>

            <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-lg mx-auto">
              {t("cta.description")}
            </p>

            <motion.button
              type="button"
              onClick={openAuthModal}
              className="group inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-lg
                         bg-white text-[var(--highlight-dark)] shadow-xl
                         hover:bg-orange-50 transition-all duration-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {t("cta.button")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </motion.button>

            <p className="mt-6 text-sm text-white/50">
              {t("cta.subtext")}
            </p>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
