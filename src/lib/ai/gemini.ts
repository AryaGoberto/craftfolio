import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";

export const DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest";

/**
 * Checks on the server whether a Google Gemini API key is configured.
 * Guest mode and non-AI features must keep working cleanly even when false.
 */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export function getGeminiLanguageModel() {
  const modelId =
    process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  return google(modelId);
}

export function buildAiUnavailableResponse(): NextResponse {
  return NextResponse.json(
    {
      code: "AI_UNAVAILABLE",
      error:
        "Fitur AI Gemini belum aktif karena GOOGLE_GENERATIVE_AI_API_KEY belum dikonfigurasi di server.",
    },
    { status: 503 }
  );
}

export function mapAiErrorResponse(error: unknown): NextResponse {
  const errObj = error as
    | { statusCode?: number; status?: number; name?: string }
    | undefined;
  const status = errObj?.statusCode ?? errObj?.status;

  if (errObj?.name === "TimeoutError" || errObj?.name === "AbortError") {
    return NextResponse.json(
      {
        code: "AI_TIMEOUT",
        error:
          "Permintaan ke Gemini melebihi batas waktu (timeout). Server model mungkin sedang padat — coba lagi atau ganti GEMINI_MODEL.",
      },
      { status: 504 }
    );
  }

  if (status === 429) {
    return NextResponse.json(
      {
        code: "AI_RATE_LIMITED",
        error:
          "Batas permintaan API Gemini sementara tercapai. Silakan coba lagi beberapa saat lagi.",
      },
      { status: 429 }
    );
  }

  if (status === 503) {
    return NextResponse.json(
      {
        code: "AI_MODEL_OVERLOADED",
        error:
          "Model Gemini sedang mengalami lonjakan permintaan. Silakan coba lagi sebentar atau ganti GEMINI_MODEL.",
      },
      { status: 503 }
    );
  }

  if (status === 404) {
    return NextResponse.json(
      {
        code: "AI_MODEL_NOT_FOUND",
        error:
          "Model Gemini yang dikonfigurasi tidak ditemukan atau sudah tidak tersedia. Periksa GEMINI_MODEL.",
      },
      { status: 502 }
    );
  }

  if (status === 401 || status === 403) {
    return NextResponse.json(
      {
        code: "AI_AUTH_ERROR",
        error:
          "Kredensial Gemini API ditolak oleh server Google. Periksa kembali GOOGLE_GENERATIVE_AI_API_KEY.",
      },
      { status: 502 }
    );
  }

  console.error("[AI] Unexpected Gemini failure:", error);
  return NextResponse.json(
    {
      code: "AI_REQUEST_FAILED",
      error: "Permintaan ke layanan AI gagal diproses. Silakan coba lagi.",
    },
    { status: 500 }
  );
}
