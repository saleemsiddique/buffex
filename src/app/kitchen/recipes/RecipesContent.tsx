"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoArrowBackCircleOutline,
  IoTimeOutline,
  IoPeopleOutline,
  IoRestaurantOutline,
  IoWarningOutline,
  IoListOutline,
  IoBarChartOutline,
} from "react-icons/io5";
import {
  GiChopsticks, GiSushis, GiTacos, GiHamburger, GiPizzaSlice,
  GiBowlOfRice, GiChefToque,
} from "react-icons/gi";
import { MdOutlineFastfood, MdOutlineNoFood } from "react-icons/md";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ChefHat, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { auth } from "@/lib/firebase";
import { compressDataUrlToJpeg } from "@/utils/image-compression";
import CookingMode from "@/components/CookingMode";
import FirstRecipeModal from "@/components/FirstRecipeModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type Ingredient = { nombre: string; cantidad: string; unidad: string };

type Recipe = {
  id?: string;
  titulo: string;
  descripcion: string;
  ingredientes: Ingredient[];
  instrucciones: { paso: number; texto: string }[];
  tiempo_total_min: number;
  porciones: number;
  estilo: string | null;
  restricciones: string[];
  excluidos: string[];
  img_url: string;
  macronutrientes?: {
    calorias: number | null;
    proteinas_g: number | null;
    carbohidratos_g: number | null;
    grasas_g: number | null;
  };
  dificultad: string;
};

type StreamPhase = "idle" | "connecting" | "streaming" | "saving" | "done" | "error";
type TabId = "ingredients" | "steps" | "macros";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findMatchingBracket(
  text: string, start: number, open: string, close: string
): number {
  if (start === -1 || text[start] !== open) return -1;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function parseStreamingRecipe(text: string): Partial<Recipe> {
  const result: Partial<Recipe> = {};

  const t = text.match(/"titulo"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (t) result.titulo = t[1].replace(/\\n/g, " ").replace(/\\"/g, '"');

  const d = text.match(/"descripcion"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (d) result.descripcion = d[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');

  // ingredientes: only when array closes
  const ingStart = text.indexOf('"ingredientes"');
  if (ingStart !== -1) {
    const arrStart = text.indexOf("[", ingStart);
    const arrEnd = findMatchingBracket(text, arrStart, "[", "]");
    if (arrEnd !== -1) {
      try { result.ingredientes = JSON.parse(text.slice(arrStart, arrEnd + 1)); } catch { /* partial */ }
    }
  }

  // instrucciones: extract individual closed step objects
  const stepMatches = [
    ...text.matchAll(/\{\s*"paso"\s*:\s*(\d+)\s*,\s*"texto"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g),
  ];
  if (stepMatches.length > 0) {
    result.instrucciones = stepMatches.map((m) => ({
      paso: parseInt(m[1]),
      texto: m[2].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
    }));
  }

  const tiempo = text.match(/"tiempo_total_min"\s*:\s*(\d+)/);
  if (tiempo) result.tiempo_total_min = parseInt(tiempo[1]);

  const porciones = text.match(/"porciones"\s*:\s*(\d+)/);
  if (porciones) result.porciones = parseInt(porciones[1]);

  return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

const RecipesContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, i18n } = useTranslation();

  const isGenerating = searchParams.get("generating") === "true";
  const recipeIdParam = searchParams.get("id");

  // ── Recipe state ──
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);

  // ── Streaming state ──
  const [streamPhase, setStreamPhase] = useState<StreamPhase>("idle");
  const [partialRecipe, setPartialRecipe] = useState<Partial<Recipe> | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [pendingFormData, setPendingFormData] = useState<Record<string, any> | null>(null);

  // ── Image generation state ──
  const [imageGenerating, setImageGenerating] = useState(false);
  const [imageDone, setImageDone] = useState(false);

  // ── UI state ──
  const [showCookingMode, setShowCookingMode] = useState(false);
  const [showFirstRecipeModal, setShowFirstRecipeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("ingredients");

  // Ref to skip API refetch for a recipe we just streamed
  const justStreamedIdRef = useRef<string | null>(null);
  // Ref to prevent StrictMode double-invocation of startStreaming
  const streamStartedRef = useRef(false);

  // ─── Background image generation ──────────────────────────────────────────

  const generateImageInBackground = async (
    recipeData: Recipe,
    recipeId: string,
    onDone: () => void
  ) => {
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) return;

      const idToken = await fbUser.getIdToken();
      const imageRes = await fetch("/api/recipe-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ recipe: recipeData }),
      });

      const imageData = await imageRes.json().catch(() => ({}));
      if (imageRes.ok && imageData?.img_url) {
        // maxBytes targets the BINARY size, but Firestore stores the base64 STRING
        // which is 4/3 larger. Firestore doc limit = 1MB total, so:
        //   700_000 binary → ~933_333 base64 chars → leaves ~115KB for recipe text ✓
        const compressed = await compressDataUrlToJpeg(imageData.img_url, {
          maxBytes: 700_000, maxWidth: 1024, maxHeight: 1024,
        });

        const updatedRecipe = { ...recipeData, img_url: compressed };
        const saveIdToken = await fbUser.getIdToken();
        const updateRes = await fetch(`/api/recipes/${recipeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipe: updatedRecipe, idToken: saveIdToken }),
        });

        if (updateRes.ok) {
          sessionStorage.setItem("generatedRecipe", JSON.stringify(updatedRecipe));
          setImageSrc(compressed);
          setRecipe(updatedRecipe);
        }
      }
    } catch (err) {
      console.error("Error generando imagen en segundo plano:", err);
    } finally {
      onDone();
    }
  };

  // ─── Save & finalize after stream ─────────────────────────────────────────

  const saveAndFinalize = async (
    accumulated: string,
    formData: Record<string, any>,
    idToken: string
  ) => {
    setStreamPhase("saving");

    const clean = accumulated
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let fullRecipe: Recipe;
    try {
      const parsed = JSON.parse(clean);
      fullRecipe = parsed.receta ?? parsed;
    } catch {
      setStreamError("El JSON generado no es válido. Por favor intenta de nuevo.");
      setStreamPhase("error");
      return;
    }

    sessionStorage.setItem("generatedRecipe", JSON.stringify(fullRecipe));

    try {
      const saveRes = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: fullRecipe, idToken }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${saveRes.status}`);
      }

      const { id: recipeId } = await saveRes.json();

      // Set recipe directly to avoid refetch flash; clear partial to avoid stale flicker
      justStreamedIdRef.current = recipeId;
      setPartialRecipe(null);
      setRecipe(fullRecipe);
      setStreamPhase("done");

      // Launch image generation
      setImageGenerating(true);
      generateImageInBackground(fullRecipe, recipeId, () => {
        setImageDone(true);
        setImageGenerating(false);
      });

      // Update URL
      router.replace(`/kitchen/recipes?id=${recipeId}`);

      // First recipe modal
      if (typeof window !== "undefined" && sessionStorage.getItem("isFirstRecipe")) {
        sessionStorage.removeItem("isFirstRecipe");
        setShowFirstRecipeModal(true);
      }
    } catch (err: any) {
      console.error("Error guardando receta:", err);
      setStreamError(err.message || "Error al guardar la receta.");
      setStreamPhase("error");
    }
  };

  // ─── Streaming start ──────────────────────────────────────────────────────

  const startStreaming = async (formData: Record<string, any>) => {
    setStreamPhase("connecting");
    setStreamError(null);
    setPartialRecipe(null);

    const fbUser = auth.currentUser;
    if (!fbUser) {
      setStreamError("No hay sesión activa. Por favor inicia sesión.");
      setStreamPhase("error");
      return;
    }

    let idToken: string;
    try {
      idToken = await fbUser.getIdToken();
    } catch {
      setStreamError("Error de autenticación.");
      setStreamPhase("error");
      return;
    }

    let response: Response;
    try {
      response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
          "Accept-Language": i18n.language || "es",
        },
        body: JSON.stringify(formData),
      });
    } catch {
      setStreamError("Error de conexión. Comprueba tu red e intenta de nuevo.");
      setStreamPhase("error");
      return;
    }

    if (!response.ok || !response.body) {
      setStreamError("Error al iniciar la generación.");
      setStreamPhase("error");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    let buffer = "";
    setStreamPhase("streaming");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event: any;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === "deducted") {
            window.dispatchEvent(new Event("token_update"));
          }

          if (event.type === "chunk") {
            accumulated += event.text;
            setPartialRecipe(parseStreamingRecipe(accumulated));
          }

          if (event.type === "error") {
            setStreamError(event.message || "Error durante la generación.");
            setStreamPhase("error");
            return;
          }

          if (event.type === "done") {
            await saveAndFinalize(accumulated, formData, idToken);
            return;
          }
        }
      }
    } catch (err: any) {
      console.error("Error leyendo stream:", err);
      setStreamError("Error leyendo la respuesta. Por favor intenta de nuevo.");
      setStreamPhase("error");
    }
  };

  // ─── Effects ──────────────────────────────────────────────────────────────

  // Start streaming when ?generating=true
  useEffect(() => {
    if (!isGenerating) return;
    // Guard against React StrictMode double-invocation: two concurrent streams
    // would alternate setPartialRecipe calls causing text to flicker between recipes
    if (streamStartedRef.current) return;
    streamStartedRef.current = true;

    const raw = typeof window !== "undefined"
      ? sessionStorage.getItem("pendingGenerationData")
      : null;

    if (!raw) {
      router.push("/kitchen");
      return;
    }

    let formData: Record<string, any>;
    try { formData = JSON.parse(raw); } catch {
      router.push("/kitchen");
      return;
    }

    setPendingFormData(formData);
    startStreaming(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGenerating]);

  // Fetch recipe by ID (or load from sessionStorage)
  useEffect(() => {
    if (isGenerating) return;

    if (recipeIdParam) {
      if (justStreamedIdRef.current === recipeIdParam) {
        justStreamedIdRef.current = null;
        return;
      }
      fetchRecipeById(recipeIdParam);
    } else {
      const stored =
        typeof window !== "undefined" ? sessionStorage.getItem("generatedRecipe") : null;
      if (stored) {
        const parsed: Recipe = JSON.parse(stored);
        setRecipe(parsed);
        if (parsed.img_url) setImageSrc(parsed.img_url);
      } else {
        router.push("/kitchen");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeIdParam, isGenerating]);

  // Poll sessionStorage for image — only updates imageSrc, never recipe state
  // (generateImageInBackground already calls setImageSrc+setRecipe when it succeeds;
  //  this is a safety fallback for cases where the component remounts mid-generation)
  useEffect(() => {
    if (!recipe || imageSrc) return;
    if (recipe.titulo?.startsWith("ERROR:")) return;

    let retryCount = 0;
    const maxRetries = 20;

    const interval = setInterval(() => {
      retryCount++;
      const stored =
        typeof window !== "undefined" ? sessionStorage.getItem("generatedRecipe") : null;
      if (stored) {
        try {
          const parsed: Recipe = JSON.parse(stored);
          if (parsed.img_url) {
            setImageSrc(parsed.img_url);
            clearInterval(interval);
            return;
          }
        } catch { /* ignore */ }
      }
      if (retryCount >= maxRetries) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.titulo, imageSrc]); // depend on titulo (stable ID) not the whole recipe object

  // ─── Fetch by ID ──────────────────────────────────────────────────────────

  const fetchRecipeById = async (id: string) => {
    setLoadingRecipe(true);
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) { router.push("/login"); return; }
      const idToken = await fbUser.getIdToken();

      const res = await fetch(`/api/recipes/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${idToken}`, "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Error al obtener la receta.");

      const data = await res.json();
      setRecipe(data.recipe);
      if (data.recipe.img_url) setImageSrc(data.recipe.img_url);
    } catch (err) {
      console.error("Error fetching recipe:", err);
      router.push("/kitchen/recipes/list");
    } finally {
      setLoadingRecipe(false);
    }
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleGoBack = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("generatedRecipe");
    if (recipeIdParam) router.push("/kitchen/recipes/list");
    else router.push("/kitchen");
  };

  const handleGenerateAnother = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem("generatedRecipe");
    if (recipeIdParam) router.push("/kitchen");
    else router.push("/kitchen?auto=1&regenerate=1");
  };

  const handleImageError = () => {
    if (imageSrc) {
      setImageKey((k) => k + 1);
      setImageSrc(`${imageSrc.split("?")[0]}?retry=${Date.now()}`);
    }
  };

  const handleRetryStream = () => {
    if (pendingFormData) startStreaming(pendingFormData);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const getDifficultyKey = (dificultad: string) => {
    const map: Record<string, string> = {
      Principiante: "beginner", Intermedio: "intermediate", Chef: "advanced",
      Beginner: "beginner", Intermediate: "intermediate",
    };
    return map[dificultad] || "beginner";
  };

  const getCuisineIcon = (style: string | null) => {
    const cls = "w-3.5 h-3.5 text-[var(--highlight)]";
    switch (style) {
      case "japanese": return <GiSushis className={cls} />;
      case "mexican": return <GiTacos className={cls} />;
      case "italian": return <GiPizzaSlice className={cls} />;
      case "american": return <GiHamburger className={cls} />;
      case "spanish": return <GiBowlOfRice className={cls} />;
      case "jamaican": return <GiChopsticks className={`${cls} rotate-45`} />;
      case "indian": return <MdOutlineFastfood className={cls} />;
      default: return <IoRestaurantOutline className={cls} />;
    }
  };

  const getRestrictionLabel = (r: string) => {
    const map: Record<string, string> = {
      vegetarian: "Vegetariano", vegan: "Vegano",
      "gluten-free": "Sin Gluten", "lactose-free": "Sin Lactosa", keto: "Keto",
    };
    return map[r] || r;
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200/80 rounded-lg ${className ?? ""}`} />
  );

  const DotsLoader = ({ text }: { text?: string }) => (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--highlight)]"
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 0.7, delay: i * 0.15, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      {text && <p className="text-sm font-medium text-[var(--foreground)]/60">{text}</p>}
    </div>
  );

  const Chip = ({
    icon,
    label,
    colorClass,
  }: {
    icon?: React.ReactNode;
    label: string;
    colorClass?: string;
  }) => (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
        colorClass ?? "bg-[var(--primary)]/8 text-[var(--foreground)]"
      }`}
    >
      {icon}
      {label}
    </span>
  );

  const DifficultyChip = ({ dificultad }: { dificultad: string }) => {
    const isEasy = dificultad === "Principiante" || dificultad === "Beginner";
    const isMedium = dificultad === "Intermedio" || dificultad === "Intermediate";
    const colorClass = isEasy
      ? "bg-green-100 text-green-700"
      : isMedium
      ? "bg-yellow-100 text-yellow-700"
      : "bg-purple-100 text-purple-700";
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}
      >
        <GiChefToque className="w-3.5 h-3.5" />
        {t(`recipeDetail.difficulty.levels.${getDifficultyKey(dificultad)}`)}
      </span>
    );
  };

  // ─── Early returns ─────────────────────────────────────────────────────────

  if (streamPhase === "error") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <IoWarningOutline className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
            Error al generar la receta
          </h2>
          <p className="text-[var(--foreground)]/70 mb-6 text-sm">{streamError}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleRetryStream}
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
            <button
              onClick={() => router.push("/kitchen")}
              className="w-full py-3 px-6 border-2 border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition"
            >
              Volver al formulario
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loadingRecipe || (!recipe && !partialRecipe && streamPhase === "idle")) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-4">
          <DotsLoader />
          <p className="text-sm text-[var(--foreground)]/60">{t("recipeDetail.loadingRecipe")}</p>
        </div>
      </div>
    );
  }

  // ─── Derived display state ────────────────────────────────────────────────

  const displayRecipe: Partial<Recipe> | null =
    streamPhase === "streaming" || streamPhase === "saving"
      ? partialRecipe
      : recipe;

  const isErrorRecipe = displayRecipe?.titulo?.startsWith("ERROR:") ?? false;
  const isStreaming = streamPhase === "streaming" || streamPhase === "saving";
  const isLoadingContent =
    streamPhase === "connecting" || (streamPhase === "streaming" && !partialRecipe?.titulo);

  const hasMacros = !!((recipe ?? partialRecipe) as Recipe | null)?.macronutrientes;
  const hasInstructions = (((recipe ?? partialRecipe)?.instrucciones?.length) ?? 0) > 0;

  const cookingInstructions = (recipe ?? partialRecipe)?.instrucciones ?? [];
  const cookingTitle = (recipe ?? partialRecipe)?.titulo ?? "";

  const tabs: TabId[] = ["ingredients", "steps", ...(hasMacros ? (["macros"] as TabId[]) : [])];

  // ─── Main layout ──────────────────────────────────────────────────────────

  return (
    <>
      {/* Page wrapper
          pt-20/pt-24 → clears fixed header (h-16=64px) + breathing room
          md:pr-16    → compensates sidebar w-24 (96px) vs main ml-20 (80px):
                        shifts centering point 32px left so card is visually
                        centered in the available space after the sidebar */}
      <div className="min-h-screen bg-[var(--background)] flex items-start justify-center px-4 pt-20 pb-6 md:pr-16 lg:pt-24 lg:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="w-full max-w-screen-xl bg-white rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col lg:h-[720px] lg:max-h-[calc(100vh-4rem)]"
          style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.06)" }}
        >
          {/* ── HEADER BAR ─────────────────────────────────────────────────── */}
          <div className="flex-none h-14 flex items-center justify-between px-4 border-b border-[#E5E5E3]">
            {/* Back button */}
            <button
              type="button"
              onClick={handleGoBack}
              className="flex items-center gap-1.5 text-sm font-semibold text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            >
              <IoArrowBackCircleOutline className="w-5 h-5 flex-none" />
              <span className="hidden sm:inline">
                {recipeIdParam
                  ? t("recipeDetail.backButton.toRecipes")
                  : t("recipeDetail.backButton.toForm")}
              </span>
            </button>

            {/* Truncated title — desktop only */}
            <p className="hidden lg:block text-sm font-medium text-[var(--foreground)]/40 truncate max-w-xs mx-4 flex-1">
              {displayRecipe?.titulo ?? ""}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {hasInstructions && (
                <button
                  type="button"
                  onClick={() => setShowCookingMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[var(--highlight)] text-white hover:bg-[var(--highlight-dark)] transition-colors"
                >
                  <ChefHat className="w-4 h-4 flex-none" />
                  <span className="hidden sm:inline">{t("cookingMode.buttonLabel")}</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleGenerateAnother}
                disabled={isStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-[#6B7280] hover:text-[#111111] hover:border-[#f97316]/40"
                style={{ border: "1px solid #E5E5E3" }}
              >
                <RefreshCw className="w-3.5 h-3.5 flex-none" />
                <span className="hidden sm:inline">
                  {recipeIdParam
                    ? t("recipeDetail.actions.goToKitchen")
                    : t("recipeDetail.actions.generateAnother")}
                </span>
              </button>
            </div>
          </div>

          {/* ── BODY ───────────────────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row">

            {/* LEFT PANEL — Image */}
            <div className="flex-none lg:w-2/5 relative overflow-hidden bg-gray-100">
              {/* Aspect ratio on mobile; absolute fill on desktop */}
              <div className="aspect-[4/3] lg:aspect-auto lg:absolute lg:inset-0 relative">
                {imageSrc ? (
                  <Image
                    key={imageKey}
                    src={imageSrc}
                    alt={displayRecipe?.titulo ?? "Receta"}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={handleImageError}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 animate-pulse" />
                )}

                {/* Image generation badges */}
                <AnimatePresence>
                  {imageGenerating && !imageDone && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-3 right-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium shadow-md"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                      Generando imagen...
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* RIGHT PANEL — Content */}
            <div className="flex-1 min-h-0 lg:overflow-y-auto flex flex-col gap-3 p-4 lg:p-6">

              {isLoadingContent ? (
                /* ── Skeleton loading state ── */
                <div className="flex flex-col gap-3">
                  <DotsLoader text="Preparando tu receta..." />
                  <Skeleton className="h-8 w-3/4 mt-1" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                  </div>
                  <div className="flex gap-1 pb-1 border-b border-gray-100">
                    <Skeleton className="h-9 flex-1 rounded-lg" />
                    <Skeleton className="h-9 flex-1 rounded-lg" />
                  </div>
                  <div className="space-y-2.5">
                    {[...Array(6)].map((_, i) => (
                      <Skeleton key={i} className="h-5 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Real content ── */
                <>
                  {/* Title */}
                  {isErrorRecipe ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <IoWarningOutline className="w-6 h-6 flex-none" />
                      <h1 className="text-xl font-bold font-[Fraunces]">{displayRecipe?.titulo}</h1>
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.h1
                        key={displayRecipe?.titulo ?? "title"}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] leading-tight font-[Fraunces]"
                      >
                        {displayRecipe?.titulo ?? ""}
                      </motion.h1>
                    </AnimatePresence>
                  )}

                  {/* Description */}
                  {displayRecipe?.descripcion && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="text-sm leading-relaxed text-[var(--foreground)]/70 italic line-clamp-3"
                    >
                      {displayRecipe.descripcion}
                    </motion.p>
                  )}

                  {/* Meta chips */}
                  {!isErrorRecipe && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {displayRecipe?.tiempo_total_min ? (
                        <Chip
                          icon={<IoTimeOutline className="w-3.5 h-3.5" />}
                          label={`${displayRecipe.tiempo_total_min} min`}
                          colorClass="bg-[var(--primary)]/8 text-[var(--foreground)]"
                        />
                      ) : isStreaming ? (
                        <Skeleton className="h-7 w-20 rounded-full" />
                      ) : null}

                      {displayRecipe?.porciones ? (
                        <Chip
                          icon={<IoPeopleOutline className="w-3.5 h-3.5" />}
                          label={`${displayRecipe.porciones} pax`}
                          colorClass="bg-[var(--highlight)]/8 text-[var(--foreground)]"
                        />
                      ) : isStreaming ? (
                        <Skeleton className="h-7 w-16 rounded-full" />
                      ) : null}

                      {(recipe ?? (partialRecipe as any))?.dificultad && (
                        <DifficultyChip dificultad={(recipe ?? (partialRecipe as any)).dificultad} />
                      )}

                      {(recipe as Recipe)?.estilo && (
                        <Chip
                          icon={getCuisineIcon((recipe as Recipe).estilo)}
                          label={(recipe as Recipe).estilo!}
                          colorClass="bg-[var(--highlight)]/8 text-[var(--foreground)] capitalize"
                        />
                      )}

                      {(recipe as Recipe)?.restricciones?.map((r, i) => (
                        <Chip
                          key={i}
                          label={getRestrictionLabel(r)}
                          colorClass="bg-[var(--highlight)]/8 text-[var(--foreground)]"
                        />
                      ))}
                    </div>
                  )}

                  {/* Excluded ingredients */}
                  {!isErrorRecipe && (recipe as Recipe)?.excluidos?.length > 0 && (
                    <div className="flex items-start gap-2 flex-wrap">
                      <MdOutlineNoFood className="w-4 h-4 text-red-400 flex-none mt-0.5" />
                      <div className="flex flex-wrap gap-1.5">
                        {(recipe as Recipe).excluidos.map((ex, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tabs — Ingredientes / Pasos / Macros */}
                  {!isErrorRecipe && (
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Tab bar */}
                      <div className="flex border-b border-[#E5E5E3] flex-none">
                        {tabs.map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 text-sm font-semibold relative transition-colors duration-200 ${
                              activeTab === tab
                                ? "text-[#f97316]"
                                : "text-[#6B7280] hover:text-[#111111]"
                            }`}
                          >
                            {tab === "ingredients" && (
                              <>
                                <IoListOutline className="inline mr-1" />
                                {t("recipeDetail.sections.ingredients.title")}
                                {displayRecipe?.ingredientes?.length
                                  ? ` (${displayRecipe.ingredientes.length})`
                                  : ""}
                              </>
                            )}
                            {tab === "steps" && (
                              <>
                                <GiChefToque className="inline mr-1" />
                                {t("recipeDetail.sections.instructions.title")}
                                {displayRecipe?.instrucciones?.length
                                  ? ` (${displayRecipe.instrucciones.length})`
                                  : ""}
                              </>
                            )}
                            {tab === "macros" && (
                              <>
                                <IoBarChartOutline className="inline mr-1" />
                                Macros
                              </>
                            )}
                            {activeTab === tab && (
                              <motion.div
                                layoutId="recipeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f97316]"
                              />
                            )}
                          </button>
                        ))}
                      </div>

                      {/* Tab content */}
                      <div className="flex-1 pt-3 pb-4">
                        <AnimatePresence mode="wait">
                          {activeTab === "ingredients" && (
                            <motion.div
                              key="ingredients"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.18 }}
                            >
                              {isStreaming && !displayRecipe?.ingredientes?.length ? (
                                <div className="space-y-2">
                                  {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="h-5 w-full" />
                                  ))}
                                </div>
                              ) : (
                                <ul className="space-y-1.5">
                                  {(displayRecipe?.ingredientes ?? []).map((ing, i) => (
                                    <motion.li
                                      key={i}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.2, delay: i * 0.03 }}
                                      className="flex items-start gap-2.5 text-sm text-[var(--foreground)] py-1.5 border-b border-[var(--foreground)]/8 last:border-0"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-none mt-1.5" />
                                      <span>
                                        <span className="font-medium">
                                          {ing.cantidad}
                                          {ing.cantidad && ing.unidad ? ` ${ing.unidad}` : ""}
                                        </span>
                                        {" "}
                                        {ing.nombre}
                                      </span>
                                    </motion.li>
                                  ))}
                                </ul>
                              )}
                            </motion.div>
                          )}

                          {activeTab === "steps" && (
                            <motion.div
                              key="steps"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.18 }}
                            >
                              {isStreaming && !displayRecipe?.instrucciones?.length ? (
                                <div className="space-y-3">
                                  {[...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-14 w-full" />
                                  ))}
                                </div>
                              ) : (
                                <ol className="space-y-3">
                                  {(displayRecipe?.instrucciones ?? []).map((step, i) => (
                                    <motion.li
                                      key={i}
                                      initial={{ opacity: 0, x: 8 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.2, delay: i * 0.04 }}
                                      className="flex gap-3 text-sm text-[var(--foreground)] leading-relaxed"
                                    >
                                      <span className="flex-none w-6 h-6 rounded-full bg-[var(--primary)]/12 text-[var(--primary)] text-xs font-bold flex items-center justify-center mt-0.5">
                                        {step.paso}
                                      </span>
                                      <span className="flex-1">{step.texto}</span>
                                    </motion.li>
                                  ))}
                                </ol>
                              )}
                            </motion.div>
                          )}

                          {activeTab === "macros" && hasMacros && (
                            <motion.div
                              key="macros"
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              transition={{ duration: 0.18 }}
                              className="grid grid-cols-2 gap-3"
                            >
                              {[
                                {
                                  label: t("recipeDetail.macronutrients.calories"),
                                  value: (recipe as Recipe).macronutrientes!.calorias,
                                  unit: "kcal",
                                },
                                {
                                  label: t("recipeDetail.macronutrients.protein"),
                                  value: (recipe as Recipe).macronutrientes!.proteinas_g,
                                  unit: "g",
                                },
                                {
                                  label: t("recipeDetail.macronutrients.carbs"),
                                  value: (recipe as Recipe).macronutrientes!.carbohidratos_g,
                                  unit: "g",
                                },
                                {
                                  label: t("recipeDetail.macronutrients.fats"),
                                  value: (recipe as Recipe).macronutrientes!.grasas_g,
                                  unit: "g",
                                },
                              ].map(({ label, value, unit }) => (
                                <div
                                  key={label}
                                  className="bg-[var(--primary)]/6 rounded-xl p-3"
                                >
                                  <p className="text-xs text-[var(--foreground)]/60 mb-1">{label}</p>
                                  <p className="text-lg font-bold text-[var(--primary)]">
                                    {value ?? "—"}{" "}
                                    <span className="text-sm font-normal text-[var(--foreground)]/60">
                                      {unit}
                                    </span>
                                  </p>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Cooking Mode overlay */}
      <AnimatePresence>
        {showCookingMode && cookingInstructions.length > 0 && (
          <CookingMode
            instructions={cookingInstructions}
            title={cookingTitle}
            onClose={() => setShowCookingMode(false)}
          />
        )}
      </AnimatePresence>

      {/* First Recipe Modal */}
      {showFirstRecipeModal && (
        <FirstRecipeModal
          onClose={() => setShowFirstRecipeModal(false)}
          onGetMore={() => {
            setShowFirstRecipeModal(false);
            router.push("/kitchen/pricing");
          }}
        />
      )}
    </>
  );
};

export default RecipesContent;
