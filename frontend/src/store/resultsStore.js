// store/resultsStore.js
import { create } from "zustand";

export const useResultsStore = create((set) => ({
    results: [],
    setResults: (results) => {set({ results })},
    addResult: (result) => {set((state) => ({ results: [...state.results, result] }))},
    clearResults: () => {set({ results: [] })},
}));
