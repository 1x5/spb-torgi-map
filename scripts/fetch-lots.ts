import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type LotCategory = 'non_residential' | 'building' | 'land' | 'other'

type Lot = {
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

type LotsDataset = {
  generatedAt: string
  source: 'torgi.gov.ru'
  region: 'Санкт-Петербург'
  dealType: 'sale'
  count: number
  lots: Lot[]
}

type CategoryConfig = {
  code: string
  category: LotCategory
  label: string
}

type TorgiSearchResponse = {
  content?: TorgiLotCard[]
  totalElements?: number
  totalPages?: number
}

type TorgiLotCard = {
  id?: string
  noticeNumber?: string
  lotName?: string
  lotDescription?: string
  lotStatus?: string
  typeTransaction?: string
  priceMin?: number
  priceFin?: number
  deposit?: number
  priceStep?: number
  biddEndTime?: string
  createDate?: string
  lotImages?: string[]
  characteristics?: TorgiCharacteristic[]
  attributes?: TorgiAttribute[]
  category?: { code?: string; name?: string }
  estateAddress?: string | null
  subjectRFCode?: string
  auctionStartDate?: string
  biddStartTime?: string
  etpUrl?: string
  lotAttachments?: Array<{ fileName?: string; fileId?: string }>
  latitude?: number
  longitude?: number
  lat?: number
  lon?: number
}

type TorgiCharacteristic = {
  code?: string
  name?: string
  characteristicValue?: unknown
}

type TorgiAttribute = {
  code?: string
  fullName?: string
  value?: unknown
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = path.join(ROOT, 'public', 'data', 'lots.json')
const PREV_IDS = path.join(ROOT, 'data', 'previous-ids.json')

const BASE = 'https://torgi.gov.ru/new/api/public'
const FILE_STORE = 'https://torgi.gov.ru/new/file-store/v1'
const SUBJECT_SPB = '78'
const PAGE_SIZE = 100
const STATUSES = ['APPLICATIONS_SUBMISSION', 'PUBLISHED']

const CATEGORIES: CategoryConfig[] = [
  { code: '11', category: 'non_residential', label: 'Нежилые помещения' },
  { code: '8', category: 'building', label: 'Здания' },
  { code: '2', category: 'land', label: 'Земельные участки' },
  { code: '208', category: 'other', label: 'Иной объект недвижимости' },
]

const USER_AGENT = 'spb-torgi-map/0.1 (personal; github actions)'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson<T>(url: string, attempt = 1): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`)
    }
    return (await response.json()) as T
  } catch (error) {
    if (attempt >= 4) throw error
    const delay = attempt * 2000
    console.warn(`retry ${attempt} in ${delay}ms: ${url}`)
    await sleep(delay)
    return fetchJson<T>(url, attempt + 1)
  }
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim()
  if (typeof value === 'number') return String(value)
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name
    return typeof name === 'string' && name.trim() ? name.trim() : null
  }
  return null
}

function pickCharacteristic(
  chars: TorgiCharacteristic[] | undefined,
  codes: string[],
): unknown {
  if (!chars) return undefined
  const lower = codes.map((c) => c.toLowerCase())
  for (const item of chars) {
    const code = (item.code ?? '').toLowerCase()
    const name = (item.name ?? '').toLowerCase()
    if (lower.some((c) => code.includes(c) || name.includes(c))) {
      return item.characteristicValue
    }
  }
  return undefined
}

function extractCadastral(card: TorgiLotCard): string | null {
  const value = pickCharacteristic(card.characteristics, [
    'cadastral',
    'кадастр',
  ])
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = asText(item)
      if (text) return text
    }
  }
  return asText(value)
}

function extractArea(card: TorgiLotCard): number | null {
  const value = pickCharacteristic(card.characteristics, [
    'square',
    'area',
    'площад',
  ])
  if (Array.isArray(value)) {
    for (const item of value) {
      const num = asNumber(
        typeof item === 'object' && item && 'value' in item
          ? (item as { value: unknown }).value
          : item,
      )
      if (num !== null) return num
    }
  }
  if (value && typeof value === 'object' && 'value' in value) {
    return asNumber((value as { value: unknown }).value)
  }
  return asNumber(value)
}

function extractAddress(card: TorgiLotCard): string | null {
  const direct = asText(card.estateAddress)
  if (direct) return direct

  const fromChars = pickCharacteristic(card.characteristics, [
    'address',
    'location',
    'местополож',
    'адрес',
  ])
  const text = asText(fromChars)
  if (text) return text

  if (card.attributes) {
    for (const attr of card.attributes) {
      const code = (attr.code ?? '').toLowerCase()
      const name = (attr.fullName ?? '').toLowerCase()
      if (
        code.includes('address') ||
        name.includes('адрес') ||
        name.includes('местополож')
      ) {
        const value = asText(attr.value)
        if (value) return value
      }
    }
  }

  const fromDescription = asText(card.lotDescription)
  if (fromDescription && /санкт-петербург|спб|петербург/i.test(fromDescription)) {
    return fromDescription.slice(0, 200)
  }

  return null
}

function extractCoords(card: TorgiLotCard): { lat: number; lon: number } | null {
  const lat = asNumber(card.latitude ?? card.lat)
  const lon = asNumber(card.longitude ?? card.lon)
  if (lat !== null && lon !== null) return { lat, lon }

  if (card.attributes) {
    let aLat: number | null = null
    let aLon: number | null = null
    for (const attr of card.attributes) {
      const key = `${attr.code ?? ''} ${attr.fullName ?? ''}`.toLowerCase()
      if (key.includes('lat') || key.includes('широт')) {
        aLat = asNumber(attr.value)
      }
      if (key.includes('lon') || key.includes('lng') || key.includes('долгот')) {
        aLon = asNumber(attr.value)
      }
    }
    if (aLat !== null && aLon !== null) return { lat: aLat, lon: aLon }
  }

  return null
}

function isSale(card: TorgiLotCard): boolean {
  const tx = (card.typeTransaction ?? '').toLowerCase()
  if (!tx) return true
  if (tx.includes('rent') || tx.includes('arend') || tx === 'lease') return false
  return true
}

function mapCategory(code: string, fallbackLabel: string): {
  category: LotCategory
  categoryLabel: string
} {
  const found = CATEGORIES.find((c) => c.code === code)
  if (found) {
    return { category: found.category, categoryLabel: found.label }
  }
  return { category: 'other', categoryLabel: fallbackLabel || 'Прочее' }
}

async function searchCategory(cat: CategoryConfig): Promise<TorgiLotCard[]> {
  const results: TorgiLotCard[] = []
  let page = 0
  let totalPages = 1

  while (page < totalPages) {
    const params = new URLSearchParams({
      dynSubjRF: SUBJECT_SPB,
      lotStatus: STATUSES.join(','),
      catCode: cat.code,
      page: String(page),
      size: String(PAGE_SIZE),
      sort: 'firstVersionPublicationDate,desc',
    })
    const url = `${BASE}/lotcards/search?${params.toString()}`
    console.log(`fetch ${cat.label} page ${page + 1}`)
    const data = await fetchJson<TorgiSearchResponse>(url)
    const content = data.content ?? []
    results.push(...content)
    totalPages = data.totalPages ?? 1
    page += 1
    await sleep(250)
  }

  return results
}

async function fetchLotDetail(id: string): Promise<TorgiLotCard | null> {
  try {
    return await fetchJson<TorgiLotCard>(`${BASE}/lotcards/${id}`)
  } catch (error) {
    console.warn(`detail failed for ${id}:`, error)
    return null
  }
}

async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  const query = address.includes('Санкт-Петербург')
    ? address
    : `Санкт-Петербург, ${address}`
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'ru',
  })
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
      },
    })
    if (!response.ok) return null
    const data = (await response.json()) as Array<{ lat: string; lon: string }>
    if (!data[0]) return null
    const lat = Number(data[0].lat)
    const lon = Number(data[0].lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
    return { lat, lon }
  } catch {
    return null
  }
}

function toLot(
  card: TorgiLotCard,
  catHint: CategoryConfig,
  coords: { lat: number; lon: number } | null,
): Lot | null {
  if (!card.id) return null
  const price = asNumber(card.priceMin) ?? asNumber(card.priceFin)
  const area = extractArea(card)
  const mapped = mapCategory(
    card.category?.code ?? catHint.code,
    card.category?.name ?? catHint.label,
  )
  const imageId = card.lotImages?.[0]
  const pricePerSqm =
    price !== null && area !== null && area > 0
      ? Math.round(price / area)
      : null

  return {
    id: card.id,
    noticeNumber: card.noticeNumber ?? card.id,
    title: card.lotName?.trim() || card.lotDescription?.slice(0, 120) || 'Лот',
    address: extractAddress(card),
    price,
    pricePerSqm,
    area,
    cadastralNumber: extractCadastral(card),
    applicationDeadline: card.biddEndTime ?? null,
    photoUrl: imageId ? `${FILE_STORE}/${imageId}?disposition=inline` : null,
    sourceUrl: `https://torgi.gov.ru/new/public/lots/lot/${card.id}`,
    category: mapped.category,
    categoryLabel: mapped.categoryLabel,
    lat: coords?.lat ?? null,
    lon: coords?.lon ?? null,
    deposit: asNumber(card.deposit),
    priceStep: asNumber(card.priceStep),
    updatedAt: new Date().toISOString(),
  }
}

async function loadPreviousIds(): Promise<Set<string>> {
  try {
    const raw = await readFile(PREV_IDS, 'utf8')
    const parsed = JSON.parse(raw) as { ids?: string[] }
    return new Set(parsed.ids ?? [])
  } catch {
    return new Set()
  }
}

async function main(): Promise<void> {
  const byId = new Map<string, { card: TorgiLotCard; cat: CategoryConfig }>()

  for (const cat of CATEGORIES) {
    const cards = await searchCategory(cat)
    for (const card of cards) {
      if (!card.id || !isSale(card)) continue
      if (!byId.has(card.id)) {
        byId.set(card.id, { card, cat })
      }
    }
  }

  console.log(`unique sale lots: ${byId.size}`)

  const lots: Lot[] = []
  let geocodeCount = 0

  for (const { card, cat } of byId.values()) {
    const detail = await fetchLotDetail(card.id!)
    const merged: TorgiLotCard = { ...card, ...(detail ?? {}) }
    if (!isSale(merged)) continue

    let coords = extractCoords(merged)
    if (!coords) {
      const address = extractAddress(merged)
      if (address) {
        coords = await geocode(address)
        geocodeCount += 1
        await sleep(1100)
      }
    }

    const lot = toLot(merged, cat, coords)
    if (lot) lots.push(lot)
    await sleep(150)
  }

  lots.sort((a, b) => {
    const ta = a.applicationDeadline ? Date.parse(a.applicationDeadline) : 0
    const tb = b.applicationDeadline ? Date.parse(b.applicationDeadline) : 0
    return ta - tb
  })

  const previousIds = await loadPreviousIds()
  // First successful run establishes a baseline — don't notify about the whole catalog.
  const newIds =
    previousIds.size === 0
      ? []
      : lots.map((l) => l.id).filter((id) => !previousIds.has(id))

  const dataset: LotsDataset = {
    generatedAt: new Date().toISOString(),
    source: 'torgi.gov.ru',
    region: 'Санкт-Петербург',
    dealType: 'sale',
    count: lots.length,
    lots,
  }

  await mkdir(path.dirname(OUTPUT), { recursive: true })
  await mkdir(path.dirname(PREV_IDS), { recursive: true })
  await writeFile(OUTPUT, `${JSON.stringify(dataset, null, 2)}\n`, 'utf8')
  await writeFile(
    path.join(ROOT, 'data', 'last-run.json'),
    `${JSON.stringify(
      {
        generatedAt: dataset.generatedAt,
        count: lots.length,
        withCoords: lots.filter((l) => l.lat !== null).length,
        geocodeRequests: geocodeCount,
        newIds,
      },
      null,
      2,
    )}\n`,
    'utf8',
  )

  if (previousIds.size === 0) {
    await writeFile(
      PREV_IDS,
      `${JSON.stringify(
        {
          ids: lots.map((l) => l.id),
          updatedAt: dataset.generatedAt,
          note: 'baseline',
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
    console.log('baseline previous-ids written')
  }

  console.log(
    `saved ${lots.length} lots → ${OUTPUT} (coords: ${lots.filter((l) => l.lat !== null).length}, new: ${newIds.length})`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  console.error(`
Не удалось скачать лоты с torgi.gov.ru.
Частые причины:
  • сайт недоступен из текущей сети / VPN (проверь в браузере https://torgi.gov.ru)
  • GitHub-hosted runner за рубежом — нужен HTTPS_PROXY или self-hosted runner в РФ
`)
  process.exit(1)
})
