import type { LotCategory } from '../types/lot'
import { CATEGORY_LABELS } from '../lib/filter-lots'
import { useFiltersStore } from '../store/filters'

const CATEGORY_ORDER: LotCategory[] = [
  'non_residential',
  'building',
  'land',
  'other',
]

type FilterBarProps = {
  total: number
  visible: number
}

export function FilterBar({ total, visible }: FilterBarProps) {
  const {
    query,
    priceMin,
    priceMax,
    areaMin,
    areaMax,
    categories,
    onlyWithCoords,
    setQuery,
    setPriceMin,
    setPriceMax,
    setAreaMin,
    setAreaMax,
    toggleCategory,
    setOnlyWithCoords,
    reset,
  } = useFiltersStore()

  return (
    <section className="space-y-3 border-b border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-semibold">СПб · продажа с торгов</h1>
          <p className="text-xs text-[var(--muted)]">
            Показано {visible} из {total}
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--muted)]"
        >
          Сброс
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Адрес, кадастр, название…"
        className="w-full rounded-lg border border-[var(--border)] bg-[#121820] px-3 py-2 text-sm outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
      />

      <div className="grid grid-cols-2 gap-2">
        <input
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          inputMode="numeric"
          placeholder="Цена от"
          className="rounded-lg border border-[var(--border)] bg-[#121820] px-3 py-2 text-sm outline-none"
        />
        <input
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          inputMode="numeric"
          placeholder="Цена до"
          className="rounded-lg border border-[var(--border)] bg-[#121820] px-3 py-2 text-sm outline-none"
        />
        <input
          value={areaMin}
          onChange={(e) => setAreaMin(e.target.value)}
          inputMode="decimal"
          placeholder="Площадь от, м²"
          className="rounded-lg border border-[var(--border)] bg-[#121820] px-3 py-2 text-sm outline-none"
        />
        <input
          value={areaMax}
          onChange={(e) => setAreaMax(e.target.value)}
          inputMode="decimal"
          placeholder="Площадь до, м²"
          className="rounded-lg border border-[var(--border)] bg-[#121820] px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_ORDER.map((category) => {
          const active = categories.includes(category)
          return (
            <button
              key={category}
              type="button"
              onClick={() => toggleCategory(category)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                active
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[#243041] text-[var(--muted)]'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          )
        })}
      </div>

      <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <input
          type="checkbox"
          checked={onlyWithCoords}
          onChange={(e) => setOnlyWithCoords(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Только с координатами на карте
      </label>
    </section>
  )
}
