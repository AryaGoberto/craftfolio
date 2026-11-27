"use client";

import { Plus } from "lucide-react";
import type {
  BulletPoint,
  BuiltinSectionKey,
  SectionKey,
} from "@/lib/schemas/resume";
import { useResumeStore } from "@/store/use-resume-store";
import { BulletListEditor } from "@/components/editor/BulletListEditor";
import { ItemCardWrapper } from "@/components/editor/ItemCardWrapper";
import { SummaryEditor } from "@/components/editor/SummaryEditor";

const inputClass =
  "w-full h-[34px] px-2.5 text-[13px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B] placeholder:text-[#A1A1AA]";
const labelClass = "block text-[11px] font-medium text-[#52525B] mb-1";

interface FieldDef {
  key: string;
  label: string;
  placeholder?: string;
  fullWidth?: boolean;
}

interface SectionFormConfig {
  fields: FieldDef[];
  addLabel: string;
  emptyText?: string;
  hasBullets?: boolean;
  getTitle: (item: Record<string, unknown>) => string;
  getSubtitle: (item: Record<string, unknown>) => string;
}

const EXPERIENCE_CONFIG: SectionFormConfig = {
  addLabel: "Tambah Pengalaman",
  emptyText: "Belum ada data pengalaman.",
  hasBullets: true,
  getTitle: (it) =>
    [it.company, it.position].filter(Boolean).join(" — ") as string,
  getSubtitle: (it) =>
    [it.startDate, it.endDate].filter(Boolean).join(" – ") as string,
  fields: [
    {
      key: "company",
      label: "Perusahaan / Organisasi",
      placeholder: "Nama Perusahaan / Organisasi",
    },
    {
      key: "position",
      label: "Posisi / Peran",
      placeholder: "Posisi / Jabatan Anda",
    },
    { key: "startDate", label: "Tanggal Mulai", placeholder: "Bulan Tahun" },
    { key: "endDate", label: "Tanggal Selesai", placeholder: "Sekarang / Bulan Tahun" },
    {
      key: "location",
      label: "Lokasi (opsional)",
      placeholder: "Kota, Negara",
      fullWidth: true,
    },
  ],
};

const SECTION_CONFIGS: Record<
  BuiltinSectionKey | "custom",
  SectionFormConfig
> = {
  experience: EXPERIENCE_CONFIG,
  volunteering: EXPERIENCE_CONFIG,
  education: {
    addLabel: "Tambah Pendidikan",
    getTitle: (it) =>
      [it.institution, it.degree].filter(Boolean).join(" — ") as string,
    getSubtitle: (it) =>
      [it.startDate, it.endDate].filter(Boolean).join(" – ") as string,
    fields: [
      {
        key: "institution",
        label: "Institusi / Universitas",
        placeholder: "Nama Universitas / Institusi",
      },
      {
        key: "degree",
        label: "Gelar & Jurusan",
        placeholder: "Gelar & Program Studi",
      },
      { key: "startDate", label: "Tahun Masuk", placeholder: "Tahun Masuk" },
      { key: "endDate", label: "Tahun Lulus", placeholder: "Tahun Lulus" },
      { key: "gpa", label: "IPK / GPA (opsional)", placeholder: "IPK (opsional)" },
      {
        key: "location",
        label: "Lokasi (opsional)",
        placeholder: "Kota, Negara",
      },
    ],
  },
  projects: {
    addLabel: "Tambah Proyek",
    hasBullets: true,
    getTitle: (it) => String(it.name ?? ""),
    getSubtitle: (it) => String(it.techStack ?? ""),
    fields: [
      {
        key: "name",
        label: "Nama Proyek",
        placeholder: "Nama Proyek",
      },
      {
        key: "techStack",
        label: "Teknologi / Peran",
        placeholder: "Teknologi atau peralatan yang digunakan",
      },
      { key: "date", label: "Tahun / Tanggal", placeholder: "Tahun" },
      {
        key: "url",
        label: "Tautan (opsional)",
        placeholder: "tautan-proyek.com",
      },
    ],
  },
  skills: {
    addLabel: "Tambah Kategori Keahlian",
    getTitle: (it) => String(it.category || "Kategori Keahlian"),
    getSubtitle: (it) => String(it.skills ?? ""),
    fields: [
      {
        key: "category",
        label: "Kategori",
        placeholder: "Kategori Keahlian (mis. Teknis / Bahasa / Tools)",
        fullWidth: true,
      },
      {
        key: "skills",
        label: "Daftar Keahlian (pisahkan dengan koma)",
        placeholder: "Keahlian 1, Keahlian 2, Keahlian 3",
        fullWidth: true,
      },
    ],
  },
  certifications: {
    addLabel: "Tambah Sertifikasi",
    getTitle: (it) => String(it.name ?? ""),
    getSubtitle: (it) => String(it.issuer ?? ""),
    fields: [
      {
        key: "name",
        label: "Nama Sertifikasi",
        placeholder: "Nama Sertifikasi",
        fullWidth: true,
      },
      { key: "issuer", label: "Penerbit", placeholder: "Lembaga Penerbit" },
      { key: "date", label: "Tanggal / Tahun", placeholder: "Tahun" },
    ],
  },
  awards: {
    addLabel: "Tambah Penghargaan",
    getTitle: (it) => String(it.title ?? ""),
    getSubtitle: (it) => String(it.issuer ?? ""),
    fields: [
      {
        key: "title",
        label: "Nama Penghargaan",
        placeholder: "Judul Penghargaan",
        fullWidth: true,
      },
      { key: "issuer", label: "Pemberi", placeholder: "Penyelenggara" },
      { key: "date", label: "Tahun", placeholder: "Tahun" },
    ],
  },
  languages: {
    addLabel: "Tambah Bahasa",
    getTitle: (it) => String(it.language ?? ""),
    getSubtitle: (it) => String(it.proficiency ?? ""),
    fields: [
      { key: "language", label: "Bahasa", placeholder: "Nama Bahasa" },
      {
        key: "proficiency",
        label: "Tingkat Kemahiran",
        placeholder: "Tingkat Kemahiran (mis. Fasih / Aktif)",
      },
    ],
  },
  custom: {
    addLabel: "Tambah Item",
    emptyText: "Belum ada item di bagian ini.",
    hasBullets: true,
    getTitle: (it) => String(it.title ?? ""),
    getSubtitle: (it) => String(it.date ?? ""),
    fields: [
      {
        key: "title",
        label: "Judul Item / Sertifikasi",
        placeholder: "Judul Sertifikasi / Item",
      },
      {
        key: "subtitle",
        label: "Subjudul / Penerbit",
        placeholder: "Penerbit / Penyelenggara",
      },
      {
        key: "date",
        label: "Tanggal / Tahun",
        placeholder: "Tahun",
        fullWidth: true,
      },
    ],
  },
};

type GenericItem = {
  id: string;
  isVisible: boolean;
  bullets?: BulletPoint[];
  [key: string]: unknown;
};

export function SectionBodyForm({ sectionKey }: { sectionKey: SectionKey }) {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const updateSectionTitle = useResumeStore((s) => s.updateSectionTitle);
  const addSectionItem = useResumeStore((s) => s.addSectionItem);
  const updateSectionItem = useResumeStore((s) => s.updateSectionItem);
  const removeSectionItem = useResumeStore((s) => s.removeSectionItem);
  const toggleItemVisibility = useResumeStore((s) => s.toggleItemVisibility);
  const reorderSectionItems = useResumeStore((s) => s.reorderSectionItems);

  const doc = documents[activeDocumentId];
  if (!doc) return null;

  if (sectionKey === "summary") {
    return <SummaryEditor />;
  }

  const isCustom = sectionKey.startsWith("custom:");
  const targetKey = sectionKey as BuiltinSectionKey | `custom:${string}`;
  const customSectionObj = isCustom
    ? doc.sections.customSections.find(
        (cs) => cs.id === sectionKey.replace("custom:", "")
      )
    : undefined;
  const config = isCustom
    ? SECTION_CONFIGS.custom
    : SECTION_CONFIGS[sectionKey as BuiltinSectionKey];

  const items: GenericItem[] = isCustom
    ? (customSectionObj?.items as GenericItem[] | undefined) ?? []
    : (doc.sections[sectionKey as BuiltinSectionKey].items as GenericItem[]);

  return (
    <div className="space-y-3">
      {isCustom && customSectionObj && (
        <div>
          <label className={labelClass}>Judul Header Section</label>
          <input
            type="text"
            value={customSectionObj.title}
            onChange={(e) => updateSectionTitle(sectionKey, e.target.value)}
            placeholder="Misal: Sertifikasi / Penghargaan / Organisasi"
            className={inputClass}
          />
        </div>
      )}
      {items.length === 0 && config.emptyText ? (
        <div className="border border-dashed border-[#E4E4E7] rounded-lg p-4 text-center text-[12px] text-[#52525B]">
          {config.emptyText}
        </div>
      ) : (
        items.map((item, idx) => (
          <ItemCardWrapper
            key={item.id}
            title={config.getTitle(item)}
            subtitle={config.getSubtitle(item)}
            isVisible={item.isVisible}
            onToggleVisibility={() => toggleItemVisibility(targetKey, item.id)}
            onRemove={() => removeSectionItem(targetKey, item.id)}
            onMoveUp={() => reorderSectionItems(targetKey, idx, idx - 1)}
            onMoveDown={() => reorderSectionItems(targetKey, idx, idx + 1)}
            canMoveUp={idx > 0}
            canMoveDown={idx < items.length - 1}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {config.fields.map((field) => (
                <div
                  key={field.key}
                  className={field.fullWidth ? "sm:col-span-2" : undefined}
                >
                  <label className={labelClass}>{field.label}</label>
                  <input
                    type="text"
                    value={String(item[field.key] ?? "")}
                    onChange={(e) =>
                      updateSectionItem(targetKey, item.id, {
                        [field.key]: e.target.value,
                      })
                    }
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
            {config.hasBullets && item.bullets ? (
              <BulletListEditor
                sectionKey={targetKey}
                itemId={item.id}
                bullets={item.bullets}
                roleContext={{
                  companyOrProject: String(
                    item.company ?? item.name ?? item.title ?? ""
                  ),
                  roleOrPosition: String(
                    item.position ?? item.subtitle ?? ""
                  ),
                }}
              />
            ) : null}
          </ItemCardWrapper>
        ))
      )}

      <button
        type="button"
        onClick={() => addSectionItem(targetKey)}
        className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {config.addLabel}
      </button>
    </div>
  );
}
