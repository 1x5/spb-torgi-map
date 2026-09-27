import type { Lot } from '../types/lot'
import { formatArea, formatRub } from '../lib/format'
import { useFiltersStore } from '../store/filters'

type LotListProps = {
  lots: Lot[]
}

export function LotList({ lots }: LotListProps) {
  const selectedLotId = useFiltersStore((s) => s.selectedLotId)
  const setSelectedLotId = useFiltersStore((s) => s.setSelectedLotId)

  if (lots.length === 0) {
    return (
      <p className="p-4 text-sm text-[var(--muted)]">
        Нет лотов по текущим фильтрам.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-[var(--border)] overflow-y-auto">
      {lots.map((lot) => {
        const active = lot.id === selectedLotId
        return (
          <li key={lot.id}>
            <button
              type="button"
              onClick={() => setSelectedLotId(lot.id)}
              className={`w-full px-3 py-3 text-left transition ${
                active ? 'bg-[#243041]' : 'hover:bg-[#1f2833]'
              }`}
            >
              <p className="line-clamp-2 text-sm font-medium leading-snug">
                {lot.title}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {lot.address ?? 'Адрес не указан'}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <span className="font-semibold text-[var(--accent-2)]">
                  {formatRub(lot.price)}
                </span>
                <span>{formatArea(lot.area)}</span>
                {lot.lat === null ? (
                  <span className="text-[var(--danger)]">без координат</span>
                ) : null}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
