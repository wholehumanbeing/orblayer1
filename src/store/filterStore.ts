import { create } from 'zustand'

interface FilterStore {
  timeRange: [number, number]
  selectedEras: string[]
  selectedDomains: string[]
  searchQuery: string
  showConnections: boolean
  
  setTimeRange: (range: [number, number]) => void
  toggleEra: (era: string) => void
  toggleDomain: (domain: string) => void
  setSearchQuery: (query: string) => void
  setShowConnections: (show: boolean) => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  timeRange: [-600, 2023],
  selectedEras: ['Ancient', 'Medieval', 'Renaissance', 'Early Modern', 'Modern', 'Contemporary'],
  selectedDomains: ['logic', 'aesthetics', 'ethics', 'politics', 'metaphysics'],
  searchQuery: '',
  showConnections: false,
  
  setTimeRange: (range) => set({ timeRange: range }),
  toggleEra: (era) => set((state) => ({
    selectedEras: state.selectedEras.includes(era)
      ? state.selectedEras.filter(e => e !== era)
      : [...state.selectedEras, era]
  })),
  toggleDomain: (domain) => set((state) => ({
    selectedDomains: state.selectedDomains.includes(domain)
      ? state.selectedDomains.filter(d => d !== domain)
      : [...state.selectedDomains, domain]
  })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setShowConnections: (show) => set({ showConnections: show })
})) 