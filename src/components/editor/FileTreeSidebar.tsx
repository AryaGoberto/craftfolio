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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowUpDown,
  ChevronDown,
  Copy,
  Download,
  FilePlus,
  FileText,
  GripVertical,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  syncFileOrder,
  syncOpenTabs,
  useResumeStore,
  type FileSortBy,
} from "@/store/use-resume-store";

interface ContextMenuState {
  docId: string;
  top: number;
  left: number;
}

function SortableFileRow({
  docId,
  title,
  isActive,
  isOpenInTab,
  isRenaming,
  draftTitle,
  onDraftTitleChange,
  onCommitRename,
  onCancelRename,
  onSelect,
  onStartRename,
  onOpenMenu,
}: {
  docId: string;
  title: string;
  isActive: boolean;
  isOpenInTab: boolean;
  isRenaming: boolean;
  draftTitle: string;
  onDraftTitleChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onSelect: () => void;
  onStartRename: () => void;
  onOpenMenu: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
  } = useSortable({ id: docId, disabled: isRenaming });

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
      className={`group flex items-center gap-1 rounded-md px-1.5 py-1.5 text-[12.5px] transition-colors ${
        isDragging ? "shadow-md z-20 opacity-90" : ""
      } ${
        isActive
          ? "bg-[#18181B] text-white font-medium"
          : "text-[#52525B] hover:bg-[#E4E4E7]/70 hover:text-[#09090B]"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Seret urutan ${title || "Tanpa Judul"}`}
        title="Seret untuk ubah urutan file"
        className={`p-0.5 rounded cursor-grab active:cursor-grabbing shrink-0 transition-opacity ${
          isActive
            ? "text-[#A1A1AA] hover:text-white opacity-70 group-hover:opacity-100"
            : "text-[#A1A1AA] hover:text-[#52525B] opacity-0 group-hover:opacity-100 focus:opacity-100"
        }`}
      >
        <GripVertical className="w-3 h-3" />
      </button>

      {isRenaming ? (
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <FileText
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive ? "text-[#D4D4D8]" : "text-[#52525B]"
            }`}
          />
          <input
            ref={inputRef}
            type="text"
            value={draftTitle}
            onChange={(e) => onDraftTitleChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
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
            aria-label="Ubah nama file CV"
            className="w-full h-6 px-1.5 text-[12px] font-normal text-[#09090B] bg-white border border-[#18181B] rounded focus:outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onStartRename();
          }}
          onKeyDown={(e) => {
            if (e.key === "F2") {
              e.preventDefault();
              onStartRename();
            }
          }}
          className="flex items-center gap-1.5 min-w-0 flex-1 text-left"
          title={title || "Tanpa Judul"}
        >
          <FileText
            className={`w-3.5 h-3.5 shrink-0 ${
              isActive ? "text-[#E4E4E7]" : "text-[#52525B]"
            }`}
          />
          <span className="truncate flex-1">{title || "Tanpa Judul"}</span>
          {isOpenInTab && !isActive && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-[#71717A] shrink-0"
              title="Terbuka di tab lembar kerja"
            />
          )}
        </button>
      )}

      {!isRenaming && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMenu(e);
          }}
          aria-label={`Menu aksi untuk ${title || "Tanpa Judul"}`}
          title="Aksi file"
          className={`p-1 rounded shrink-0 transition-colors ${
            isActive
              ? "text-[#D4D4D8] hover:text-white hover:bg-white/15"
              : "text-[#A1A1AA] hover:text-[#09090B] hover:bg-white/80 opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function FileTreeSidebar() {
  const isFileTreeOpen = useResumeStore((s) => s.isFileTreeOpen);
  const toggleFileTree = useResumeStore((s) => s.toggleFileTree);
  const documents = useResumeStore((s) => s.documents);
  const activeDocumentId = useResumeStore((s) => s.activeDocumentId);
  const openTabIds = useResumeStore((s) => s.openTabIds);
  const fileOrder = useResumeStore((s) => s.fileOrder);
  const openTab = useResumeStore((s) => s.openTab);
  const createDocument = useResumeStore((s) => s.createDocument);
  const duplicateDocument = useResumeStore((s) => s.duplicateDocument);
  const renameDocument = useResumeStore((s) => s.renameDocument);
  const deleteDocument = useResumeStore((s) => s.deleteDocument);
  const reorderFiles = useResumeStore((s) => s.reorderFiles);
  const sortFiles = useResumeStore((s) => s.sortFiles);
  const exportResumeJson = useResumeStore((s) => s.exportResumeJson);
  const importResumeJson = useResumeStore((s) => s.importResumeJson);

  const [sortBy, setSortBy] = useState<FileSortBy>("updatedAt");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orderedIds = useMemo(
    () => syncFileOrder(fileOrder, documents),
    [fileOrder, documents]
  );

  const openTabSet = useMemo(
    () => new Set(syncOpenTabs(openTabIds, documents, activeDocumentId)),
    [openTabIds, documents, activeDocumentId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!contextMenu) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    const handleClose = () => setContextMenu(null);

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleClose);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleClose);
    };
  }, [contextMenu]);

  if (!isFileTreeOpen) return null;

  const totalDocs = orderedIds.length;
  const menuTargetDoc = contextMenu ? documents[contextMenu.docId] : undefined;

  const showError = (message: string) => {
    setImportError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setImportError(null), 4000);
  };

  const handleToggleSort = () => {
    const nextSort: FileSortBy = sortBy === "title" ? "updatedAt" : "title";
    setSortBy(nextSort);
    sortFiles(nextSort);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = orderedIds.indexOf(String(active.id));
    const newIdx = orderedIds.indexOf(String(over.id));
    if (oldIdx !== -1 && newIdx !== -1) {
      reorderFiles(oldIdx, newIdx);
    }
  };

  const handleStartRename = (id: string) => {
    const doc = documents[id];
    if (!doc) return;
    setContextMenu(null);
    setRenamingId(id);
    setDraftTitle(doc.title);
  };

  const handleCommitRename = () => {
    if (!renamingId) return;
    const trimmed = draftTitle.trim();
    renameDocument(renamingId, trimmed || "Tanpa Judul");
    setRenamingId(null);
  };

  const handleDownloadJson = (id: string) => {
    const target = documents[id];
    if (!target) return;
    const json = exportResumeJson(id);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${target.title.replace(/[^a-zA-Z0-9_-]+/g, "_") || "cv"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setContextMenu(null);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = importResumeJson(text);
    if (!res.ok) {
      showError(res.error || "Gagal mengimpor file JSON.");
    }
    e.target.value = "";
    setContextMenu(null);
  };

  const handleOpenContextMenu = (
    docId: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (contextMenu?.docId === docId) {
      setContextMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 232;
    const menuWidth = 176;
    const top = Math.min(rect.bottom + 4, window.innerHeight - menuHeight - 8);
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 8);
    setContextMenu({
      docId,
      top: Math.max(8, top),
      left: Math.max(8, left),
    });
  };

  const handleSelectFile = (docId: string) => {
    openTab(docId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      toggleFileTree(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        onClick={() => toggleFileTree(false)}
        aria-hidden="true"
        className="fixed inset-0 bg-black/20 z-30 lg:hidden"
      />

      <aside
        aria-label="File Tree CV"
        className="fixed inset-y-0 left-0 z-40 lg:static lg:z-auto w-60 bg-[#F4F4F5] border-r border-[#E4E4E7] flex flex-col h-full shrink-0 select-none shadow-lg lg:shadow-none"
      >
        {/* Header */}
        <div className="h-9 px-2.5 border-b border-[#E4E4E7] bg-[#FAFAFA] flex items-center justify-between gap-1 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <ChevronDown className="w-3.5 h-3.5 text-[#52525B] shrink-0" />
            <span className="text-[12px] font-semibold text-[#09090B] tracking-tight truncate">
              File tree
            </span>
            <span className="text-[10.5px] font-medium text-[#71717A] tabular-nums">
              ({totalDocs})
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => createDocument(`CV Baru ${totalDocs + 1}`)}
              title="Buat file CV baru"
              aria-label="Buat file CV baru"
              className="w-6 h-6 inline-flex items-center justify-center rounded text-[#52525B] hover:text-[#09090B] hover:bg-[#E4E4E7]/70 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToggleSort}
              title={
                sortBy === "title"
                  ? "Urutkan berdasarkan terbaru diubah"
                  : "Urutkan berdasarkan nama (A-Z)"
              }
              aria-label="Urutkan daftar file CV"
              className="w-6 h-6 inline-flex items-center justify-center rounded text-[#52525B] hover:text-[#09090B] hover:bg-[#E4E4E7]/70 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Upload / Import file .json"
              aria-label="Upload file JSON CV"
              className="w-6 h-6 inline-flex items-center justify-center rounded text-[#52525B] hover:text-[#09090B] hover:bg-[#E4E4E7]/70 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => toggleFileTree(false)}
              title="Tutup File Tree (Ctrl+B)"
              aria-label="Tutup File Tree Sidebar"
              className="w-6 h-6 inline-flex items-center justify-center rounded text-[#52525B] hover:text-[#09090B] hover:bg-[#E4E4E7]/70 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* File List */}
        <div
          className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
          onScroll={() => {
            if (contextMenu) setContextMenu(null);
          }}
        >
          <DndContext
            id="file-tree-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedIds}
              strategy={verticalListSortingStrategy}
            >
              {orderedIds.map((id) => {
                const doc = documents[id];
                if (!doc) return null;
                return (
                  <SortableFileRow
                    key={id}
                    docId={id}
                    title={doc.title}
                    isActive={id === activeDocumentId}
                    isOpenInTab={openTabSet.has(id)}
                    isRenaming={renamingId === id}
                    draftTitle={draftTitle}
                    onDraftTitleChange={setDraftTitle}
                    onCommitRename={handleCommitRename}
                    onCancelRename={() => setRenamingId(null)}
                    onSelect={() => handleSelectFile(id)}
                    onStartRename={() => handleStartRename(id)}
                    onOpenMenu={(e) => handleOpenContextMenu(id, e)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="px-2.5 py-2 border-t border-[#E4E4E7] bg-[#FAFAFA] shrink-0">
          {importError ? (
            <p className="text-[11px] text-[#EF4444] leading-snug">
              {importError}
            </p>
          ) : (
            <div className="flex items-center justify-between text-[10.5px] text-[#71717A]">
              <span>Klik ganda untuk rename</span>
              <span className="font-mono">Ctrl+B</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleImportFile}
          className="hidden"
        />
      </aside>

      {/* Fixed Context Menu (prevents clipping by sidebar scroll container) */}
      {contextMenu && menuTargetDoc && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: contextMenu.top, left: contextMenu.left }}
          className="fixed w-44 bg-white border border-[#E4E4E7] rounded-lg shadow-xl py-1 z-50 text-[12px]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleStartRename(menuTargetDoc.id)}
            className="w-full text-left px-3 py-1.5 hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
          >
            <Pencil className="w-3.5 h-3.5 text-[#52525B]" />
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              duplicateDocument(menuTargetDoc.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
          >
            <Copy className="w-3.5 h-3.5 text-[#52525B]" />
            Duplikasi CV
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDownloadJson(menuTargetDoc.id)}
            className="w-full text-left px-3 py-1.5 hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
          >
            <Download className="w-3.5 h-3.5 text-[#52525B]" />
            Download (.json)
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={totalDocs <= 1}
            onClick={() => {
              deleteDocument(menuTargetDoc.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#FEF2F2] disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-2 text-[#EF4444]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

          <div className="my-1 border-t border-[#F4F4F5]" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              createDocument(`CV Baru ${totalDocs + 1}`);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#52525B]" />
            New file
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setContextMenu(null);
              fileInputRef.current?.click();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-[#F4F4F5] flex items-center gap-2 text-[#09090B]"
          >
            <Upload className="w-3.5 h-3.5 text-[#52525B]" />
            Upload (.json)
          </button>
        </div>
      )}
    </>
  );
}
