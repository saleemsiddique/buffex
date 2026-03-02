"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import Icon from "@mdi/react";
import FormTag from "./FormTag";
import ControlMacronutrientes from "./ControlMacronutrientes";
import type { MacroState } from "@/types/kitchen";
import type { UtensilDef } from "@/hooks/useRecipeForm";

type TabKey = "restrictions" | "cuisine" | "macros" | "utensils";

interface AdvancedOptionsPanelProps {
  // Restrictions
  dietaryRestrictions: string[];
  onDietaryChange: (option: string) => void;
  excludedIngredients: string[];
  currentExcluded: string;
  setCurrentExcluded: (v: string) => void;
  handleAddExcluded: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleRemoveExcluded: (label: string) => void;

  // Cuisine
  cuisineStyle: string | null;
  setCuisineStyle: (v: string | null) => void;

  // Macros
  macros: MacroState;
  handleMacrosChange: (state: MacroState) => void;

  // Utensils
  utensilsList: UtensilDef[];
  utensils: Record<string, boolean>;
  toggleUtensil: (key: string) => void;

  // Premium
  isSubscribed: boolean;
  onRequestUpgrade: () => void;
}

const CUISINE_STYLES = [
  { value: "japanese", labelKey: "Buffex.form.sections.cuisine.styles.japanese.label" },
  { value: "mexican", labelKey: "Buffex.form.sections.cuisine.styles.mexican.label" },
  { value: "italian", labelKey: "Buffex.form.sections.cuisine.styles.italian.label" },
  { value: "american", labelKey: "Buffex.form.sections.cuisine.styles.american.label" },
  { value: "spanish", labelKey: "Buffex.form.sections.cuisine.styles.spanish.label" },
  { value: "jamaican", labelKey: "Buffex.form.sections.cuisine.styles.jamaican.label" },
  { value: "indian", labelKey: "Buffex.form.sections.cuisine.styles.indian.label" },
];

const DIETARY_OPTIONS = [
  { value: "vegetarian", labelKey: "Buffex.form.sections.restrictions.options.vegetarian" },
  { value: "vegan", labelKey: "Buffex.form.sections.restrictions.options.vegan" },
  { value: "gluten-free", labelKey: "Buffex.form.sections.restrictions.options.glutenFree" },
  { value: "lactose-free", labelKey: "Buffex.form.sections.restrictions.options.lactoseFree" },
  { value: "keto", labelKey: "Buffex.form.sections.restrictions.options.keto" },
];

export default function AdvancedOptionsPanel({
  dietaryRestrictions,
  onDietaryChange,
  excludedIngredients,
  currentExcluded,
  setCurrentExcluded,
  handleAddExcluded,
  handleRemoveExcluded,
  cuisineStyle,
  setCuisineStyle,
  macros,
  handleMacrosChange,
  utensilsList,
  utensils,
  toggleUtensil,
  isSubscribed,
  onRequestUpgrade,
}: AdvancedOptionsPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>("restrictions");

  const tabs: { key: TabKey; label: string; premium: boolean }[] = [
    { key: "restrictions", label: t("Buffex.form.advancedTabs.restrictions"), premium: true },
    { key: "cuisine", label: t("Buffex.form.advancedTabs.cuisine"), premium: true },
    { key: "macros", label: t("Buffex.form.advancedTabs.macros"), premium: false },
    { key: "utensils", label: t("Buffex.form.advancedTabs.utensils"), premium: false },
  ];

  return (
    <section className="rounded-xl overflow-hidden" style={{ border: "1px solid #E5E5E3" }}>
      {/* Tabs */}
      <div className="flex border-b bg-[#FAFAF9]" style={{ borderColor: "#E5E5E3" }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-all duration-200 relative ${
              activeTab === tab.key
                ? "text-[#f97316]"
                : "text-[#6B7280] hover:text-[#111111]"
            }`}
          >
            <span className="flex items-center justify-center gap-1">
              {tab.label}
              {tab.premium && !isSubscribed && (
                <Lock className="w-3 h-3 text-[#f97316]" />
              )}
            </span>
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === "restrictions" && (
            <motion.div
              key="restrictions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-xs text-[var(--muted)] mb-3">
                {isSubscribed
                  ? t("Buffex.form.sections.restrictions.description")
                  : t("Buffex.form.sections.restrictions.premiumDescription")}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => isSubscribed && onDietaryChange(opt.value)}
                    disabled={!isSubscribed}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      !isSubscribed
                        ? "opacity-40 cursor-not-allowed border border-[#E5E5E3] bg-[#F5F5F4] text-[#6B7280]"
                        : dietaryRestrictions.includes(opt.value)
                          ? "bg-[#f97316] text-white shadow-sm"
                          : "border border-[#E5E5E3] text-[#111111] hover:bg-[#f97316]/8 hover:border-[#f97316]/30"
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>

              <div>
                <span className="text-xs font-semibold text-[var(--foreground)] mb-2 block">
                  {t("Buffex.form.sections.restrictions.avoidTitle")}
                </span>
                <input
                  type="text"
                  value={currentExcluded}
                  onChange={(e) => isSubscribed && setCurrentExcluded(e.target.value)}
                  onKeyDown={isSubscribed ? handleAddExcluded : undefined}
                  placeholder={
                    isSubscribed
                      ? t("Buffex.form.sections.restrictions.avoidPlaceholder")
                      : t("Buffex.form.sections.restrictions.premiumAvoid")
                  }
                  disabled={!isSubscribed}
                  className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors duration-200 focus:outline-none ${
                    !isSubscribed
                      ? "opacity-40 cursor-not-allowed border-[#E5E5E3] bg-[#F5F5F4]"
                      : "border-[#E5E5E3] focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316]"
                  }`}
                />
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto">
                  <AnimatePresence>
                    {excludedIngredients.map((ing) => (
                      <FormTag key={ing} label={ing} onRemove={handleRemoveExcluded} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "cuisine" && (
            <motion.div
              key="cuisine"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {!isSubscribed && (
                <p className="text-xs text-[var(--muted)] mb-3">
                  {t("Buffex.form.sections.cuisine.premiumDescription")}
                </p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {CUISINE_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => {
                      if (!isSubscribed) { onRequestUpgrade(); return; }
                      setCuisineStyle(cuisineStyle === style.value ? null : style.value);
                    }}
                    disabled={!isSubscribed}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-xs font-medium transition-all duration-200 ${
                      !isSubscribed
                        ? "opacity-40 cursor-not-allowed border-[#E5E5E3] bg-[#F5F5F4]"
                        : cuisineStyle === style.value
                          ? "border-[#f97316] bg-gradient-to-br from-[#f97316] to-[#ea580c] text-white shadow-sm"
                          : "border-[#E5E5E3] text-[#111111] hover:border-[#f97316]/40 hover:bg-[#f97316]/5"
                    }`}
                  >
                    <span className="leading-tight text-center">{t(style.labelKey)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "macros" && (
            <motion.div
              key="macros"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <ControlMacronutrientes
                initialMode={macros.mode}
                initialCalories={macros.calories}
                initialPercents={macros.percents}
                initialBasicGoal={macros.basicGoal as "gain_muscle" | "more_carbs" | "more_fats" | null}
                onChange={handleMacrosChange}
                isSubscribed={isSubscribed}
                onRequestUpgrade={onRequestUpgrade}
                className="!shadow-none !p-0"
              />
            </motion.div>
          )}

          {activeTab === "utensils" && (
            <motion.div
              key="utensils"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <p className="text-xs text-[var(--muted)] mb-3">
                {t("Buffex.form.sections.utensils.description")}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {utensilsList.map((u) => {
                  const active = utensils[u.key];
                  return (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => toggleUtensil(u.key)}
                      aria-pressed={active}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 border text-xs ${
                        active
                          ? "border-[#f97316] bg-[#f97316]/8 text-[#111111]"
                          : "opacity-40 border-[#E5E5E3] text-[#6B7280]"
                      }`}
                    >
                      <Icon path={u.icon} size={0.9} aria-hidden="true" />
                      <span className="text-center leading-tight text-[10px]">{u.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
