import { handleLatexPdfPost } from "@/lib/latex-compiler";

export async function POST(request: Request) {
  return handleLatexPdfPost(request);
}
