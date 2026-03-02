import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Minus, Plus, TrendingUp, Zap, Apple, Dumbbell, Wheat, Droplets, type LucideProps } from "lucide-react";

type MacroPercents = { protein: number; carbs: number; fats: number };
type Mode = "basic" | "pro";
type BasicGoal = "gain_muscle" | "more_carbs" | "more_fats";

interface Props {
  initialMode?: Mode;
  initialCalories?: number;
  initialPercents?: MacroPercents;
  initialBasicGoal?: BasicGoal | null;
  onChange?: (state: {
    mode: Mode;
    basicGoal: BasicGoal | null;
    calories: number;
    percents: MacroPercents;
  }) => void;
  className?: string;
  isSubscribed?: boolean;
  onRequestUpgrade?: () => void;
}

const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, Math.round(v)));

const calcGrams = (kcal: number, percent: number, kcalPerGram: number) =>
  Math.round(((percent / 100) * kcal) / kcalPerGram);

const LIMITS = {
  kcal: { min: 100, max: 2000 },
  protein: { min: 10, max: 60 },
  carbs: { min: 20, max: 70 },
  fats: { min: 10, max: 40 },
} as const;

const BASIC_PRESETS: Record<BasicGoal, { calories: number; percents: MacroPercents }> = {
  gain_muscle: { calories: 700, percents: { protein: 40, carbs: 40, fats: 20 } },
  more_carbs:  { calories: 600, percents: { protein: 25, carbs: 60, fats: 15 } },
  more_fats:   { calories: 650, percents: { protein: 25, carbs: 35, fats: 40 } },
};

const MACRO_COLORS = {
  protein: "#60a5fa", // blue-400
  carbs:   "#fbbf24", // amber-400
  fats:    "#f97316", // orange-500
};

// ── Macro distribution bar ───────────────────────────────────────────────────
const MacroBar = ({ percents }: { percents: MacroPercents }) => (
  <div className="space-y-1.5">
    <div className="flex h-2 rounded-full overflow-hidden gap-px">
      <motion.div
        className="h-full rounded-l-full"
        style={{ backgroundColor: MACRO_COLORS.protein }}
        animate={{ width: `${percents.protein}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      <motion.div
        className="h-full"
        style={{ backgroundColor: MACRO_COLORS.carbs }}
        animate={{ width: `${percents.carbs}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      <motion.div
        className="h-full rounded-r-full"
        style={{ backgroundColor: MACRO_COLORS.fats }}
        animate={{ width: `${percents.fats}%` }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
    </div>
    <div className="flex justify-between text-[10px] text-[var(--muted)]">
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: MACRO_COLORS.protein }} />
        P {percents.protein}%
      </span>
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: MACRO_COLORS.carbs }} />
        C {percents.carbs}%
      </span>
      <span className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: MACRO_COLORS.fats }} />
        G {percents.fats}%
      </span>
    </div>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function ControlMacronutrientes({
  initialMode = "basic",
  initialCalories = 500,
  initialPercents = { protein: 30, carbs: 50, fats: 20 },
  initialBasicGoal = null,
  onChange,
  className = "",
  isSubscribed = false,
  onRequestUpgrade,
}: Props) {
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [basicGoal, setBasicGoal] = useState<BasicGoal | null>(initialBasicGoal ?? null);
  const [calories, setCalories] = useState<number>(
    clamp(initialCalories, LIMITS.kcal.min, LIMITS.kcal.max)
  );
  const [percents, setPercents] = useState<MacroPercents>({
    protein: clamp(initialPercents.protein, LIMITS.protein.min, LIMITS.protein.max),
    carbs:   clamp(initialPercents.carbs,   LIMITS.carbs.min,   LIMITS.carbs.max),
    fats:    clamp(initialPercents.fats,    LIMITS.fats.min,    LIMITS.fats.max),
  });

  // Notify parent
  useEffect(() => {
    if (mode === "basic") {
      if (basicGoal && BASIC_PRESETS[basicGoal]) {
        const preset = BASIC_PRESETS[basicGoal];
        onChange?.({ mode, basicGoal, calories: preset.calories, percents: preset.percents });
      } else {
        onChange?.({ mode, basicGoal: null, calories: 0, percents: { protein: 0, carbs: 0, fats: 0 } });
      }
    } else {
      if (!isSubscribed) {
        onChange?.({ mode, basicGoal, calories: 0, percents: { protein: 0, carbs: 0, fats: 0 } });
      } else {
        onChange?.({ mode, basicGoal, calories, percents });
      }
    }
  }, [mode, basicGoal, calories, percents, onChange, isSubscribed]);

  // Proportional redistribution when a slider changes
  const setMacroSafe = (changed: keyof MacroPercents, valueRaw: number) => {
    setPercents((prev) => {
      const v = clamp(valueRaw, LIMITS[changed].min, LIMITS[changed].max);
      const remaining = 100 - v;
      const keys = ["protein", "carbs", "fats"] as (keyof MacroPercents)[];
      const others = keys.filter((k) => k !== changed);
      const prevA = prev[others[0]];
      const prevB = prev[others[1]];
      const curOthersSum = prevA + prevB || 1;

      let first  = Math.round((prevA / curOthersSum) * remaining);
      let second = remaining - first;
      first  = clamp(first,  LIMITS[others[0]].min, LIMITS[others[0]].max);
      second = clamp(second, LIMITS[others[1]].min, LIMITS[others[1]].max);

      const sum = v + first + second;
      if (sum !== 100) {
        let diff = 100 - sum;
        const canIncSecond = LIMITS[others[1]].max - second;
        const canDecSecond = second - LIMITS[others[1]].min;
        if (diff > 0) {
          const inc = Math.min(canIncSecond, diff); second += inc; diff -= inc;
          const incF = Math.min(LIMITS[others[0]].max - first, diff); first += incF;
        } else if (diff < 0) {
          let need = -diff;
          const dec = Math.min(canDecSecond, need); second -= dec; need -= dec;
          const decF = Math.min(first - LIMITS[others[0]].min, need); first -= decF; need -= decF;
          if (need > 0) {
            const newV = clamp(v - need, LIMITS[changed].min, LIMITS[changed].max);
            const rem = 100 - newV;
            const totalPrev = first + second || 1;
            first  = clamp(Math.round((first / totalPrev) * rem), LIMITS[others[0]].min, LIMITS[others[0]].max);
            second = rem - first;
            return { ...prev, [changed]: newV, [others[0]]: first, [others[1]]: second } as MacroPercents;
          }
        }
      }
      return { ...prev, [changed]: v, [others[0]]: first, [others[1]]: second } as MacroPercents;
    });
  };

  const proBlocked = mode === "pro" && !isSubscribed;

  const UpgradeOverlay: React.FC<{ label?: string }> = ({ label }) => (
    <button
      type="button"
      onClick={() => onRequestUpgrade?.()}
      className="absolute inset-0 bg-transparent"
      aria-label={label ? t("macronutrients.premium.upgradePrompt", { label }) : t("macronutrients.premium.upgradeGeneric")}
    />
  );

  const PRESETS_META: { key: BasicGoal; Icon: React.FC<LucideProps> }[] = [
    { key: "gain_muscle", Icon: TrendingUp },
    { key: "more_carbs",  Icon: Zap },
    { key: "more_fats",   Icon: Apple },
  ];

  const PRO_SLIDERS: { key: keyof MacroPercents; labelKey: string; kcalPerG: number; Icon: React.FC<LucideProps> }[] = [
    { key: "protein", labelKey: "macronutrients.pro.protein", kcalPerG: 4, Icon: Dumbbell },
    { key: "carbs",   labelKey: "macronutrients.pro.carbs",   kcalPerG: 4, Icon: Wheat    },
    { key: "fats",    labelKey: "macronutrients.pro.fats",    kcalPerG: 9, Icon: Droplets },
  ];

  return (
    <div className={className}>

      {/* ── Segmented mode toggle ───────────────────────────────────────────── */}
      <div className="flex bg-[var(--primary)]/8 rounded-full p-0.5 mb-4">
        {(["basic", "pro"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 ${
              mode === m
                ? "bg-white shadow-sm text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {m === "basic" ? t("macronutrients.modes.basic") : "Pro"}
            {m === "pro" && !isSubscribed && (
              <span className="text-[9px] px-1.5 py-0.5 font-bold bg-gradient-to-r from-orange-500 to-yellow-400 text-white rounded-full leading-none">
                PRO
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ── BASIC mode ──────────────────────────────────────────────────── */}
        {mode === "basic" && (
          <motion.div
            key="basic"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {/* Preset cards */}
            <div className="grid grid-cols-3 gap-2">
              {PRESETS_META.map(({ key, Icon }) => {
                const active = basicGoal === key;
                const preset = BASIC_PRESETS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBasicGoal((prev) => (prev === key ? null : key))}
                    className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 ${
                      active
                        ? "border-[var(--highlight)] bg-[var(--highlight)]/8 shadow-sm"
                        : "border-[var(--primary)]/15 hover:border-[var(--highlight)]/40 hover:bg-[var(--highlight)]/4"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-[var(--highlight)]" />
                    <span className="text-[11px] font-semibold text-center leading-tight text-[var(--foreground)]">
                      {t(`macronutrients.basic.presets.${key}.label`)}
                    </span>
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="text-[9px] text-[var(--highlight)] font-semibold tabular-nums"
                        >
                          {preset.percents.protein}P·{preset.percents.carbs}C·{preset.percents.fats}G
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>

            {/* Macro bar — only when a goal is active */}
            <AnimatePresence>
              {basicGoal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <MacroBar percents={BASIC_PRESETS[basicGoal].percents} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Free-mode note */}
            {!basicGoal && (
              <p className="text-[10px] text-[var(--muted)] text-center py-0.5">
                {t("macronutrients.basic.freeMode")}
              </p>
            )}
          </motion.div>
        )}

        {/* ── PRO mode ────────────────────────────────────────────────────── */}
        {mode === "pro" && (
          <motion.div
            key="pro"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {/* Calorie stepper */}
            <div className={`relative flex items-center justify-center gap-4 py-1 ${proBlocked ? "opacity-50" : ""}`}>
              <button
                type="button"
                disabled={proBlocked}
                onClick={() => setCalories((c) => clamp(c - 50, LIMITS.kcal.min, LIMITS.kcal.max))}
                className="w-8 h-8 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 flex items-center justify-center text-[var(--foreground)] transition-colors disabled:pointer-events-none"
                aria-label="−50 kcal"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <div className="text-center w-24">
                <motion.div
                  key={calories}
                  initial={{ opacity: 0.6, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-2xl font-bold text-[var(--foreground)] tabular-nums"
                >
                  {calories}
                </motion.div>
                <div className="text-[10px] text-[var(--muted)] uppercase tracking-widest font-medium">kcal</div>
              </div>

              <button
                type="button"
                disabled={proBlocked}
                onClick={() => setCalories((c) => clamp(c + 50, LIMITS.kcal.min, LIMITS.kcal.max))}
                className="w-8 h-8 rounded-full bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 flex items-center justify-center text-[var(--foreground)] transition-colors disabled:pointer-events-none"
                aria-label="+50 kcal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {proBlocked && <UpgradeOverlay />}
            </div>

            {/* Macro sliders */}
            <div className="space-y-3.5">
              {PRO_SLIDERS.map(({ key, labelKey, kcalPerG, Icon }) => (
                <div key={key} className="relative">
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 flex-none" style={{ color: MACRO_COLORS[key] }} />
                      {t(labelKey)}
                    </span>
                    <span className="text-xs tabular-nums">
                      <span className="font-semibold text-[var(--foreground)]">{percents[key]}%</span>
                      <span className="text-[var(--muted)] ml-1">· {calcGrams(calories, percents[key], kcalPerG)} g</span>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      min={LIMITS[key].min}
                      max={LIMITS[key].max}
                      value={percents[key]}
                      onChange={(e) => {
                        if (proBlocked) { onRequestUpgrade?.(); return; }
                        setMacroSafe(key, Number(e.target.value));
                      }}
                      disabled={proBlocked}
                      style={{ accentColor: MACRO_COLORS[key] }}
                      className="w-full h-1.5 rounded-full appearance-none bg-[var(--primary)]/10 cursor-pointer disabled:cursor-not-allowed"
                    />
                    {proBlocked && <UpgradeOverlay label={t(labelKey)} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Macro bar */}
            <MacroBar percents={percents} />

            {/* Total */}
            <div className="flex justify-between text-[10px] text-[var(--muted)]">
              <span>
                {t("macronutrients.pro.total")}:{" "}
                <span
                  className={`font-semibold ${
                    percents.protein + percents.carbs + percents.fats === 100
                      ? "text-green-500"
                      : "text-amber-500"
                  }`}
                >
                  {percents.protein + percents.carbs + percents.fats}%
                </span>
              </span>
              <span>{t("macronutrients.pro.approximate")}</span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
