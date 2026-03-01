/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect } from 'react';
import { TFunction } from 'i18next';

const STORAGE_KEY = 'ingredient_history';

const COMMON_INGREDIENTS: string[] = [
  'ingredients.chicken',
  'ingredients.beef',
  'ingredients.fish',
  'ingredients.eggs',
  'ingredients.milk',
  'ingredients.cheese',
  'ingredients.rice',
  'ingredients.pasta',
  'ingredients.bread',
  'ingredients.potatoes',
  'ingredients.onion',
  'ingredients.garlic',
  'ingredients.tomato',
  'ingredients.pepper',
  'ingredients.carrot',
  'ingredients.olive_oil',
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface UseIngredientHistoryReturn {
  ingredientHistory: string[];
  /* addToHistory: (ingredient: string) => void;*/
  getSuggestions: (query: string, currentIngredients?: string[]) => string[];
}

export const useIngredientHistory = (t: TFunction): UseIngredientHistoryReturn => {
  // Shuffle on init so chips appear in a different order each session
  const [ingredientHistory, setIngredientHistory] = useState<string[]>(() => shuffle(COMMON_INGREDIENTS));

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setIngredientHistory(shuffle(parsed));
        }
      } catch (error) {
        console.warn('Error al cargar historial:', error);
      }
    }
  }, []);

  /*const addToHistory = (ingredient: string): void => {
    if (!ingredient || typeof ingredient !== 'string') return;
    
    const normalizedIngredient = ingredient.trim().toLowerCase();
    
    setIngredientHistory(prev => {
      const filtered = prev.filter(item => 
        item.toLowerCase() !== normalizedIngredient
      );
      
      const newHistory = [ingredient.trim(), ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      
      return newHistory;
    });
  };*/

  const getSuggestions = (query: string, currentIngredients: string[] = []): string[] => {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase();
    const normalizedCurrent = currentIngredients.map(ing => ing.toLowerCase());

    return ingredientHistory
      .filter(ingredient =>
        ingredient.toLowerCase().includes(normalizedQuery) &&
        !normalizedCurrent.includes(ingredient.toLowerCase())
      )
      .slice(0, 8);
  };

  return { ingredientHistory, /*addToHistory,*/ getSuggestions };
};