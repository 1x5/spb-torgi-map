# СПб · Торги на карте

Личный Telegram Mini App: карта **продажи** коммерческой недвижимости с [ГИС Торги](https://torgi.gov.ru) по Санкт-Петербургу.

Раз в день GitHub Actions обновляет лоты и шлёт пуш: «N новых» + кнопка «Открыть карту».

## Что внутри

- Mini App (Vite + React + TypeScript + Tailwind + Leaflet)
- Фильтры: цена, площадь, тип (нежилые / здания / земля), поиск
- Карточка: цена, ₽/м², площадь, адрес, фото, срок заявок, кадастр, ссылка
- Daily job: `scripts/fetch-lots.ts` → `public/data/lots.json` → Telegram

Без VPS: только GitHub Actions + GitHub Pages.

## Быстрый старт локально

```bash
pnpm install
pnpm dev
```

Открой http://localhost:5173 — на карте демо-лоты из `public/data/lots.json`.

Подтянуть живые данные (нужен доступ к torgi.gov.ru):

```bash
pnpm fetch-lots
```

## Настройка Telegram + GitHub

### 1. Бот

1. [@BotFather](https://t.me/BotFather) → `/newbot`
2. Сохрани токен
3. Напиши боту `/start` (чтобы он мог слать сообщения)
4. Узнай свой `chat_id`: напиши [@userinfobot](https://t.me/userinfobot) или вызови  
   `https://api.telegram.org/bot<TOKEN>/getUpdates`

### 2. Secrets репозитория

Settings → Secrets and variables → Actions:

| Secret | Значение |
|---|---|
| `TELEGRAM_BOT_TOKEN` | токен бота |
| `TELEGRAM_CHAT_ID` | твой chat id |
| `MAP_URL` | URL Mini App на Pages, напр. `https://<user>.github.io/spb-torgi-map/` |

### 3. GitHub Pages

1. Settings → Pages → Source: **GitHub Actions**
2. Запушь в `main` — workflow `Deploy Mini App` выложит сайт
3. В BotFather: `/setmenubutton` → URL = `MAP_URL` (опционально, удобно открывать карту из меню)

### 4. Daily job

Workflow `Daily lots` в 09:00 МСК (`0 6 * * *` UTC).

Можно запустить вручную: Actions → Daily lots → Run workflow.

Первый успешный прогон только фиксирует baseline (без спама «все лоты новые»).  
Дальше пуш приходит **только если появились новые лоты**. Чтобы слать каждый день даже при нуле: секрет/env `NOTIFY_ALWAYS=1`.

> Если Actions не достучится до `torgi.gov.ru` (таймаут/блок), workflow упадёт на шаге Fetch — тогда `pnpm fetch-lots` локально и закоммить `public/data/lots.json`, либо позже добавим прокси.

## Структура

```
public/data/lots.json     # данные для карты (коммитятся)
scripts/fetch-lots.ts     # сборщик ГИС Торги
scripts/notify-telegram.ts
.github/workflows/daily.yml
.github/workflows/deploy.yml
src/                      # Mini App
```

## Ограничения v1

- Только ГИС Торги, только СПб, только продажа
- Банкротство / банки / ФССП — позже
- Кадастровая / обременения — позже
- Координаты: из карточки лота или геокодер Nominatim (часть лотов может быть без пина — смотри список)

## Стек

React 19 · Vite · TypeScript · Tailwind CSS 4 · Leaflet · Zustand · pnpm · GitHub Actions / Pages
