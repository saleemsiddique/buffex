"use client";

import React from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import FormTag from "./FormTag";

interface IngredientSectionProps {
  ingredients: string[];
  currentIngredient: string;
  ingredientError: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (v: boolean) => void;
  ingredientHistory: string[];
  getSuggestions: (query: string, current?: string[]) => string[];
  handleAddIngredient: (e?: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => void;
  handleRemoveIngredient: (label: string) => void;
  handleSelectSuggestion: (suggestion: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function IngredientSection({
  ingredients,
  currentIngredient,
  ingredientError,
  showSuggestions,
  setShowSuggestions,
  ingredientHistory,
  getSuggestions,
  handleAddIngredient,
  handleRemoveIngredient,
  handleSelectSuggestion,
  handleInputChange,
}: IngredientSectionProps) {
  const { t } = useTranslation();

  return (
    <section>
      <h2 className="text-lg font-bold text-[var(--foreground)] mb-3">
        {t("culinarium.form.sections.ingredients.title")}
      </h2>

      {/* Input with inline add button */}
      <div className="relative">
        <input
          type="text"
          value={currentIngredient}
          onChange={handleInputChange}
          onKeyDown={handleAddIngredient}
          onFocus={() => setShowSuggestions(currentIngredient.length >= 2)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={t("culinarium.form.sections.ingredients.placeholder")}
          className={`w-full px-4 py-3 pr-12 border-2 rounded-xl text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 ${
            ingredientError
              ? "border-red-400 bg-red-50/50"
              : "border-[#E5E5E3] focus:border-[#f97316]"
          }`}
          aria-label={t("culinarium.form.sections.ingredients.title")}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleAddIngredient}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[var(--highlight)] hover:bg-[var(--highlight)]/10 rounded-lg transition-colors"
          aria-label={t("culinarium.form.sections.ingredients.addButton")}
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Autocomplete dropdown */}
        {showSuggestions && getSuggestions(currentIngredient, ingredients).length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white rounded-xl max-h-48 overflow-y-auto custom-scrollbar" style={{ border: "1px solid #E5E5E3", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
            {getSuggestions(currentIngredient, ingredients).map((suggestion, index) => (
              <button
                key={`${suggestion}-${index}`}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full text-left px-4 py-2.5 hover:bg-[#f97316]/8 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl text-sm text-[#111111]"
              >
                {t(suggestion)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {ingredientError && (
        <p className="text-red-500 text-sm mt-2 flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          {t("culinarium.form.sections.ingredients.error")}
        </p>
      )}

      {/* Quick suggestions */}
      {currentIngredient === "" && (
        <div className="mt-3">
          <p className="text-xs text-[var(--muted)] mb-2">
            {t("culinarium.form.sections.ingredients.suggestions")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ingredientHistory
              .filter((ing) => {
                const keyLower = ing.toLowerCase();
                const translatedLower = t(ing).toLowerCase();
                return !ingredients.some(
                  (added) =>
                    added.toLowerCase() === keyLower ||
                    added.toLowerCase() === translatedLower
                );
              })
              .slice(0, 6)
              .map((ingredient) => (
                <button
                  key={ingredient}
                  onClick={() => handleSelectSuggestion(ingredient)}
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#f97316]/5 text-[#f97316] text-xs rounded-full hover:bg-[#f97316]/12 transition-colors duration-150 border border-[#f97316]/20"
                >
                  <Plus className="w-3 h-3" />
                  {t(ingredient)}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Tags area */}
      <div className="mt-3 flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {ingredients.map((ing) => (
            <FormTag
              key={ing}
              label={t(ing)}
              onRemove={() => handleRemoveIngredient(ing)}
            />
          ))}
        </AnimatePresence>
      </div>

      {ingredients.length === 0 && !ingredientError && (
        <p className="text-[var(--muted)] text-xs mt-2">
          {t("culinarium.form.sections.ingredients.empty")}
        </p>
      )}
    </section>
  );
}
