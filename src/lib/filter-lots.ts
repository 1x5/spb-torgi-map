import type { Lot, LotCategory } from '../types/lot'
import type { FiltersState } from '../store/filters'
import { parseOptionalNumber } from './format'

export function filterLots(lots: Lot[], filters: FiltersState): Lot[] {
  const priceMin = parseOptionalNumber(filters.priceMin)
  const priceMax = parseOptionalNumber(filters.priceMax)
  const areaMin = parseOptionalNumber(filters.areaMin)
  const areaMax = parseOptionalNumber(filters.areaMax)
  const query = filters.query.trim().toLowerCase()

  return lots.filter((lot) => {
    if (!filters.categories.includes(lot.category)) return false
    if (filters.onlyWithCoords && (lot.lat === null || lot.lon === null)) {
      return false
    }
    if (priceMin !== null && (lot.price === null || lot.price < priceMin)) {
      return false
    }
    if (priceMax !== null && (lot.price === null || lot.price > priceMax)) {
      return false
    }
    if (areaMin !== null && (lot.area === null || lot.area < areaMin)) {
      return false
    }
    if (areaMax !== null && (lot.area === null || lot.area > areaMax)) {
      return false
    }
    if (!query) return true

    const haystack = [
      lot.title,
      lot.address ?? '',
      lot.cadastralNumber ?? '',
      lot.categoryLabel,
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(query)
  })
}

export const CATEGORY_LABELS: Record<LotCategory, string> = {
  non_residential: 'Нежилые',
  building: 'Здания',
  land: 'Земля',
  other: 'Прочее',
}
