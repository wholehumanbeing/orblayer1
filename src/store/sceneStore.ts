import { create } from 'zustand'

interface SceneStore {
  viewMode: 'orb' | 'helix'
  isPaused: boolean
  speed: number
  quality: 'high' | 'medium' | 'low'
  
  setViewMode: (mode: 'orb' | 'helix') => void
  setIsPaused: (paused: boolean) => void
  setSpeed: (speed: number) => void
  setQuality: (quality: 'high' | 'medium' | 'low') => void
}

export const useSceneStore = create<SceneStore>((set) => ({
  viewMode: 'orb',
  isPaused: false,
  speed: 1.0,
  quality: 'high',
  
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsPaused: (paused) => set({ isPaused: paused }),
  setSpeed: (speed) => set({ speed: speed }),
  setQuality: (quality) => set({ quality: quality })
})) 