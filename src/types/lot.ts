export type LotCategory = 'non_residential' | 'building' | 'land' | 'other'

export type Lot = {
  id: string
  noticeNumber: string
  title: string
  address: string | null
  price: number | null
  pricePerSqm: number | null
  area: number | null
  cadastralNumber: string | null
  applicationDeadline: string | null
  photoUrl: string | null
  sourceUrl: string
  category: LotCategory
  categoryLabel: string
  lat: number | null
  lon: number | null
  deposit: number | null
  priceStep: number | null
  updatedAt: string
}

export type LotsDataset = {
  generatedAt: string
  source: 'torgi.gov.ru'
  region: 'Санкт-Петербург'
  dealType: 'sale'
  count: number
  lots: Lot[]
}
