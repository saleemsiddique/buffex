"use client";

import React from "react";
import { Clock, Star, Zap, ChefHat, Users, Minus, Plus, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Difficulty } from "@/types/kitchen";

const TIME_OPTIONS = ["15", "30", "45", "60", "90", "120", "no_limit"];

interface QuickOptionsProps {
  availableTime: string;
  setAvailableTime: (v: string) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  diners: number;
  setDiners: (v: number) => void;
  isSubscribed: boolean;
  onRequestUpgrade?: () => void;
}

export default function QuickOptions({
  availableTime,
  setAvailableTime,
  difficulty,
  setDifficulty,
  diners,
  setDiners,
  isSubscribed,
  onRequestUpgrade,
}: QuickOptionsProps) {
  const { t } = useTranslation();
  const MAX_DINERS = 8;

  const difficultyOptions: { value: Difficulty; labelKey: string; Icon: typeof Star }[] = [
    { value: "Principiante", labelKey: "culinarium.form.sections.difficulty.levels.beginner", Icon: Star },
    { value: "Intermedio", labelKey: "culinarium.form.sections.difficulty.levels.intermediate", Icon: Zap },
    { value: "Chef", labelKey: "culinarium.form.sections.difficulty.levels.chef", Icon: ChefHat },
  ];

  const getTimeLabel = (val: string) => {
    if (val === "no_limit") return t("culinarium.form.sections.time.noLimit");
    return t(`culinarium.form.sections.time.options.${val}`);
  };

  return (
    <div className="space-y-5">
      {/* Time chips */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-[var(--muted)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">
            {t("culinarium.form.sections.time.title")}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIME_OPTIONS.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAvailableTime(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                availableTime === val
                  ? "bg-[#f97316] text-white shadow-sm"
                  : "bg-[#F5F5F4] text-[#6B7280] hover:bg-[#f97316]/8 border border-[#E5E5E3]"
              }`}
            >
              {val === "no_limit" ? getTimeLabel(val) : `${val} min`}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty + Diners in one row */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Difficulty chips */}
        <div className="flex-1">
          <span className="text-sm font-semibold text-[var(--foreground)] mb-2 block">
            {t("culinarium.form.sections.difficulty.title")}
          </span>
          <div className="flex gap-1.5">
            {difficultyOptions.map(({ value, labelKey, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDifficulty(value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  difficulty === value
                    ? "bg-[#f97316] text-white shadow-sm"
                    : "bg-[#F5F5F4] text-[#6B7280] hover:bg-[#f97316]/8 border border-[#E5E5E3]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t(labelKey)}</span>
                <span className="sm:hidden">{t(labelKey).substring(0, 4)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Diners inline */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">
              {t("culinarium.form.sections.diners.title")}
            </span>
            {!isSubscribed && (
              <Lock className="w-3.5 h-3.5 text-[var(--highlight)]" />
            )}
          </div>
          <div className={`flex items-center gap-2 ${!isSubscribed ? "opacity-50" : ""}`}>
            <Users className="w-4 h-4 text-[var(--muted)]" />
            <button
              type="button"
              onClick={() => isSubscribed && setDiners(Math.max(1, diners - 1))}
              disabled={!isSubscribed || diners <= 1}
              className="p-1.5 rounded-lg border border-[#E5E5E3] hover:bg-[#f97316]/8 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Decrease diners"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-lg font-bold w-8 text-center text-[var(--foreground)]">{diners}</span>
            <button
              type="button"
              onClick={() => {
                if (!isSubscribed) { onRequestUpgrade?.(); return; }
                setDiners(Math.min(MAX_DINERS, diners + 1));
              }}
              disabled={!isSubscribed || diners >= MAX_DINERS}
              className="p-1.5 rounded-lg border border-[#E5E5E3] hover:bg-[#f97316]/8 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
              aria-label="Increase diners"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
