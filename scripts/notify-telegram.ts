import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type LotsDataset = {
  lots: Array<{ id: string; title: string; price: number | null; address: string | null }>
}

type LastRun = {
  newIds?: string[]
  count?: number
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LOTS_PATH = path.join(ROOT, 'public', 'data', 'lots.json')
const LAST_RUN = path.join(ROOT, 'data', 'last-run.json')
const PREV_IDS = path.join(ROOT, 'data', 'previous-ids.json')

function formatRub(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

async function main(): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  const mapUrl = process.env.MAP_URL

  if (!token || !chatId) {
    console.log('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set — skip notify')
    return
  }

  const lots = JSON.parse(await readFile(LOTS_PATH, 'utf8')) as LotsDataset
  const lastRun = JSON.parse(await readFile(LAST_RUN, 'utf8')) as LastRun
  const newIds = lastRun.newIds ?? []
  const notifyAlways = process.env.NOTIFY_ALWAYS === '1'

  if (newIds.length === 0 && !notifyAlways) {
    await writeFile(
      PREV_IDS,
      `${JSON.stringify({ ids: lots.lots.map((lot) => lot.id), updatedAt: new Date().toISOString() }, null, 2)}\n`,
      'utf8',
    )
    console.log('no new lots — skip Telegram (set NOTIFY_ALWAYS=1 to force)')
    return
  }

  const lines: string[] = []
  if (newIds.length === 0) {
    lines.push(`СПб · торги: новых лотов нет.`)
    lines.push(`Всего в выдаче: ${lastRun.count ?? lots.lots.length}`)
  } else {
    lines.push(`СПб · торги: ${newIds.length} новых лот(ов)`)
    const preview = lots.lots.filter((lot) => newIds.includes(lot.id)).slice(0, 5)
    for (const lot of preview) {
      lines.push('')
      lines.push(`• ${lot.title}`)
      lines.push(`  ${formatRub(lot.price)} · ${lot.address ?? 'адрес н/д'}`)
    }
    if (newIds.length > 5) {
      lines.push('')
      lines.push(`…и ещё ${newIds.length - 5}`)
    }
  }

  const replyMarkup = mapUrl
    ? {
        inline_keyboard: [
          [
            {
              text: 'Открыть карту',
              web_app: { url: mapUrl },
            },
          ],
        ],
      }
    : undefined

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: lines.join('\n'),
    disable_web_page_preview: true,
  }
  if (replyMarkup) body.reply_markup = replyMarkup

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Telegram API ${response.status}: ${text}`)
  }

  await writeFile(
    PREV_IDS,
    `${JSON.stringify({ ids: lots.lots.map((lot) => lot.id), updatedAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8',
  )

  console.log(`notified chat ${chatId}, new=${newIds.length}`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
