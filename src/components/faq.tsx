"use client";
import { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const staggerVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqData = t("faq.questions", { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  const toggleFAQ = (faqIndex: number) => {
    setOpenIndex(openIndex === faqIndex ? null : faqIndex);
  };

  return (
    <div className="w-full bg-[var(--background)] py-24 px-6 relative">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, var(--highlight) 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      <div className="relative mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-[var(--highlight)] font-semibold text-sm uppercase tracking-widest">
            {t("faq.section.title")}
          </span>
          <h2 className="font-display mt-3 text-4xl font-bold tracking-tight text-[var(--primary)] sm:text-5xl">
            {t("faq.section.subtitle")}
          </h2>
          <p className="mt-5 text-lg text-[var(--foreground)]/60 max-w-2xl mx-auto leading-relaxed">
            {t("faq.section.description")}
          </p>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          variants={staggerVariants}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-3"
        >
          {faqData.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`bg-white rounded-xl overflow-hidden transition-all duration-300 border ${
                openIndex === index
                  ? "border-[var(--highlight)]/30 shadow-md"
                  : "border-[var(--foreground)]/5 shadow-sm hover:border-[var(--highlight)]/20"
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 text-left flex justify-between items-center hover:bg-[var(--background)]/50 transition-colors duration-200 focus:outline-none"
              >
                <h3 className="text-base font-semibold text-[var(--foreground)] pr-4 leading-snug">
                  {faq.question}
                </h3>
                <motion.div
                  initial={false}
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-[var(--highlight)]" aria-hidden="true" />
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <p className="text-[var(--foreground)]/70 leading-relaxed text-sm">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA + Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-14 text-center space-y-6"
        >
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-lg
                       bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-white
                       shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t("faq.buttons.startNow")}
          </a>

          <p className="text-[var(--foreground)]/50 text-sm">
            {t("faq.contact.message")}{" "}
            <a
              href="mailto:contact@buffex.io"
              className="inline-flex items-center gap-1 text-[var(--highlight)] hover:text-[var(--highlight-dark)] font-medium transition-colors"
            >
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              {t("faq.contact.linkText")}
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
