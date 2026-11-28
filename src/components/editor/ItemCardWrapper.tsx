"use client";

import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from "lucide-react";

interface ItemCardWrapperProps {
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
}

export function ItemCardWrapper({
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
}: ItemCardWrapperProps) {
  return (
    <div
      className={`border border-ui-border rounded-lg p-3 bg-ui-card transition-opacity ${
        isVisible ? "" : "opacity-50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 pb-2 mb-2.5 border-b border-ui-divider">
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-ui-text truncate">
            {title || "(Belum diisi)"}
          </div>
          {subtitle ? (
            <div className="text-[11px] text-ui-text-secondary truncate">
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
            className="p-1 text-ui-text-secondary hover:text-ui-text disabled:opacity-30 rounded hover:bg-ui-subtle"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            title="Turunkan item"
            className="p-1 text-ui-text-secondary hover:text-ui-text disabled:opacity-30 rounded hover:bg-ui-subtle"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleVisibility}
            title={isVisible ? "Sembunyikan item dari CV" : "Tampilkan item"}
            className="p-1 text-ui-text-secondary hover:text-ui-text rounded hover:bg-ui-subtle"
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
            className="p-1 text-ui-text-placeholder hover:text-ui-error rounded hover:bg-ui-subtle"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
