"use client";

import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useResumeStore } from "@/store/use-resume-store";

export function BasicsForm() {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const updateBasics = useResumeStore((s) => s.updateBasics);
  const addLink = useResumeStore((s) => s.addLink);
  const updateLink = useResumeStore((s) => s.updateLink);
  const removeLink = useResumeStore((s) => s.removeLink);

  const doc = documents[activeDocumentId];
  if (!doc) return null;

  const { basics } = doc;

  const inputClass =
    "w-full h-[34px] px-2.5 text-[13px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B] placeholder:text-[#A1A1AA]";
  const labelClass = "block text-[11px] font-medium text-[#52525B] mb-1";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Nama Lengkap</label>
          <input
            type="text"
            value={basics.fullName}
            onChange={(e) => updateBasics({ fullName: e.target.value })}
            placeholder="Contoh: Raka Pratama"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Headline / Posisi</label>
          <input
            type="text"
            value={basics.headline ?? ""}
            onChange={(e) => updateBasics({ headline: e.target.value })}
            placeholder="Contoh: Frontend Engineer"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={basics.email}
            onChange={(e) => updateBasics({ email: e.target.value })}
            placeholder="nama@email.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Nomor Telepon</label>
          <input
            type="text"
            value={basics.phone ?? ""}
            onChange={(e) => updateBasics({ phone: e.target.value })}
            placeholder="+62 812-3456-7890"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Lokasi (Kota, Negara)</label>
        <input
          type="text"
          value={basics.location ?? ""}
          onChange={(e) => updateBasics({ location: e.target.value })}
          placeholder="Jakarta, Indonesia"
          className={inputClass}
        />
      </div>

      {/* Links */}
      <div className="pt-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-medium text-[#52525B]">
            Tautan (LinkedIn / GitHub / Portfolio)
          </span>
          <button
            type="button"
            onClick={addLink}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#18181B] hover:underline"
          >
            <Plus className="w-3 h-3" />
            Tambah Tautan
          </button>
        </div>

        <div className="space-y-2">
          {basics.links.map((link) => (
            <div
              key={link.id}
              className={`flex items-center gap-1.5 ${
                link.isVisible ? "" : "opacity-45"
              }`}
            >
              <input
                type="text"
                value={link.label}
                onChange={(e) =>
                  updateLink(link.id, { label: e.target.value })
                }
                placeholder="Label"
                className="w-24 h-[32px] px-2 text-[12px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B]"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => updateLink(link.id, { url: e.target.value })}
                placeholder="linkedin.com/in/username"
                className="flex-1 h-[32px] px-2 text-[12px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B]"
              />
              <button
                type="button"
                onClick={() =>
                  updateLink(link.id, { isVisible: !link.isVisible })
                }
                title={link.isVisible ? "Sembunyikan tautan" : "Tampilkan tautan"}
                className="p-1.5 text-[#52525B] hover:text-[#09090B] rounded hover:bg-[#F4F4F5]"
              >
                {link.isVisible ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                title="Hapus tautan"
                className="p-1.5 text-[#A1A1AA] hover:text-[#EF4444] rounded hover:bg-[#F4F4F5]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
