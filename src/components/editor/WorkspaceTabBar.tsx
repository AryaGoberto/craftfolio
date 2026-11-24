"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, PanelLeft, Plus, X } from "lucide-react";
import { syncOpenTabs, useResumeStore } from "@/store/use-resume-store";

function SortableTabItem({
  tabId,
  title,
  isActive,
  canClose,
  isRenaming,
  draftTitle,
  onDraftTitleChange,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onSelect,
  onClose,
}: {
  tabId: string;
  title: string;
  isActive: boolean;
  canClose: boolean;
  isRenaming: boolean;
  draftTitle: string;
  onDraftTitleChange: (value: string) => void;
  onStartRename: () => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onSelect: () => void;
  onClose: () => void;
}) {
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tabId, disabled: isRenaming });

  useEffect(() => {
    if (isRenaming) {
      cancelledRef.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={onSelect}
      onAuxClick={(e) => {
        if (e.button === 1 && canClose) {
          e.preventDefault();
          onClose();
        }
      }}
      onKeyDown={(e) => {
        if (isRenaming) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      title={title || "Tanpa Judul"}
      className={`group flex items-center gap-1.5 rounded-t-md text-[12px] shrink-0 transition-colors cursor-pointer ${
        isDragging ? "shadow-md z-30 opacity-90" : ""
      } ${
        isActive
          ? "bg-white text-[#09090B] font-medium border-t border-x border-[#E4E4E7] -mb-px h-[32px] px-3 z-10"
          : "bg-[#E4E4E7]/50 hover:bg-[#E4E4E7]/90 text-[#52525B] hover:text-[#09090B] h-[28px] mb-0.5 px-2.5"
      }`}
    >
      <FileText
        className={`w-3.5 h-3.5 shrink-0 ${
          isActive ? "text-[#18181B]" : "text-[#71717A]"
        }`}
      />

      {isRenaming ? (
        <input
          ref={inputRef}
          type="text"
          value={draftTitle}
          onChange={(e) => onDraftTitleChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onCommitRename();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelledRef.current = true;
              onCancelRename();
            }
          }}
          onBlur={() => {
            if (!cancelledRef.current) {
              onCommitRename();
            }
          }}
          aria-label="Ubah nama tab CV"
          className="w-28 h-5 px-1 text-[12px] font-normal text-[#09090B] bg-white border border-[#18181B] rounded focus:outline-none"
        />
      ) : (
        <span
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartRename();
          }}
          className="max-w-[150px] truncate"
        >
          {title || "Tanpa Judul"}
        </span>
      )}

      {canClose && !isRenaming && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label={`Tutup tab ${title || "Tanpa Judul"}`}
          title="Tutup tab (file tetap tersimpan di File Tree)"
          className={`p-0.5 rounded transition-colors ${
            isActive
              ? "text-[#71717A] hover:text-[#09090B] hover:bg-[#F4F4F5]"
              : "text-[#71717A] hover:text-[#09090B] hover:bg-white/70 opacity-60 group-hover:opacity-100"
          }`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function WorkspaceTabBar() {
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const openTabIds = useResumeStore((s) => s.openTabIds);
  const isFileTreeOpen = useResumeStore((s) => s.isFileTreeOpen);
  const toggleFileTree = useResumeStore((s) => s.toggleFileTree);
  const setActiveDocument = useResumeStore((s) => s.setActiveDocument);
  const closeTab = useResumeStore((s) => s.closeTab);
  const reorderTabs = useResumeStore((s) => s.reorderTabs);
  const createDocument = useResumeStore((s) => s.createDocument);
  const renameDocument = useResumeStore((s) => s.renameDocument);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const validOpenTabs = useMemo(
    () => syncOpenTabs(openTabIds, documents, activeDocumentId),
    [openTabIds, documents, activeDocumentId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = validOpenTabs.indexOf(String(active.id));
    const newIndex = validOpenTabs.indexOf(String(over.id));
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderTabs(oldIndex, newIndex);
    }
  };

  const handleStartRename = (id: string) => {
    const doc = documents[id];
    if (!doc) return;
    setRenamingId(id);
    setDraftTitle(doc.title);
  };

  const handleCommitRename = () => {
    if (!renamingId) return;
    const trimmed = draftTitle.trim();
    renameDocument(renamingId, trimmed || "Tanpa Judul");
    setRenamingId(null);
  };

  const totalDocs = Object.keys(documents).length;

  return (
    <div
      role="tablist"
      aria-label="Tab lembar kerja CV"
      className="h-9 bg-[#F4F4F5] border-b border-[#E4E4E7] flex items-end px-2 gap-1 overflow-x-auto shrink-0 select-none"
    >
      {!isFileTreeOpen && (
        <button
          type="button"
          onClick={() => toggleFileTree(true)}
          title="Buka File Tree Sidebar (Ctrl+B)"
          aria-label="Buka File Tree Sidebar"
          className="h-7 w-7 mb-1 mr-0.5 inline-flex items-center justify-center rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#E4E4E7]/80 shrink-0 transition-colors"
        >
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
      )}

      <DndContext
        id="workspace-tabs-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={validOpenTabs}
          strategy={horizontalListSortingStrategy}
        >
          {validOpenTabs.map((tabId) => {
            const doc = documents[tabId];
            if (!doc) return null;
            return (
              <SortableTabItem
                key={tabId}
                tabId={tabId}
                title={doc.title}
                isActive={tabId === activeDocumentId}
                canClose={validOpenTabs.length > 1}
                isRenaming={renamingId === tabId}
                draftTitle={draftTitle}
                onDraftTitleChange={setDraftTitle}
                onStartRename={() => handleStartRename(tabId)}
                onCommitRename={handleCommitRename}
                onCancelRename={() => setRenamingId(null)}
                onSelect={() => setActiveDocument(tabId)}
                onClose={() => closeTab(tabId)}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => createDocument(`CV Baru ${totalDocs + 1}`)}
        title="Buat & buka tab CV baru"
        aria-label="Buat dan buka tab CV baru"
        className="h-7 w-7 mb-1 ml-0.5 inline-flex items-center justify-center rounded-md text-[#52525B] hover:text-[#09090B] hover:bg-[#E4E4E7]/80 shrink-0 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
