import { handleEnhanceSummaryPost } from "@/lib/ai/summary-enhancer";

export async function POST(request: Request) {
  return handleEnhanceSummaryPost(request);
}
