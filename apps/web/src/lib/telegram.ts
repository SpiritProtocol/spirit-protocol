interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const DEV_USER = {
  id: 100001,
  first_name: "Dev",
  last_name: "Preview",
  username: "dev_preview",
};

/**
 * Real initData when the app is opened inside Telegram; otherwise a synthetic
 * dev payload the API accepts only in TELEGRAM_AUTH_MODE=dev (no hash needed),
 * so the app runs in a plain browser during local development.
 */
export function getInitData(): string {
  const webApp = window.Telegram?.WebApp;
  if (webApp?.initData) {
    webApp.ready();
    webApp.expand();
    // The app is a fixed light theme; don't let the client's dark theme bleed
    // into the native header/background chrome around it.
    try {
      webApp.setHeaderColor("#ffffff");
      webApp.setBackgroundColor("#ffffff");
    } catch {
      // Older Telegram clients may not support these calls — safe to ignore.
    }
    return webApp.initData;
  }

  const params = new URLSearchParams();
  params.set("user", JSON.stringify(DEV_USER));
  params.set("auth_date", String(Math.floor(Date.now() / 1000)));
  return params.toString();
}
