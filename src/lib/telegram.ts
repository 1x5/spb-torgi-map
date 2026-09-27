type TelegramWebApp = {
  ready: () => void
  expand: () => void
  themeParams?: Record<string, string | undefined>
  colorScheme?: 'light' | 'dark'
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}

export function initTelegramWebApp(): void {
  const app = window.Telegram?.WebApp
  if (!app) return
  app.ready()
  app.expand()

  const bg = app.themeParams?.bg_color
  const text = app.themeParams?.text_color
  if (bg) document.documentElement.style.setProperty('--bg', bg)
  if (text) document.documentElement.style.setProperty('--text', text)
}

export function openExternal(url: string): void {
  const app = window.Telegram?.WebApp
  if (app?.openLink) {
    app.openLink(url)
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
