"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Shield, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthModal } from "@/context/auth-modal-context";

export default function Pricing() {
  const { t } = useTranslation();
  const { openAuthModal } = useAuthModal();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const premiumPrice = billingCycle === "annual"
    ? t("pricing.annual.priceAnnual")
    : t("pricing.plans.premium.price");
  const premiumPriceNote = billingCycle === "annual"
    ? t("pricing.annual.perYear")
    : t("pricing.common.perMonth");
  const premiumSubNote = billingCycle === "annual"
    ? t("pricing.annual.perMonthEquiv")
    : null;

  const pricingData = [
    {
      key: "free",
      title: t("pricing.plans.free.title"),
      description: t("pricing.plans.free.description"),
      price: t("pricing.plans.free.price"),
      priceNote: null,
      subNote: null,
      features: t("pricing.plans.free.features", { returnObjects: true }) as string[],
      isHighlighted: false,
      ctaLabel: t("pricing.common.getStarted"),
      ctaHref: "/auth/register",
    },
    {
      key: "premium",
      title: t("pricing.plans.premium.title"),
      description: t("pricing.plans.premium.description"),
      price: premiumPrice,
      priceNote: premiumPriceNote,
      subNote: premiumSubNote,
      features: t("pricing.plans.premium.features", { returnObjects: true }) as string[],
      isHighlighted: true,
      ctaLabel: t("pricing.common.subscribe"),
      ctaHref: "/auth/register",
    },
    {
      key: "payg",
      title: t("pricing.plans.payg.title"),
      description: t("pricing.plans.payg.description"),
      price: t("pricing.plans.payg.price"),
      priceNote: t("pricing.plans.payg.priceNote"),
      subNote: null,
      features: t("pricing.plans.payg.features", { returnObjects: true }) as string[],
      isHighlighted: false,
      ctaLabel: t("pricing.common.buyNow"),
      ctaHref: "/auth/register",
    },
  ];

  return (
    <div className="w-full bg-[#4B3F2F] py-24 px-6 relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
      />

      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-[var(--highlight)] font-semibold text-sm uppercase tracking-widest">
            {t("pricing.section.label")}
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3 mb-4 leading-tight">
            {t("pricing.section.title")}
          </h2>
          <p className="mt-4 text-lg text-orange-100/70 max-w-2xl mx-auto leading-relaxed">
            {t("pricing.section.subtitle")}
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 mt-8 p-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-white text-[#4B3F2F] shadow-md"
                  : "text-orange-100 hover:text-white"
              }`}
            >
              {t("pricing.annual.toggleMonthly")}
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-white text-[#4B3F2F] shadow-md"
                  : "text-orange-100 hover:text-white"
              }`}
            >
              {t("pricing.annual.toggleAnnual")}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                {t("pricing.annual.save")}
              </span>
            </button>
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col items-center gap-6 mt-16 lg:flex-row lg:justify-center lg:items-stretch"
        >
          {pricingData.map((plan, i) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className={`w-full max-w-sm ${plan.isHighlighted ? "lg:scale-105 lg:z-10" : ""}`}
            >
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ type: "tween", duration: 0.25 }}
                className={`relative flex flex-col h-full rounded-2xl p-8 transition-all duration-300 ${
                  plan.isHighlighted
                    ? "bg-gradient-to-br from-[var(--highlight)] via-amber-500 to-[var(--highlight-dark)] text-white shadow-2xl shadow-[var(--highlight)]/20 ring-2 ring-white/20"
                    : "bg-white text-[var(--foreground)] shadow-xl border border-white/10"
                }`}
              >
                {/* Recommended badge */}
                {plan.isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white text-[var(--highlight-dark)] text-xs font-bold rounded-full shadow-lg uppercase tracking-wide">
                      <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                      {t("pricing.recommended", { defaultValue: "Recomendado" })}
                    </span>
                  </div>
                )}

                <h3 className={`text-xl font-bold mb-2 ${plan.isHighlighted ? "mt-2" : ""}`}>
                  {plan.title}
                </h3>
                <p className={`text-sm mb-6 leading-relaxed ${
                  plan.isHighlighted ? "text-white/80" : "text-[var(--foreground)]/60"
                }`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline justify-center mb-1">
                  <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                  {plan.priceNote && (
                    <span className={`text-base font-medium ml-1 ${
                      plan.isHighlighted ? "text-white/70" : "text-[var(--foreground)]/50"
                    }`}>
                      {plan.priceNote}
                    </span>
                  )}
                </div>
                {plan.subNote && (
                  <p className={`text-center text-sm mb-2 ${
                    plan.isHighlighted ? "text-white/70" : "text-[var(--foreground)]/50"
                  }`}>
                    {plan.subNote}
                  </p>
                )}

                {/* Microcopy */}
                {plan.isHighlighted && (
                  <p className="text-center text-xs text-white/60 mb-4">
                    {t("pricing.microcopy", { defaultValue: "El plan m\u00E1s popular \u00B7 Cancela cuando quieras" })}
                  </p>
                )}

                {/* Features */}
                <ul className="space-y-3 text-sm leading-6 mb-8 mt-4 flex-grow">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-start gap-3">
                      <Check
                        className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                          plan.isHighlighted ? "text-white" : "text-[var(--highlight)]"
                        }`}
                        aria-hidden="true"
                      />
                      <span className={plan.isHighlighted ? "text-white/90" : "text-[var(--foreground)]/70"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={openAuthModal}
                  className={`block w-full rounded-full py-3.5 px-6 text-center font-semibold transition-all duration-300 ${
                    plan.isHighlighted
                      ? "bg-white text-[var(--highlight-dark)] hover:bg-orange-50 shadow-lg"
                      : "bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-white hover:shadow-lg"
                  }`}
                >
                  {plan.ctaLabel}
                </button>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-6 mt-12 text-white/40"
        >
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4" aria-hidden="true" />
            <span>{t("pricing.trust.secure", { defaultValue: "Pago seguro con Stripe" })}</span>
          </div>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <div className="text-sm">
            {t("pricing.trust.cancel", { defaultValue: "Cancela en cualquier momento" })}
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {(t("pricing.testimonials", { returnObjects: true }) as Array<{ quote: string; author: string }>).map((item, i) => (
            <div key={i} className="bg-white/5 rounded-2xl p-6 text-center border border-white/10">
              <blockquote className="text-base text-orange-100/80 italic leading-relaxed mb-3">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <p className="text-sm text-white/40 font-medium">{item.author}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
