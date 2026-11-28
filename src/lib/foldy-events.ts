export type FoldyEventType =
  | "ai-start"
  | "ai-end"
  | "ai-applied"
  | "pdf-exported"
  | "cv-imported"
  | "jd-high-match";

export interface FoldyEventPayload {
  type: FoldyEventType;
  docId?: string;
  detail?: string;
}

const FOLDY_RUNTIME_EVENT = "craftfolio-foldy-runtime-event";

export function emitFoldyEvent(payload: FoldyEventPayload): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<FoldyEventPayload>(FOLDY_RUNTIME_EVENT, { detail: payload })
  );
}

export function subscribeFoldyEvents(
  handler: (payload: FoldyEventPayload) => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const custom = event as CustomEvent<FoldyEventPayload>;
    if (custom.detail) {
      handler(custom.detail);
    }
  };
  window.addEventListener(FOLDY_RUNTIME_EVENT, listener);
  return () => {
    window.removeEventListener(FOLDY_RUNTIME_EVENT, listener);
  };
}
