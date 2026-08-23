import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import type { UserDto } from "@spirit/shared";
import { env } from "../../env.js";
import { AppError } from "../../lib/errors.js";
import { parseTelegramInitData } from "../../lib/telegram.js";
import { toUserDto } from "../../mappers.js";
import type { JwtPayload } from "../../plugins/auth.js";

export interface AuthResult {
  token: string;
  user: UserDto;
}

export class AuthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly signToken: (payload: JwtPayload) => string,
  ) {}

  async loginWithTelegram(initData: string): Promise<AuthResult> {
    const parsed = parseTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_AUTH_MODE);
    if (!parsed) {
      throw AppError.unauthorized("Invalid Telegram authentication data");
    }

    const telegramId = String(parsed.user.id);
    const displayName =
      [parsed.user.first_name, parsed.user.last_name].filter(Boolean).join(" ").trim() ||
      parsed.user.username ||
      `Collector ${telegramId}`;

    const user = await this.prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: parsed.user.username ?? `tg_${telegramId}`,
        displayName,
        avatarUrl: parsed.user.photo_url ?? null,
        role: "COLLECTOR",
      },
      update: {
        displayName,
        avatarUrl: parsed.user.photo_url ?? null,
      },
    });

    const token = this.signToken({ sub: user.id, role: user.role });
    return { token, user: toUserDto(user) };
  }

  async loginAsAdmin(username: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || user.role !== "ADMIN" || !user.passwordHash) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw AppError.unauthorized("Invalid credentials");
    }

    const token = this.signToken({ sub: user.id, role: user.role });
    return { token, user: toUserDto(user) };
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User not found");
    return toUserDto(user);
  }
}
