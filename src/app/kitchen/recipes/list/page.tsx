/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import NextLink from 'next/link';
import { useUser } from '@/context/user-context';
import { auth } from '@/lib/firebase';
import { IoFunnel, IoClose, IoSearch, IoRestaurantOutline } from 'react-icons/io5';
import { useTranslation } from "react-i18next";

// Define the Recipe type based on your provided structure
type Recipe = {
  id: string;
  titulo: string;
  descripcion: string;
  ingredientes: { nombre: string; cantidad: string; unidad: string | null }[];
  instrucciones: { paso: number; texto: string }[];
  tiempo_total_min: number;
  porciones: number;
  estilo: string | null;
  restricciones: string[];
  excluidos: string[];
  momento_del_dia: string | null;
  img_url: string;
  user_id: string;
};

type Filters = {
  searchTerm: string;
  mealTime: string;
  timeRange: string;
  portions: string;
  style: string;
  restrictions: string[];
};

const RecipeListPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { user, loading: userLoading } = useUser();
  const { t } = useTranslation();

  const [filters, setFilters] = useState<Filters>({
    searchTerm: '',
    mealTime: '',
    timeRange: '',
    portions: '',
    style: '',
    restrictions: []
  });

  // Define mealTimes directly within this component
  const mealTimes = [
    { label: t("recipes.filters.mealTimeOptions.breakfast"), value: 'breakfast' },
    { label: t("recipes.filters.mealTimeOptions.lunch"), value: 'lunch' },
    { label: t("recipes.filters.mealTimeOptions.dinner"), value: 'dinner' },
    { label: t("recipes.filters.mealTimeOptions.snack"), value: 'snack' },
  ];

  const timeRanges = [
    { label: t("recipes.filters.timeRangeOptions.0-15"), value: '0-15' },
    { label: t("recipes.filters.timeRangeOptions.15-30"), value: '15-30' },
    { label: t("recipes.filters.timeRangeOptions.30-60"), value: '30-60' },
    { label: t("recipes.filters.timeRangeOptions.60+"), value: '60+' },
  ];

  const portionRanges = [
    { label: t("recipes.filters.portionOptions.1-2"), value: '1-2' },
    { label: t("recipes.filters.portionOptions.3-4"), value: '3-4' },
    { label: t("recipes.filters.portionOptions.5+"), value: '5+' },
  ];

  const cuisineStyles = [
    { label: t("recipes.filters.cuisineStyleOptions.italian"), value: 'italian' },
    { label: t("recipes.filters.cuisineStyleOptions.mexican"), value: 'mexican' },
    { label: t("recipes.filters.cuisineStyleOptions.japanese"), value: 'japanese' },
    { label: t("recipes.filters.cuisineStyleOptions.american"), value: 'american' },
    { label: t("recipes.filters.cuisineStyleOptions.spanish"), value: 'spanish' },
    { label: t("recipes.filters.cuisineStyleOptions.indian"), value: 'indian' },
    { label: t("recipes.filters.cuisineStyleOptions.jamaican"), value: 'jamaican' },
  ];

  const dietaryRestrictions = [
    { label: t("recipes.filters.dietaryRestrictionOptions.vegetarian"), value: 'vegetarian' },
    { label: t("recipes.filters.dietaryRestrictionOptions.vegan"), value: 'vegan' },
    { label: t("recipes.filters.dietaryRestrictionOptions.gluten-free"), value: 'gluten-free' },
    { label: t("recipes.filters.dietaryRestrictionOptions.lactose-free"), value: 'lactose-free' },
    { label: t("recipes.filters.dietaryRestrictionOptions.keto"), value: 'keto' },
  ];
  
  useEffect(() => {
    const fetchRecipes = async () => {
      if (userLoading) return;

      const firebaseAuthUser = auth.currentUser;
      if (!firebaseAuthUser) {
        setError("Necesitas iniciar sesión para ver tus recetas.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const idToken = await firebaseAuthUser.getIdToken();
        const response = await fetch('/api/recipes', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error al cargar recetas: Status ${response.status}`);
        }

        const data = await response.json();
        setRecipes(data.recipes || []);
      } catch (err: any) {
        console.error("Error al obtener las recetas:", err);
        setError(`Error al cargar tus recetas: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [user, userLoading]);

  // Filter recipes based on current filters
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesTitle = recipe.titulo.toLowerCase().includes(searchLower);
        const matchesDescription = recipe.descripcion.toLowerCase().includes(searchLower);
        const matchesIngredients = recipe.ingredientes.some(ing => 
          ing.nombre.toLowerCase().includes(searchLower)
        );
        if (!matchesTitle && !matchesDescription && !matchesIngredients) {
          return false;
        }
      }

      // Meal time filter
      if (filters.mealTime && recipe.momento_del_dia !== filters.mealTime) {
        return false;
      }

      // Time range filter
      if (filters.timeRange) {
        const [min, max] = filters.timeRange.split('-').map(v => v.replace('+', ''));
        const recipeTime = recipe.tiempo_total_min;
        
        if (filters.timeRange === '60+' && recipeTime <= 60) return false;
        if (filters.timeRange !== '60+') {
          const minTime = parseInt(min);
          const maxTime = parseInt(max);
          if (recipeTime < minTime || recipeTime > maxTime) return false;
        }
      }

      // Portions filter
      if (filters.portions) {
        const recipePorts = recipe.porciones;
        if (filters.portions === '1-2' && (recipePorts < 1 || recipePorts > 2)) return false;
        if (filters.portions === '3-4' && (recipePorts < 3 || recipePorts > 4)) return false;
        if (filters.portions === '5+' && recipePorts < 5) return false;
      }

      // Style filter
      if (filters.style && recipe.estilo !== filters.style) {
        return false;
      }

      // Restrictions filter
      if (filters.restrictions.length > 0) {
        const hasAllRestrictions = filters.restrictions.every(restriction =>
          recipe.restricciones.includes(restriction)
        );
        if (!hasAllRestrictions) return false;
      }

      return true;
    });
  }, [recipes, filters]);

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      mealTime: '',
      timeRange: '',
      portions: '',
      style: '',
      restrictions: []
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : Boolean(value)
  );

  const toggleRestriction = (restriction: string) => {
    setFilters(prev => ({
      ...prev,
      restrictions: prev.restrictions.includes(restriction)
        ? prev.restrictions.filter(r => r !== restriction)
        : [...prev.restrictions, restriction]
    }));
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-24 px-4 sm:px-6 lg:px-8 font-sans">
      <Head>
        <title>{t("recipes.title")} - Culinarium</title>
        <meta name="description" content="Tus recetas generadas y guardadas en Culinarium." />
      </Head>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--foreground)] text-center mb-8">
          <span className="text-[var(--highlight)]">{t("recipes.title").split(" ")[0]}</span> {t("recipes.title").split(" ")[1]}
        </h1>

        {/* Search and Filter Controls */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)] w-5 h-5" />
            <input
              type="text"
              placeholder={t("recipes.searchPlaceholder")}
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-[#111111] placeholder-[#6B7280]
                         focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-colors duration-200"
              style={{ border: "1px solid #E5E5E3" }}
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="flex justify-center">
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all duration-200
                         ${hasActiveFilters
                           ? 'bg-[#f97316] text-white shadow-md'
                           : 'bg-white text-[#111111] hover:border-[#f97316]/40 hover:bg-[#f97316]/5'
                         }`}
              style={!hasActiveFilters ? { border: "1px solid #E5E5E3" } : undefined}
            >
              <IoFunnel className="w-4 h-4" />
              {t("recipes.filters.button")}
              {hasActiveFilters && (
                <span className="bg-white text-[var(--highlight)] rounded-full px-2 py-0.5 text-xs font-bold">
                  {Object.values(filters).filter(v => Array.isArray(v) ? v.length > 0 : Boolean(v)).length}
                </span>
              )}
            </motion.button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid #E5E5E3", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}
              >
                <div className="p-6 space-y-6">
                  {/* Filter Header */}
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-[var(--foreground)]">{t("recipes.filters.title")}</h3>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-[var(--highlight)] hover:text-[var(--highlight)]/80 text-sm font-medium"
                      >
                        {t("recipes.filters.clear")}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Meal Time Filter */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        {t("recipes.filters.mealTime.label")}
                      </label>
                      <select
                        value={filters.mealTime}
                        onChange={(e) => setFilters(prev => ({ ...prev, mealTime: e.target.value }))}
                        className="w-full p-2 rounded-lg bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-colors duration-200"
                        style={{ border: "1px solid #E5E5E3" }}
                      >
                        <option value="">{t("recipes.filters.mealTime.all")}</option>
                        {mealTimes.map(time => (
                          <option key={time.value} value={time.value}>{time.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Time Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        {t("recipes.filters.timeRange.label")}
                      </label>
                      <select
                        value={filters.timeRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                        className="w-full p-2 rounded-lg bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-colors duration-200"
                        style={{ border: "1px solid #E5E5E3" }}
                      >
                        <option value="">{t("recipes.filters.timeRange.any")}</option>
                        {timeRanges.map(range => (
                          <option key={range.value} value={range.value}>{range.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Portions Filter */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        {t("recipes.filters.portions.label")}
                      </label>
                      <select
                        value={filters.portions}
                        onChange={(e) => setFilters(prev => ({ ...prev, portions: e.target.value }))}
                        className="w-full p-2 rounded-lg bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-colors duration-200"
                        style={{ border: "1px solid #E5E5E3" }}
                      >
                        <option value="">{t("recipes.filters.portions.any")}</option>
                        {portionRanges.map(range => (
                          <option key={range.value} value={range.value}>{range.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Style Filter */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        {t("recipes.filters.style.label")}
                      </label>
                      <select
                        value={filters.style}
                        onChange={(e) => setFilters(prev => ({ ...prev, style: e.target.value }))}
                        className="w-full p-2 rounded-lg bg-white text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#f97316]/30 focus:border-[#f97316] transition-colors duration-200"
                        style={{ border: "1px solid #E5E5E3" }}
                      >
                        <option value="">{t("recipes.filters.style.all")}</option>
                        {cuisineStyles.map(style => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dietary Restrictions Filter */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                        {t("recipes.filters.restrictions.label")}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {dietaryRestrictions.map(restriction => (
                          <button
                            key={restriction.value}
                            onClick={() => toggleRestriction(restriction.value)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200
                                       ${filters.restrictions.includes(restriction.value)
                                         ? 'bg-[#f97316] text-white'
                                         : 'bg-[#F5F5F4] text-[#111111] hover:bg-[#f97316]/10 border border-[#E5E5E3]'
                                       }`}
                          >
                            {restriction.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 justify-center">
              {filters.searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--highlight)] text-white rounded-full text-sm">
                  {t("recipes.activeFilters.search", { term: filters.searchTerm })}
                  <button onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}>
                    <IoClose className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.mealTime && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--highlight)] text-white rounded-full text-sm">
                  {mealTimes.find(m => m.value === filters.mealTime)?.label}
                  <button onClick={() => setFilters(prev => ({ ...prev, mealTime: '' }))}>
                    <IoClose className="w-3 h-3" />
                  </button>
                </span>
              )}
              {/* Add more active filter tags as needed */}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-t-4 border-[var(--highlight)] border-t-transparent rounded-full"
            ></motion.div>
            <p className="ml-4 text-[var(--foreground)] text-lg">{t("recipes.loading")}</p>
          </div>
        )}

        {error && (
          <div className="text-center text-[var(--highlight)] text-lg mt-8">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredRecipes.length === 0 && recipes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-[#6B7280] text-xl mt-16 p-8 bg-white rounded-2xl"
            style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <p className="mb-4">{t("recipes.noResults.title")}</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-[var(--highlight)] text-white rounded-lg hover:bg-[var(--highlight)]/90 transition-colors"
            >
              {t("recipes.noResults.clear")}
            </button>
          </motion.div>
        )}

        {!loading && !error && recipes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center text-[#6B7280] text-xl mt-16 p-8 bg-white rounded-2xl"
            style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            <p className="mb-4">{t("recipes.empty.title")}</p>
            <p className="mb-6">{t("recipes.empty.description")}</p>
            <NextLink href="/kitchen" passHref>
              <motion.button
                className="mt-6 px-8 py-3 rounded-full text-lg font-semibold shadow-lg transition-all duration-300 cursor-pointer
                           bg-gradient-to-r from-[var(--highlight)] to-[var(--highlight-dark)] text-[var(--text2)]
                           hover:from-[var(--highlight-dark)] hover:to-[var(--highlight)] focus:outline-none focus:ring-4 focus:ring-[var(--highlight)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t("recipes.empty.button")}
              </motion.button>
            </NextLink>
          </motion.div>
        )}

        {!loading && !error && filteredRecipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-2xl overflow-hidden group cursor-pointer transition-all duration-200"
                style={{ border: "1px solid #E5E5E3", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                {recipe.img_url && (
                  <div className="relative w-full h-48">
                    <Image
                      src={recipe.img_url}
                      alt={recipe.titulo}
                      fill
                      className="object-cover"
                      unoptimized={recipe.img_url.startsWith('data:')}
                    />
                  </div>
                )}
                {!recipe.img_url && (
                  <div className="w-full h-48 flex flex-col items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #F5F5F4 0%, #E5E5E3 100%)" }}>
                    <IoRestaurantOutline className="w-10 h-10 text-[#6B7280]" />
                    <span className="text-xs text-[#6B7280] font-medium">
                      {recipe.momento_del_dia === 'breakfast' && t("recipes.filters.mealTimeOptions.breakfast")}
                      {recipe.momento_del_dia === 'lunch' && t("recipes.filters.mealTimeOptions.lunch")}
                      {recipe.momento_del_dia === 'dinner' && t("recipes.filters.mealTimeOptions.dinner")}
                      {recipe.momento_del_dia === 'snack' && t("recipes.filters.mealTimeOptions.snack")}
                      {!recipe.momento_del_dia && t("recipes.recipeCard.viewRecipe")}
                    </span>
                  </div>
                )}

                <div className="p-6">
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3 leading-tight">
                    {recipe.titulo}
                  </h2>
                  <p className="text-[var(--muted)] text-sm mb-4 line-clamp-3">
                    {recipe.descripcion}
                  </p>
                  <div className="flex flex-wrap items-center text-sm text-[#6B7280] mb-4">
                    <span className="mr-4 flex items-center">
                      <span className="text-[var(--highlight)] mr-1">⏱️</span> {recipe.tiempo_total_min} {t("recipes.recipeCard.time")}
                    </span>
                    <span className="mr-4 flex items-center">
                      <span className="text-[var(--highlight)] mr-1">🍽️</span> {recipe.porciones} {t("recipes.recipeCard.portions")}
                    </span>
                    {recipe.momento_del_dia && (
                      <span className="flex items-center">
                        <span className="text-[var(--highlight)] mr-1">☀️</span> {mealTimes.find(m => m.value === recipe.momento_del_dia)?.label}
                      </span>
                    )}
                  </div>
                  
                  {/* Dietary restrictions badges */}
                  {recipe.restricciones.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {recipe.restricciones.map((restriction, idx) => (
                        <span
                          key={idx}
                          className="bg-[#f97316]/10 text-[#f97316] px-2 py-0.5 rounded-full text-xs font-medium"
                        >
                          {dietaryRestrictions.find(d => d.value === restriction)?.label || restriction}
                        </span>
                      ))}
                    </div>
                  )}

                  <NextLink
                    href={{
                      pathname: '/kitchen/recipes',
                      query: { id: recipe.id },
                    }}
                    passHref
                  >
                    <motion.button
                      className="w-full py-2 rounded-xl text-white font-semibold
                                 bg-gradient-to-r from-[#f97316] to-[#ea580c]
                                 hover:from-[#ea580c] hover:to-[#f97316] transition-all duration-200
                                 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#f97316]/30"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {t("recipes.recipeCard.viewRecipe")}
                    </motion.button>
                  </NextLink>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Results counter */}
        {!loading && !error && recipes.length > 0 && (
          <div className="text-center mt-8 text-[var(--muted)] text-sm">
            {t("recipes.results", { current: filteredRecipes.length, total: recipes.length })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RecipeListPage;