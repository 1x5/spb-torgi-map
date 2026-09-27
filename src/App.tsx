import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { FilterBar } from './components/FilterBar'
import { LotCard } from './components/LotCard'
import { LotList } from './components/LotList'
import { filterLots } from './lib/filter-lots'
import { initTelegramWebApp } from './lib/telegram'
import { useFiltersStore } from './store/filters'
import type { Lot, LotsDataset } from './types/lot'

const MapView = lazy(async () => {
  const mod = await import('./components/MapView')
  return { default: mod.MapView }
})

async function loadLots(): Promise<LotsDataset> {
  const response = await fetch('./data/lots.json', { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Не удалось загрузить lots.json (${response.status})`)
  }
  return (await response.json()) as LotsDataset
}

export default function App() {
  const [dataset, setDataset] = useState<LotsDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'map' | 'list'>('map')
  const filters = useFiltersStore()

  useEffect(() => {
    initTelegramWebApp()
    void loadLots()
      .then((data) => {
        setDataset(data)
        setError(null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => (dataset ? filterLots(dataset.lots, filters) : []),
    [dataset, filters],
  )

  const selectedLot: Lot | null = useMemo(() => {
    if (!filters.selectedLotId) return null
    return filtered.find((lot) => lot.id === filters.selectedLotId) ?? null
  }, [filtered, filters.selectedLotId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
        Загрузка лотов…
      </div>
    )
  }

  if (error || !dataset) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-[var(--danger)]">{error ?? 'Нет данных'}</p>
        <p className="text-xs text-[var(--muted)]">
          Запусти <code>pnpm fetch-lots</code> или дождись GitHub Action.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <FilterBar total={dataset.lots.length} visible={filtered.length} />

      <div className="flex gap-1 border-b border-[var(--border)] bg-[var(--panel)] px-3 py-2">
        <button
          type="button"
          onClick={() => setTab('map')}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === 'map' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
          }`}
        >
          Карта
        </button>
        <button
          type="button"
          onClick={() => setTab('list')}
          className={`rounded-lg px-3 py-1.5 text-sm ${
            tab === 'list' ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'
          }`}
        >
          Список
        </button>
        <p className="ml-auto self-center text-[11px] text-[var(--muted)]">
          обновлено{' '}
          {new Date(dataset.generatedAt).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div className="relative min-h-0 flex-1">
        {tab === 'map' ? (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                Карта…
              </div>
            }
          >
            <MapView lots={filtered} />
          </Suspense>
        ) : (
          <LotList lots={filtered} />
        )}

        {selectedLot ? (
          <div className="absolute inset-x-0 bottom-0 z-[1000] max-h-[70%] overflow-y-auto p-3">
            <LotCard
              lot={selectedLot}
              onClose={() => filters.setSelectedLotId(null)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
