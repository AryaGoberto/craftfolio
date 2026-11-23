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
