const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

export function formatRub(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—'
  return rubFormatter.format(value)
}

export function formatArea(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '—'
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} м²`
}

export function formatDeadline(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, '').replace(',', '.')
  if (!trimmed) return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}
