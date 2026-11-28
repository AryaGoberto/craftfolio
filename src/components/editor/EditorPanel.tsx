"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileText,
  FolderGit2,
  GraduationCap,
  GripVertical,
  Plus,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
  User,
  Wrench,
} from "lucide-react";
import { useStore } from "zustand";
import type { SectionKey } from "@/lib/schemas/resume";
import { EDITOR_SECTION_LABELS } from "@/lib/i18n";
import { useResumeStore } from "@/store/use-resume-store";
import { BasicsForm } from "@/components/editor/BasicsForm";
import { SectionBodyForm } from "@/components/editor/SectionForms";

function SectionIcon({ sectionKey }: { sectionKey: SectionKey }) {
  if (sectionKey === "summary") return <FileText className="w-3.5 h-3.5" />;
  if (sectionKey === "experience" || sectionKey === "volunteering")
    return <Briefcase className="w-3.5 h-3.5" />;
  if (sectionKey === "education")
    return <GraduationCap className="w-3.5 h-3.5" />;
  if (sectionKey === "projects") return <FolderGit2 className="w-3.5 h-3.5" />;
  if (sectionKey === "skills") return <Wrench className="w-3.5 h-3.5" />;
  return <Sparkles className="w-3.5 h-3.5" />;
}

function SortableSectionCard({
  sectionKey,
  title,
  subtitle,
  isVisible,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onRemoveCustom,
  badge,
  children,
}: {
  sectionKey: SectionKey;
  title: string;
  subtitle?: string;
  isVisible: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemoveCustom?: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-ui-card border border-ui-border rounded-lg transition-shadow ${
        isDragging ? "shadow-lg z-20" : ""
      } ${isVisible ? "" : "opacity-60"}`}
    >
      <div className="px-3.5 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            title="Seret untuk ubah urutan"
            className="text-ui-text-placeholder hover:text-ui-text-secondary cursor-grab active:cursor-grabbing p-0.5 shrink-0"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
          >
            <span className="w-7 h-7 rounded-md bg-ui-primary-soft text-ui-link-soft-text flex items-center justify-center shrink-0">
              <SectionIcon sectionKey={sectionKey} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-ui-text truncate">
                  {title}
                </span>
                {badge}
              </div>
              {!isExpanded && subtitle && (
                <p className="text-[11px] text-ui-text-secondary truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-ui-text-secondary shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-ui-text-secondary shrink-0" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            title="Pindah ke atas"
            className="p-1 text-ui-text-placeholder hover:text-ui-text disabled:opacity-25 rounded hover:bg-ui-subtle"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            title="Pindah ke bawah"
            className="p-1 text-ui-text-placeholder hover:text-ui-text disabled:opacity-25 rounded hover:bg-ui-subtle"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleVisibility}
            title={isVisible ? "Sembunyikan bagian" : "Tampilkan bagian"}
            className="p-1 text-ui-text-secondary hover:text-ui-text rounded hover:bg-ui-subtle"
          >
            {isVisible ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </button>
          {onRemoveCustom && (
            <button
              type="button"
              onClick={onRemoveCustom}
              title="Hapus section kustom"
              className="p-1 text-ui-text-placeholder hover:text-ui-error rounded hover:bg-ui-subtle"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-2 border-t border-ui-divider">
          {children}
        </div>
      )}
    </div>
  );
}

export function EditorPanel() {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const activeSection = useResumeStore((s) => s.activeSection);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const reorderSections = useResumeStore((s) => s.reorderSections);
  const moveSection = useResumeStore((s) => s.moveSection);
  const toggleSectionVisibility = useResumeStore(
    (s) => s.toggleSectionVisibility
  );
  const addCustomSection = useResumeStore((s) => s.addCustomSection);
  const removeCustomSection = useResumeStore((s) => s.removeCustomSection);

  const pastStates = useStore(useResumeStore.temporal, (s) => s.pastStates);
  const futureStates = useStore(useResumeStore.temporal, (s) => s.futureStates);
  const undo = useStore(useResumeStore.temporal, (s) => s.undo);
  const redo = useStore(useResumeStore.temporal, (s) => s.redo);

  const [basicsExpanded, setBasicsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    experience: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const doc = documents[activeDocumentId];
  if (!doc) return null;

  const isSectionExpanded = (key: SectionKey) =>
    expandedSections[key] ?? activeSection === key;

  const toggleExpand = (key: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [key]: !(prev[key] ?? activeSection === key),
    }));
    setActiveSection(key);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const order = doc.config.sectionOrder;
    const oldIdx = order.indexOf(active.id as SectionKey);
    const newIdx = order.indexOf(over.id as SectionKey);
    if (oldIdx !== -1 && newIdx !== -1) {
      reorderSections(arrayMove(order, oldIdx, newIdx));
    }
  };

  const getSectionMeta = (key: SectionKey) => {
    if (key === "summary") {
      const words = doc.basics.summary.text.trim()
        ? doc.basics.summary.text.trim().split(/\s+/).length
        : 0;
      const isIdeal = words >= 30 && words <= 60;
      return {
        title: "Ringkasan Profesional",
        subtitle: doc.basics.summary.text.slice(0, 60),
        isVisible: doc.basics.summary.isVisible,
        badge: (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              isIdeal
                ? "bg-ui-success-bg text-ui-success"
                : "bg-ui-subtle text-ui-text-secondary"
            }`}
          >
            {words} kata {isIdeal ? "(Ideal)" : ""}
          </span>
        ),
      };
    }

    if (key.startsWith("custom:")) {
      const id = key.replace("custom:", "");
      const custom = doc.sections.customSections.find((c) => c.id === id);
      if (custom) {
        return {
          title: custom.title.trim() || "Sertifikasi",
          subtitle: custom.items[0]?.title || "",
          isVisible: custom.isVisible,
        };
      }
      return {
        title: "Sertifikasi",
        subtitle: "",
        isVisible: true,
      };
    }

    const builtinKey = key as Exclude<SectionKey, `custom:${string}` | "summary">;
    const label = EDITOR_SECTION_LABELS[builtinKey];
    const group = doc.sections[builtinKey];
    let subtitle = "";
    if (builtinKey === "experience" || builtinKey === "volunteering") {
      const first = doc.sections[builtinKey].items[0];
      if (first) subtitle = `${first.company} — ${first.position}`;
    } else if (builtinKey === "education") {
      const first = doc.sections.education.items[0];
      if (first) subtitle = `${first.institution} — ${first.degree}`;
    } else if (builtinKey === "projects") {
      const first = doc.sections.projects.items[0];
      if (first) subtitle = first.name;
    } else if (builtinKey === "skills") {
      subtitle = doc.sections.skills.items.map((s) => s.category).join(", ");
    }

    return {
      title: label,
      subtitle,
      isVisible: group.isVisible,
    };
  };

  const activeCount =
    1 +
    doc.config.sectionOrder.filter((k) => getSectionMeta(k).isVisible).length;

  return (
    <aside className="w-full lg:w-[480px] xl:w-[520px] shrink-0 bg-ui-panel border-r border-ui-border h-full overflow-y-auto p-4 sm:p-5 space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-ui-primary" />
          <h2 className="text-[11px] font-semibold tracking-wider uppercase text-ui-text">
            Struktur Dokumen
          </h2>
          <span className="px-2 py-0.5 rounded bg-ui-subtle border border-ui-border text-[10.5px] font-medium text-ui-text-secondary">
            {activeCount} Bagian Aktif
          </span>
        </div>
        <div className="inline-flex items-center gap-0.5">
          <button
            type="button"
            disabled={pastStates.length === 0}
            onClick={() => undo()}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-border/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={futureStates.length === 0}
            onClick={() => redo()}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
            className="w-7 h-7 inline-flex items-center justify-center rounded-md text-ui-text-secondary hover:text-ui-text hover:bg-ui-border/60 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Personal Info Card (Fixed at top) */}
      <div className="bg-ui-card border border-ui-border rounded-lg">
        <button
          type="button"
          onClick={() => setBasicsExpanded((v) => !v)}
          className="w-full px-3.5 py-3 flex items-center justify-between gap-2 text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-md bg-ui-primary-soft text-ui-link-soft-text flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </span>
            <span className="text-[13px] font-semibold text-ui-text">
              Informasi Pribadi
            </span>
          </div>
          {basicsExpanded ? (
            <ChevronUp className="w-4 h-4 text-ui-text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-ui-text-secondary" />
          )}
        </button>

        {basicsExpanded && (
          <div className="px-3.5 pb-3.5 pt-2 border-t border-ui-divider">
            <BasicsForm />
          </div>
        )}
      </div>

      {/* Reorderable Section Cards */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={doc.config.sectionOrder}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {doc.config.sectionOrder.map((key, idx) => {
              const meta = getSectionMeta(key);
              const isCustom = key.startsWith("custom:");
              return (
                <SortableSectionCard
                  key={key}
                  sectionKey={key}
                  title={meta.title}
                  subtitle={meta.subtitle}
                  isVisible={meta.isVisible}
                  isExpanded={isSectionExpanded(key)}
                  onToggleExpand={() => toggleExpand(key)}
                  onToggleVisibility={() => toggleSectionVisibility(key)}
                  onMoveUp={() => moveSection(key, "up")}
                  onMoveDown={() => moveSection(key, "down")}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < doc.config.sectionOrder.length - 1}
                  onRemoveCustom={
                    isCustom
                      ? () => removeCustomSection(key.replace("custom:", ""))
                      : undefined
                  }
                  badge={meta.badge}
                >
                  <SectionBodyForm sectionKey={key} />
                </SortableSectionCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Custom Section Button */}
      <button
        type="button"
        onClick={() => addCustomSection("Sertifikasi")}
        className="w-full h-10 rounded-lg border border-dashed border-ui-border-strong bg-ui-card hover:border-ui-primary text-[12px] font-medium text-ui-text-secondary hover:text-ui-text inline-flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Tambah Section (Sertifikasi / Kustom)
      </button>
    </aside>
  );
}
