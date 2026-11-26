import { NextResponse } from "next/server";
import { mapAiErrorResponse } from "@/lib/ai/gemini";

export type AiQuotaFeature = "enhance" | "import";

export interface FeatureQuotaBucket {
  used: number;
  limit: number;
  remaining: number;
}

export interface AiQuotaSnapshot {
  enhance: FeatureQuotaBucket;
  import: FeatureQuotaBucket;
  resetAt: string;
}

export interface QuotaReservation {
  uid: string;
  dayKey: string;
  feature: AiQuotaFeature;
  burstTimestamp: number;
  committed: boolean;
  refunded: boolean;
}

export type ReserveQuotaResult =
  | {
      allowed: true;
      reservation: QuotaReservation;
      quota: AiQuotaSnapshot;
    }
  | {
      allowed: false;
      code: "AI_QUOTA_EXCEEDED" | "AI_BURST_LIMITED";
      error: string;
      retryAfterSeconds: number;
      quota: AiQuotaSnapshot;
    };

interface UserDailyUsageRecord {
  dayKey: string;
  enhance: number;
  import: number;
  burstTimestamps: number[];
}

const DEFAULT_DAILY_ENHANCE_LIMIT = 10;
const DEFAULT_DAILY_IMPORT_LIMIT = 2;
const DEFAULT_BURST_PER_MINUTE = 4;
const BURST_WINDOW_MS = 60_000;

const globalQuotaStore = globalThis as typeof globalThis & {
  __craftfolioAiUsageStore?: Map<string, UserDailyUsageRecord>;
};

function getUsageStore(): Map<string, UserDailyUsageRecord> {
  if (!globalQuotaStore.__craftfolioAiUsageStore) {
    globalQuotaStore.__craftfolioAiUsageStore = new Map();
  }
  return globalQuotaStore.__craftfolioAiUsageStore;
}

function parsePositiveEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function getAiQuotaLimits(): {
  enhanceDailyLimit: number;
  importDailyLimit: number;
  burstPerMinute: number;
} {
  return {
    enhanceDailyLimit: parsePositiveEnvInt(
      "AI_DAILY_ENHANCE_LIMIT",
      DEFAULT_DAILY_ENHANCE_LIMIT
    ),
    importDailyLimit: parsePositiveEnvInt(
      "AI_DAILY_IMPORT_LIMIT",
      DEFAULT_DAILY_IMPORT_LIMIT
    ),
    burstPerMinute: parsePositiveEnvInt(
      "AI_BURST_PER_MINUTE",
      DEFAULT_BURST_PER_MINUTE
    ),
  };
}

/** Returns `YYYY-MM-DD` calendar date in Asia/Jakarta (WIB, UTC+7). */
export function getWibDayKey(nowMs: number = Date.now()): string {
  const wibDate = new Date(nowMs + 7 * 60 * 60 * 1000);
  const year = wibDate.getUTCFullYear();
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wibDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Returns ISO timestamp of the next 00:00:00 WIB reset. */
export function getNextWibMidnightIso(nowMs: number = Date.now()): string {
  const wibDate = new Date(nowMs + 7 * 60 * 60 * 1000);
  const nextMidnightUtcMs =
    Date.UTC(
      wibDate.getUTCFullYear(),
      wibDate.getUTCMonth(),
      wibDate.getUTCDate() + 1,
      0,
      0,
      0,
      0
    ) -
    7 * 60 * 60 * 1000;
  return new Date(nextMidnightUtcMs).toISOString();
}

function getOrResetUserRecord(uid: string, dayKey: string): UserDailyUsageRecord {
  const store = getUsageStore();
  const existing = store.get(uid);
  if (!existing || existing.dayKey !== dayKey) {
    const fresh: UserDailyUsageRecord = {
      dayKey,
      enhance: 0,
      import: 0,
      burstTimestamps: existing?.burstTimestamps ?? [],
    };
    store.set(uid, fresh);
    return fresh;
  }
  return existing;
}

function buildSnapshot(
  record: UserDailyUsageRecord,
  nowMs: number
): AiQuotaSnapshot {
  const { enhanceDailyLimit, importDailyLimit } = getAiQuotaLimits();
  return {
    enhance: {
      used: record.enhance,
      limit: enhanceDailyLimit,
      remaining: Math.max(0, enhanceDailyLimit - record.enhance),
    },
    import: {
      used: record.import,
      limit: importDailyLimit,
      remaining: Math.max(0, importDailyLimit - record.import),
    },
    resetAt: getNextWibMidnightIso(nowMs),
  };
}

export function getAiQuotaSnapshot(
  uid: string,
  nowMs: number = Date.now()
): AiQuotaSnapshot {
  const dayKey = getWibDayKey(nowMs);
  const record = getOrResetUserRecord(uid, dayKey);
  return buildSnapshot(record, nowMs);
}

/**
 * Atomically checks both burst rate limit and daily feature limit, reserving 1 slot
 * before calling Gemini so parallel clicks cannot race past the quota.
 */
export function reserveAiQuota(
  uid: string,
  feature: AiQuotaFeature,
  nowMs: number = Date.now()
): ReserveQuotaResult {
  const dayKey = getWibDayKey(nowMs);
  const record = getOrResetUserRecord(uid, dayKey);
  const { enhanceDailyLimit, importDailyLimit, burstPerMinute } =
    getAiQuotaLimits();

  // Prune timestamps older than 60s
  record.burstTimestamps = record.burstTimestamps.filter(
    (ts) => nowMs - ts < BURST_WINDOW_MS
  );

  // 1. Check daily feature limit first
  const currentUsed = feature === "enhance" ? record.enhance : record.import;
  const dailyLimit =
    feature === "enhance" ? enhanceDailyLimit : importDailyLimit;

  if (currentUsed >= dailyLimit) {
    const nextResetMs = new Date(getNextWibMidnightIso(nowMs)).getTime();
    const retryAfterSeconds = Math.max(
      60,
      Math.ceil((nextResetMs - nowMs) / 1000)
    );
    const featureLabel =
      feature === "import" ? "Import CV (PDF/DOCX)" : "Perbaiki Kalimat AI";
    return {
      allowed: false,
      code: "AI_QUOTA_EXCEEDED",
      error: `Kuota harian ${featureLabel} Anda sudah habis (${currentUsed}/${dailyLimit}). Reset otomatis besok pukul 00.00 WIB.`,
      retryAfterSeconds,
      quota: buildSnapshot(record, nowMs),
    };
  }

  // 2. Check rolling 1-minute burst limit
  if (burstPerMinute > 0 && record.burstTimestamps.length >= burstPerMinute) {
    const oldest = record.burstTimestamps[0] ?? nowMs;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((BURST_WINDOW_MS - (nowMs - oldest)) / 1000)
    );
    return {
      allowed: false,
      code: "AI_BURST_LIMITED",
      error: `Terlalu cepat! Maksimal ${burstPerMinute} permintaan AI per menit. Tunggu ${retryAfterSeconds} detik lalu coba lagi.`,
      retryAfterSeconds,
      quota: buildSnapshot(record, nowMs),
    };
  }

  // 3. Reserve slot
  if (feature === "enhance") {
    record.enhance += 1;
  } else {
    record.import += 1;
  }
  record.burstTimestamps.push(nowMs);

  return {
    allowed: true,
    reservation: {
      uid,
      dayKey,
      feature,
      burstTimestamp: nowMs,
      committed: false,
      refunded: false,
    },
    quota: buildSnapshot(record, nowMs),
  };
}

export function commitAiQuota(reservation: QuotaReservation): void {
  reservation.committed = true;
}

/**
 * Refunds a previously reserved AI quota slot if Gemini failed or errored,
 * ensuring users never lose daily quota on upstream failures.
 */
export function refundAiQuota(reservation: QuotaReservation): void {
  if (reservation.committed || reservation.refunded) return;
  reservation.refunded = true;

  const store = getUsageStore();
  const record = store.get(reservation.uid);
  if (!record || record.dayKey !== reservation.dayKey) return;

  if (reservation.feature === "enhance" && record.enhance > 0) {
    record.enhance -= 1;
  } else if (reservation.feature === "import" && record.import > 0) {
    record.import -= 1;
  }

  const tsIdx = record.burstTimestamps.indexOf(reservation.burstTimestamp);
  if (tsIdx !== -1) {
    record.burstTimestamps.splice(tsIdx, 1);
  }
}

export function buildQuotaExceededResponse(
  denied: Extract<ReserveQuotaResult, { allowed: false }>
): NextResponse {
  return NextResponse.json(
    {
      code: denied.code,
      error: denied.error,
      quota: denied.quota,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(denied.retryAfterSeconds),
      },
    }
  );
}

/**
 * Executes an AI request under a reserved quota slot, committing on success
 * and refunding automatically if upstream Gemini execution fails.
 */
export async function executeWithAiQuota<T>(
  uid: string,
  feature: AiQuotaFeature,
  work: () => Promise<T>,
  buildSuccessResponse: (result: T, quota: AiQuotaSnapshot) => NextResponse
): Promise<NextResponse> {
  const reservationResult = reserveAiQuota(uid, feature);
  if (!reservationResult.allowed) {
    return buildQuotaExceededResponse(reservationResult);
  }

  try {
    const result = await work();
    commitAiQuota(reservationResult.reservation);
    return buildSuccessResponse(result, reservationResult.quota);
  } catch (err) {
    refundAiQuota(reservationResult.reservation);
    return mapAiErrorResponse(err);
  }
}

/** Test-only helper to clear in-memory quota state between test cases. */
export function resetAiQuotaStoreForTests(): void {
  getUsageStore().clear();
}
