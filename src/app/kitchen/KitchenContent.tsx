"use client";

import React from "react";
import { motion } from "framer-motion";
import Head from "next/head";
import { useTranslation } from "react-i18next";
import { CustomUser, useUser } from "@/context/user-context";

import { useRecipeForm } from "@/hooks/useRecipeForm";
import Onboarding from "@/components/onboarding";
import { TokensModal } from "@/components/SideMenu/TokensModal";
import FirstRecipeModal from "@/components/FirstRecipeModal";

import IngredientSection from "@/components/kitchenForm/IngredientSection";
import MealTimeSelector from "@/components/kitchenForm/MealTimeSelector";
import QuickOptions from "@/components/kitchenForm/QuickOptions";
import AdvancedOptionsPanel from "@/components/kitchenForm/AdvancedOptionsPanel";
import GenerateButton from "@/components/kitchenForm/GenerateButton";
import LoadingOverlay from "@/components/kitchenForm/LoadingOverlay";

const BuffexForm: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useUser();
  const form = useRecipeForm();

  const hasRecipes = form.user
    ? ((form.user.monthly_recipes || 0) + (form.user.extra_recipes || 0)) >= 1
    : false;

  return (
    <div className="min-h-screen bg-[var(--background)] pt-20 pb-6 lg:pt-20 lg:pb-4 flex items-start justify-center font-sans">
      {form.showOnboarding && <Onboarding onClose={form.handleFinishOnboarding} />}

      <Head>
        <title>{t("Buffex.form.title")}</title>
        <meta name="description" content={t("Buffex.form.description")} />
      </Head>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-6xl mx-auto px-3 sm:px-4 lg:px-6"
      >
        {/* Wide card */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)" }}>
          <form ref={form.formRef} onSubmit={form.handleSubmit}>

            {/* Desktop: 2-column layout / Mobile: single column */}
            <div className="lg:grid lg:grid-cols-2 lg:divide-x lg:divide-[#E5E5E3]">

              {/* LEFT COLUMN: Ingredients + Meal time + Quick options */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* 1. Ingredients — the protagonist */}
                <IngredientSection
                  ingredients={form.ingredients}
                  currentIngredient={form.currentIngredient}
                  ingredientError={form.ingredientError}
                  showSuggestions={form.showSuggestions}
                  setShowSuggestions={form.setShowSuggestions}
                  ingredientHistory={form.ingredientHistory}
                  getSuggestions={form.getSuggestions}
                  handleAddIngredient={form.handleAddIngredient}
                  handleRemoveIngredient={form.handleRemoveIngredient}
                  handleSelectSuggestion={form.handleSelectSuggestion}
                  handleInputChange={form.handleInputChange}
                />

                <div className="border-t border-[#E5E5E3]" />

                {/* 2. Meal time — 4 horizontal buttons */}
                <MealTimeSelector
                  mealTime={form.mealTime}
                  mealTimeError={form.mealTimeError}
                  onSelect={form.handleSetMealTime}
                />

                <div className="border-t border-[#E5E5E3]" />

                {/* 3. Quick options: Time + Difficulty + Diners */}
                <QuickOptions
                  availableTime={form.availableTime}
                  setAvailableTime={form.setAvailableTime}
                  difficulty={form.difficulty}
                  setDifficulty={form.setDifficulty}
                  diners={form.diners}
                  setDiners={form.setDiners}
                  isSubscribed={!!user?.isSubscribed}
                  onRequestUpgrade={() => form.setShowTokens(true)}
                />
              </div>

              {/* RIGHT COLUMN: Advanced options + Generate button */}
              <div className="p-5 sm:p-6 flex flex-col">
                {/* Mobile divider (hidden on lg) */}
                <div className="border-t border-[var(--primary)]/10 mb-5 lg:hidden" />

                {/* 4. Advanced options tabs */}
                <div className="flex-1">
                  <AdvancedOptionsPanel
                    dietaryRestrictions={form.dietaryRestrictions}
                    onDietaryChange={form.handleDietaryChange}
                    excludedIngredients={form.excludedIngredients}
                    currentExcluded={form.currentExcluded}
                    setCurrentExcluded={form.setCurrentExcluded}
                    handleAddExcluded={form.handleAddExcluded}
                    handleRemoveExcluded={form.handleRemoveExcluded}
                    cuisineStyle={form.cuisineStyle}
                    setCuisineStyle={form.setCuisineStyle}
                    macros={form.macros}
                    handleMacrosChange={form.handleMacrosChange}
                    utensilsList={form.utensilsList}
                    utensils={form.utensils}
                    toggleUtensil={form.toggleUtensil}
                    isSubscribed={!!user?.isSubscribed}
                    onRequestUpgrade={() => form.setShowTokens(true)}
                  />
                </div>

                {/* 5. Generate button — pushed to bottom */}
                <div className="mt-5">
                  <GenerateButton
                    status={form.status}
                    loadingUser={form.loadingUser}
                    hasRecipes={hasRecipes}
                    tokenCost={form.calculateTokenCost()}
                    onGetMoreRecipes={() => form.setShowTokens(true)}
                  />

                  {form.status === "error" && form.error && (
                    <p className="text-red-500 text-sm text-center mt-2">{form.error}</p>
                  )}
                </div>
              </div>

            </div>
          </form>
        </div>
      </motion.div>

      {/* Toast */}
      {form.toastMessage && (
        <div className="fixed bottom-4 right-4 bg-[var(--highlight)] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm z-40 max-w-sm">
          {form.toastMessage}
        </div>
      )}

      {/* Loading overlay */}
      <LoadingOverlay visible={form.isLoadingOverlayVisible} />

      {/* Tokens modal */}
      {form.showTokens && (
        <TokensModal
          user={user as CustomUser | null}
          onClose={() => form.setShowTokens(false)}
        />
      )}

      {/* First recipe modal */}
      {form.showFirstRecipeModal && (
        <FirstRecipeModal
          onClose={form.handleCloseFirstRecipeModal}
          onGetMore={() => { form.handleCloseFirstRecipeModal(); form.setShowTokens(true); }}
        />
      )}
    </div>
  );
};

export default BuffexForm;
