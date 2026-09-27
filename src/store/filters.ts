import { create } from 'zustand'
import type { LotCategory } from '../types/lot'

export type FiltersState = {
  query: string
  priceMin: string
  priceMax: string
  areaMin: string
  areaMax: string
  categories: LotCategory[]
  onlyWithCoords: boolean
  selectedLotId: string | null
  setQuery: (value: string) => void
  setPriceMin: (value: string) => void
  setPriceMax: (value: string) => void
  setAreaMin: (value: string) => void
  setAreaMax: (value: string) => void
  toggleCategory: (category: LotCategory) => void
  setOnlyWithCoords: (value: boolean) => void
  setSelectedLotId: (id: string | null) => void
  reset: () => void
}

const ALL_CATEGORIES: LotCategory[] = [
  'non_residential',
  'building',
  'land',
  'other',
]

export const useFiltersStore = create<FiltersState>((set, get) => ({
  query: '',
  priceMin: '',
  priceMax: '',
  areaMin: '',
  areaMax: '',
  categories: [...ALL_CATEGORIES],
  onlyWithCoords: false,
  selectedLotId: null,
  setQuery: (query) => set({ query }),
  setPriceMin: (priceMin) => set({ priceMin }),
  setPriceMax: (priceMax) => set({ priceMax }),
  setAreaMin: (areaMin) => set({ areaMin }),
  setAreaMax: (areaMax) => set({ areaMax }),
  toggleCategory: (category) => {
    const current = get().categories
    if (current.includes(category)) {
      if (current.length === 1) return
      set({ categories: current.filter((c) => c !== category) })
      return
    }
    set({ categories: [...current, category] })
  },
  setOnlyWithCoords: (onlyWithCoords) => set({ onlyWithCoords }),
  setSelectedLotId: (selectedLotId) => set({ selectedLotId }),
  reset: () =>
    set({
      query: '',
      priceMin: '',
      priceMax: '',
      areaMin: '',
      areaMax: '',
      categories: [...ALL_CATEGORIES],
      onlyWithCoords: false,
      selectedLotId: null,
    }),
}))
