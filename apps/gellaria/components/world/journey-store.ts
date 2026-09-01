"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { landmarks } from "@/lib/content";
import { addJourneyStep, normalizeJourney } from "@/lib/journey";

const landmarkIds = landmarks.map((landmark) => landmark.id);

type JourneyStore = {
  discovered: string[];
  collected: string[];
  hydrated: boolean;
  discover: (landmarkId: string) => boolean;
  collect: (landmarkId: string) => boolean;
  setHydrated: () => void;
};

export const useJourneyStore = create<JourneyStore>()(persist(
  (set, get) => ({
    discovered: [],
    collected: [],
    hydrated: false,
    discover: (landmarkId) => {
      const state = get();
      if (state.discovered.includes(landmarkId) || !landmarkIds.includes(landmarkId)) return false;
      set({ discovered: addJourneyStep(state.discovered, landmarkId, landmarkIds) });
      return true;
    },
    collect: (landmarkId) => {
      const state = get();
      if (!state.discovered.includes(landmarkId) || state.collected.includes(landmarkId)) return false;
      set({ collected: addJourneyStep(state.collected, landmarkId, landmarkIds) });
      return true;
    },
    setHydrated: () => set({ hydrated: true }),
  }),
  {
    name: "gellaria-journey-v1",
    partialize: (state) => ({ discovered: state.discovered, collected: state.collected }),
    merge: (persisted, current) => ({
      ...current,
      ...normalizeJourney(persisted, landmarkIds),
    }),
    onRehydrateStorage: () => (state) => state?.setHydrated(),
  },
));
