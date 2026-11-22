"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  BulletPoint,
  BuiltinSectionKey,
  SectionKey,
} from "@/lib/schemas/resume";
import { useResumeStore } from "@/store/use-resume-store";

const inputClass =
  "w-full h-[34px] px-2.5 text-[13px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B] placeholder:text-[#A1A1AA]";
const labelClass = "block text-[11px] font-medium text-[#52525B] mb-1";

function BulletListEditor({
  sectionKey,
  itemId,
  bullets,
}: {
  sectionKey: BuiltinSectionKey | `custom:${string}`;
  itemId: string;
  bullets: BulletPoint[];
}) {
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

function ItemCardWrapper({
  title,
  subtitle,
  isVisible,
  onToggleVisibility,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  children,
}: {
  title: string;
  subtitle?: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`border border-[#E4E4E7] rounded-lg p-3 bg-white transition-opacity ${
        isVisible ? "" : "opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 pb-2 mb-2.5 border-b border-[#F4F4F5]">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-[#09090B] truncate">
            {title || "(Belum diisi)"}
          </div>
          {subtitle ? (
            <div className="text-[11px] text-[#52525B] truncate">
              {subtitle}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            title="Naikkan item"
            className="p-1 text-[#52525B] hover:text-[#09090B] disabled:opacity-30 rounded hover:bg-[#F4F4F5]"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            title="Turunkan item"
            className="p-1 text-[#52525B] hover:text-[#09090B] disabled:opacity-30 rounded hover:bg-[#F4F4F5]"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleVisibility}
            title={isVisible ? "Sembunyikan item dari CV" : "Tampilkan item"}
            className="p-1 text-[#52525B] hover:text-[#09090B] rounded hover:bg-[#F4F4F5]"
          >
            {isVisible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onRemove}
            title="Hapus item"
            className="p-1 text-[#A1A1AA] hover:text-[#EF4444] rounded hover:bg-[#F4F4F5]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}

export function SectionBodyForm({ sectionKey }: { sectionKey: SectionKey }) {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const updateSummary = useResumeStore((s) => s.updateSummary);
  const addSectionItem = useResumeStore((s) => s.addSectionItem);
  const updateSectionItem = useResumeStore((s) => s.updateSectionItem);
  const removeSectionItem = useResumeStore((s) => s.removeSectionItem);
  const toggleItemVisibility = useResumeStore((s) => s.toggleItemVisibility);
  const reorderSectionItems = useResumeStore((s) => s.reorderSectionItems);

  const doc = documents[activeDocumentId];
  if (!doc) return null;

  if (sectionKey === "summary") {
    return (
      <div>
        <label className={labelClass}>
          Ringkasan Profil (rekomendasi 30–60 kata)
        </label>
        <textarea
          rows={4}
          value={doc.basics.summary.text}
          onChange={(e) => updateSummary({ text: e.target.value })}
          placeholder="Tulis ringkasan singkat mengenai keahlian inti, pengalaman, dan fokus karier Anda..."
          className="w-full p-2.5 text-[13px] text-[#09090B] bg-white border border-[#E4E4E7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#18181B] placeholder:text-[#A1A1AA]"
        />
      </div>
    );
  }

  if (sectionKey.startsWith("custom:")) {
    const customId = sectionKey.replace("custom:", "");
    const custom = doc.sections.customSections.find((cs) => cs.id === customId);
    if (!custom) return null;

    return (
      <div className="space-y-3">
        {custom.items.length === 0 ? (
          <div className="border border-dashed border-[#E4E4E7] rounded-lg p-4 text-center text-[12px] text-[#52525B]">
            Belum ada item di bagian ini.
          </div>
        ) : (
          custom.items.map((item, idx) => (
            <ItemCardWrapper
              key={item.id}
              title={item.title}
              subtitle={item.date}
              isVisible={item.isVisible}
              onToggleVisibility={() =>
                toggleItemVisibility(sectionKey, item.id)
              }
              onRemove={() => removeSectionItem(sectionKey, item.id)}
              onMoveUp={() =>
                reorderSectionItems(sectionKey, idx, idx - 1)
              }
              onMoveDown={() =>
                reorderSectionItems(sectionKey, idx, idx + 1)
              }
              canMoveUp={idx > 0}
              canMoveDown={idx < custom.items.length - 1}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Judul Item</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      updateSectionItem(sectionKey, item.id, {
                        title: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Subjudul / Penerbit</label>
                  <input
                    type="text"
                    value={item.subtitle ?? ""}
                    onChange={(e) =>
                      updateSectionItem(sectionKey, item.id, {
                        subtitle: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Tanggal / Tahun</label>
                  <input
                    type="text"
                    value={item.date ?? ""}
                    onChange={(e) =>
                      updateSectionItem(sectionKey, item.id, {
                        date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <BulletListEditor
                sectionKey={sectionKey}
                itemId={item.id}
                bullets={item.bullets}
              />
            </ItemCardWrapper>
          ))
        )}

        <button
          type="button"
          onClick={() => addSectionItem(sectionKey)}
          className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Item
        </button>
      </div>
    );
  }

  const builtinKey = sectionKey as BuiltinSectionKey;

  switch (builtinKey) {
    case "experience":
    case "volunteering": {
      const items = doc.sections[builtinKey].items;
      return (
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="border border-dashed border-[#E4E4E7] rounded-lg p-4 text-center text-[12px] text-[#52525B]">
              Belum ada data pengalaman.
            </div>
          ) : (
            items.map((item, idx) => (
              <ItemCardWrapper
                key={item.id}
                title={[item.company, item.position]
                  .filter(Boolean)
                  .join(" — ")}
                subtitle={[item.startDate, item.endDate]
                  .filter(Boolean)
                  .join(" – ")}
                isVisible={item.isVisible}
                onToggleVisibility={() =>
                  toggleItemVisibility(builtinKey, item.id)
                }
                onRemove={() => removeSectionItem(builtinKey, item.id)}
                onMoveUp={() =>
                  reorderSectionItems(builtinKey, idx, idx - 1)
                }
                onMoveDown={() =>
                  reorderSectionItems(builtinKey, idx, idx + 1)
                }
                canMoveUp={idx > 0}
                canMoveDown={idx < items.length - 1}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelClass}>Perusahaan / Organisasi</label>
                    <input
                      type="text"
                      value={item.company}
                      onChange={(e) =>
                        updateSectionItem(builtinKey, item.id, {
                          company: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Posisi / Peran</label>
                    <input
                      type="text"
                      value={item.position}
                      onChange={(e) =>
                        updateSectionItem(builtinKey, item.id, {
                          position: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tanggal Mulai</label>
                    <input
                      type="text"
                      value={item.startDate}
                      onChange={(e) =>
                        updateSectionItem(builtinKey, item.id, {
                          startDate: e.target.value,
                        })
                      }
                      placeholder="Jan 2023"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Tanggal Selesai</label>
                    <input
                      type="text"
                      value={item.endDate}
                      onChange={(e) =>
                        updateSectionItem(builtinKey, item.id, {
                          endDate: e.target.value,
                        })
                      }
                      placeholder="Present"
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Lokasi (opsional)</label>
                    <input
                      type="text"
                      value={item.location ?? ""}
                      onChange={(e) =>
                        updateSectionItem(builtinKey, item.id, {
                          location: e.target.value,
                        })
                      }
                      placeholder="Jakarta, Indonesia"
                      className={inputClass}
                    />
                  </div>
                </div>
                <BulletListEditor
                  sectionKey={builtinKey}
                  itemId={item.id}
                  bullets={item.bullets}
                />
              </ItemCardWrapper>
            ))
          )}
          <button
            type="button"
            onClick={() => addSectionItem(builtinKey)}
            className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Pengalaman
          </button>
        </div>
      );
    }

    case "education": {
      const items = doc.sections.education.items;
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <ItemCardWrapper
              key={item.id}
              title={[item.institution, item.degree]
                .filter(Boolean)
                .join(" — ")}
              subtitle={[item.startDate, item.endDate]
                .filter(Boolean)
                .join(" – ")}
              isVisible={item.isVisible}
              onToggleVisibility={() =>
                toggleItemVisibility("education", item.id)
              }
              onRemove={() => removeSectionItem("education", item.id)}
              onMoveUp={() => reorderSectionItems("education", idx, idx - 1)}
              onMoveDown={() =>
                reorderSectionItems("education", idx, idx + 1)
              }
              canMoveUp={idx > 0}
              canMoveDown={idx < items.length - 1}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Institusi / Universitas</label>
                  <input
                    type="text"
                    value={item.institution}
                    onChange={(e) =>
                      updateSectionItem("education", item.id, {
                        institution: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gelar & Jurusan</label>
                  <input
                    type="text"
                    value={item.degree}
                    onChange={(e) =>
                      updateSectionItem("education", item.id, {
                        degree: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tahun Masuk</label>
                  <input
                    type="text"
                    value={item.startDate}
                    onChange={(e) =>
                      updateSectionItem("education", item.id, {
                        startDate: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tahun Lulus</label>
                  <input
                    type="text"
                    value={item.endDate}
                    onChange={(e) =>
                      updateSectionItem("education", item.id, {
                        endDate: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>IPK / GPA (opsional)</label>
                  <input
                    type="text"
                    value={item.gpa ?? ""}
                    onChange={(e) =>
                      updateSectionItem("education", item.id, {
                        gpa: e.target.value,
                      })
                    }
                    placeholder="3.78 / 4.00"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Lokasi (opsional)</label>
                  <input
                    type="text"
                    value={item.location ?? ""}
                    onChange={(e) =>
                      updateSectionItem("education", item.id, {
                        location: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </ItemCardWrapper>
          ))}
          <button
            type="button"
            onClick={() => addSectionItem("education")}
            className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Pendidikan
          </button>
        </div>
      );
    }

    case "projects": {
      const items = doc.sections.projects.items;
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <ItemCardWrapper
              key={item.id}
              title={item.name}
              subtitle={item.techStack}
              isVisible={item.isVisible}
              onToggleVisibility={() =>
                toggleItemVisibility("projects", item.id)
              }
              onRemove={() => removeSectionItem("projects", item.id)}
              onMoveUp={() => reorderSectionItems("projects", idx, idx - 1)}
              onMoveDown={() => reorderSectionItems("projects", idx, idx + 1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < items.length - 1}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Nama Proyek</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      updateSectionItem("projects", item.id, {
                        name: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tech Stack</label>
                  <input
                    type="text"
                    value={item.techStack ?? ""}
                    onChange={(e) =>
                      updateSectionItem("projects", item.id, {
                        techStack: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tahun / Tanggal</label>
                  <input
                    type="text"
                    value={item.date ?? ""}
                    onChange={(e) =>
                      updateSectionItem("projects", item.id, {
                        date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tautan (opsional)</label>
                  <input
                    type="text"
                    value={item.url ?? ""}
                    onChange={(e) =>
                      updateSectionItem("projects", item.id, {
                        url: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
              <BulletListEditor
                sectionKey="projects"
                itemId={item.id}
                bullets={item.bullets}
              />
            </ItemCardWrapper>
          ))}
          <button
            type="button"
            onClick={() => addSectionItem("projects")}
            className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Proyek
          </button>
        </div>
      );
    }

    case "skills": {
      const items = doc.sections.skills.items;
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <ItemCardWrapper
              key={item.id}
              title={item.category || "Kategori Keahlian"}
              subtitle={item.skills}
              isVisible={item.isVisible}
              onToggleVisibility={() => toggleItemVisibility("skills", item.id)}
              onRemove={() => removeSectionItem("skills", item.id)}
              onMoveUp={() => reorderSectionItems("skills", idx, idx - 1)}
              onMoveDown={() => reorderSectionItems("skills", idx, idx + 1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < items.length - 1}
            >
              <div className="space-y-2.5">
                <div>
                  <label className={labelClass}>Kategori</label>
                  <input
                    type="text"
                    value={item.category}
                    onChange={(e) =>
                      updateSectionItem("skills", item.id, {
                        category: e.target.value,
                      })
                    }
                    placeholder="Frontend / Languages / Tools"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    Daftar Keahlian (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={item.skills}
                    onChange={(e) =>
                      updateSectionItem("skills", item.id, {
                        skills: e.target.value,
                      })
                    }
                    placeholder="React, Next.js, TypeScript, Tailwind CSS"
                    className={inputClass}
                  />
                </div>
              </div>
            </ItemCardWrapper>
          ))}
          <button
            type="button"
            onClick={() => addSectionItem("skills")}
            className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Kategori Keahlian
          </button>
        </div>
      );
    }

    case "certifications": {
      const items = doc.sections.certifications.items;
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <ItemCardWrapper
              key={item.id}
              title={item.name}
              subtitle={item.issuer}
              isVisible={item.isVisible}
              onToggleVisibility={() =>
                toggleItemVisibility("certifications", item.id)
              }
              onRemove={() => removeSectionItem("certifications", item.id)}
              onMoveUp={() =>
                reorderSectionItems("certifications", idx, idx - 1)
              }
              onMoveDown={() =>
                reorderSectionItems("certifications", idx, idx + 1)
              }
              canMoveUp={idx > 0}
              canMoveDown={idx < items.length - 1}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nama Sertifikasi</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      updateSectionItem("certifications", item.id, {
                        name: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Penerbit</label>
                  <input
                    type="text"
                    value={item.issuer}
                    onChange={(e) =>
                      updateSectionItem("certifications", item.id, {
                        issuer: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tanggal / Tahun</label>
                  <input
                    type="text"
                    value={item.date}
                    onChange={(e) =>
                      updateSectionItem("certifications", item.id, {
                        date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </ItemCardWrapper>
          ))}
          <button
            type="button"
            onClick={() => addSectionItem("certifications")}
            className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Sertifikasi
          </button>
        </div>
      );
    }

    case "awards": {
      const items = doc.sections.awards.items;
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <ItemCardWrapper
              key={item.id}
              title={item.title}
              subtitle={item.issuer}
              isVisible={item.isVisible}
              onToggleVisibility={() => toggleItemVisibility("awards", item.id)}
              onRemove={() => removeSectionItem("awards", item.id)}
              onMoveUp={() => reorderSectionItems("awards", idx, idx - 1)}
              onMoveDown={() => reorderSectionItems("awards", idx, idx + 1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < items.length - 1}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nama Penghargaan</label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      updateSectionItem("awards", item.id, {
                        title: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Pemberi</label>
                  <input
                    type="text"
                    value={item.issuer ?? ""}
                    onChange={(e) =>
                      updateSectionItem("awards", item.id, {
                        issuer: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tahun</label>
                  <input
                    type="text"
                    value={item.date ?? ""}
                    onChange={(e) =>
                      updateSectionItem("awards", item.id, {
                        date: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </ItemCardWrapper>
          ))}
          <button
            type="button"
            onClick={() => addSectionItem("awards")}
            className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Penghargaan
          </button>
        </div>
      );
    }

    case "languages": {
      const items = doc.sections.languages.items;
      return (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <ItemCardWrapper
              key={item.id}
              title={item.language}
              subtitle={item.proficiency}
              isVisible={item.isVisible}
              onToggleVisibility={() =>
                toggleItemVisibility("languages", item.id)
              }
              onRemove={() => removeSectionItem("languages", item.id)}
              onMoveUp={() => reorderSectionItems("languages", idx, idx - 1)}
              onMoveDown={() => reorderSectionItems("languages", idx, idx + 1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < items.length - 1}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className={labelClass}>Bahasa</label>
                  <input
                    type="text"
                    value={item.language}
                    onChange={(e) =>
                      updateSectionItem("languages", item.id, {
                        language: e.target.value,
                      })
                    }
                    placeholder="English"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tingkat Kemahiran</label>
                  <input
                    type="text"
                    value={item.proficiency}
                    onChange={(e) =>
                      updateSectionItem("languages", item.id, {
                        proficiency: e.target.value,
                      })
                    }
                    placeholder="Professional Working"
                    className={inputClass}
                  />
                </div>
              </div>
            </ItemCardWrapper>
          ))}
          <button
            type="button"
            onClick={() => addSectionItem("languages")}
            className="w-full h-9 rounded-md border border-dashed border-[#D4D4D8] text-[12px] font-medium text-[#52525B] hover:text-[#09090B] hover:border-[#A1A1AA] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Bahasa
          </button>
        </div>
      );
    }
  }
}
