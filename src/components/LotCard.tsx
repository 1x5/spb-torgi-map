import type { Lot } from '../types/lot'
import { CATEGORY_LABELS } from '../lib/filter-lots'
import { formatArea, formatDeadline, formatRub } from '../lib/format'
import { openExternal } from '../lib/telegram'

type LotCardProps = {
  lot: Lot
  compact?: boolean
  onClose?: () => void
}

export function LotCard({ lot, compact = false, onClose }: LotCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] ${
        compact ? '' : 'shadow-lg'
      }`}
    >
      {lot.photoUrl ? (
        <img
          src={lot.photoUrl}
          alt=""
          className="h-36 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-24 items-center justify-center bg-[#121820] text-sm text-[var(--muted)]">
          Нет фото
        </div>
      )}

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              {CATEGORY_LABELS[lot.category]} · {lot.categoryLabel}
            </p>
            <h2 className="mt-1 text-[15px] font-semibold leading-snug">
              {lot.title}
            </h2>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-sm text-[var(--muted)] hover:bg-[#243041]"
              aria-label="Закрыть"
            >
              ✕
            </button>
          ) : null}
        </div>

        <p className="text-sm text-[var(--muted)]">
          {lot.address ?? 'Адрес не указан'}
        </p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-[var(--muted)]">Цена</p>
            <p className="font-semibold text-[var(--accent-2)]">
              {formatRub(lot.price)}
            </p>
          </div>
          <div>
            <p className="text-[var(--muted)]">₽/м²</p>
            <p className="font-semibold">{formatRub(lot.pricePerSqm)}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Площадь</p>
            <p className="font-semibold">{formatArea(lot.area)}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">Заявки до</p>
            <p className="font-semibold">{formatDeadline(lot.applicationDeadline)}</p>
          </div>
        </div>

        {lot.cadastralNumber ? (
          <p className="text-xs text-[var(--muted)]">
            Кадастр: <span className="text-[var(--text)]">{lot.cadastralNumber}</span>
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => openExternal(lot.sourceUrl)}
          className="mt-1 w-full rounded-lg bg-[var(--accent)] px-3 py-2.5 text-sm font-medium text-white"
        >
          Открыть на torgi.gov.ru
        </button>
      </div>
    </article>
  )
}
