import { handleEnhanceBulletPost } from "@/lib/ai/bullet-enhancer";

export async function POST(request: Request) {
  return handleEnhanceBulletPost(request);
}
