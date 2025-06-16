import { create } from 'zustand'
import { PhilosopherData } from '@/app/types/philosopher'

interface PhilosopherStore {
  philosophers: PhilosopherData[]
  selectedPhilosopher: PhilosopherData | null
  visiblePhilosophers: Set<string>
  setPhilosophers: (philosophers: PhilosopherData[]) => void
  selectPhilosopher: (philosopher: PhilosopherData | null) => void
  setVisiblePhilosophers: (ids: Set<string>) => void
}

export const usePhilosopherStore = create<PhilosopherStore>((set) => ({
  philosophers: [],
  selectedPhilosopher: null,
  visiblePhilosophers: new Set(),
  setPhilosophers: (philosophers) => set({ philosophers }),
  selectPhilosopher: (philosopher) => set({ selectedPhilosopher: philosopher }),
  setVisiblePhilosophers: (ids) => set({ visiblePhilosophers: ids })
})) 