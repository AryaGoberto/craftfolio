import { handleParseCvPost } from "@/lib/ai/cv-importer";

export async function POST(request: Request) {
  return handleParseCvPost(request);
}
