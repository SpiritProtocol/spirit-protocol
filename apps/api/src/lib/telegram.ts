import { createHmac } from "node:crypto";

export interface TelegramInitDataUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export interface ParsedTelegramInitData {
  user: TelegramInitDataUser;
  authDate: number;
}

/**
 * Verifies Telegram Mini App `initData` per the documented HMAC scheme
 * (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 * In `dev` auth mode without a configured bot token, verification is skipped so the
 * app can run locally/in E2E tests without a real Telegram bot — never do this in `strict` mode.
 */
export function parseTelegramInitData(
  initData: string,
  botToken: string | undefined,
  mode: "strict" | "dev",
): ParsedTelegramInitData | null {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const userRaw = params.get("user");
  const authDateRaw = params.get("auth_date");

  if (!userRaw) return null;

  if (mode === "strict" || botToken) {
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN is required in strict auth mode");
    if (!hash) return null;

    const pairs: string[] = [];
    for (const [key, value] of params.entries()) {
      if (key === "hash") continue;
      pairs.push(`${key}=${value}`);
    }
    pairs.sort();
    const dataCheckString = pairs.join("\n");

    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
    const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    if (computedHash !== hash) return null;
  }

  const user = JSON.parse(userRaw) as TelegramInitDataUser;
  return { user, authDate: authDateRaw ? Number(authDateRaw) : Date.now() / 1000 };
}
