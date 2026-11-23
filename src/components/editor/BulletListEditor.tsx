"use client";

import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import type { BulletPoint, BuiltinSectionKey } from "@/lib/schemas/resume";
import { useResumeStore } from "@/store/use-resume-store";

interface BulletListEditorProps {
  sectionKey: BuiltinSectionKey | `custom:${string}`;
  itemId: string;
  bullets: BulletPoint[];
}

export function BulletListEditor({
  sectionKey,
  itemId,
  bullets,
}: BulletListEditorProps) {
  const addBullet = useResumeStore((s) => s.addBullet);
  const updateBullet = useResumeStore((s) => s.updateBullet);
  const removeBullet = useResumeStore((s) => s.removeBullet);
  const toggleBulletVisibility = useResumeStore(
    (s) => s.toggleBulletVisibility
  );

  return (
    <div className="mt-2.5 space-y-1.5">
      {bullets.map((b) => (
        <div
          key={b.id}
          className={`flex items-start gap-1.5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-md px-2 py-1.5 ${
            b.isVisible ? "" : "opacity-40"
          }`}
        >
          <span className="text-[#52525B] text-[13px] leading-[22px] select-none">
            •
          </span>
          <textarea
            rows={2}
            value={b.text}
            onChange={(e) =>
              updateBullet(sectionKey, itemId, b.id, e.target.value)
            }
            placeholder="Tulis pencapaian dengan kata kerja aktif & dampak terukur..."
            className="flex-1 bg-transparent text-[12px] text-[#09090B] leading-snug resize-none focus:outline-none placeholder:text-[#A1A1AA]"
          />
          <button
            type="button"
            onClick={() => toggleBulletVisibility(sectionKey, itemId, b.id)}
            title={b.isVisible ? "Sembunyikan poin" : "Tampilkan poin"}
            className="p-1 text-[#52525B] hover:text-[#09090B] rounded hover:bg-[#F4F4F5]"
          >
            {b.isVisible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => removeBullet(sectionKey, itemId, b.id)}
            title="Hapus poin"
            className="p-1 text-[#A1A1AA] hover:text-[#EF4444] rounded hover:bg-[#F4F4F5]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => addBullet(sectionKey, itemId)}
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#52525B] hover:text-[#09090B] pt-0.5"
      >
        <Plus className="w-3 h-3" />
        Tambah Poin
      </button>
    </div>
  );
}
