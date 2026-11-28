"use client";

import { useId } from "react";

interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-7 w-auto shrink-0" }: BrandLogoProps) {
  const reactId = useId();
  const maskId = `brand-logo-mask-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 overflow-visible transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <defs>
        <mask id={maskId}>
          <rect width="256" height="256" fill="white" />
          {/* Eyebrow / Baris Dokumen CV */}
          <rect x="60" y="52" width="58" height="14" rx="7" fill="black" />
          {/* Mata Oval */}
          <rect x="81" y="118" width="25" height="36" rx="12.5" fill="black" />
          <rect x="150" y="118" width="25" height="36" rx="12.5" fill="black" />
          {/* Senyum Khas Foldy */}
          <path
            d="M 98.6 177 A 34 34 0 0 0 157.4 177 A 6 6 0 0 0 147 171 A 22 22 0 0 1 109 171 A 6 6 0 0 0 98.6 177 Z"
            fill="black"
          />
        </mask>
      </defs>

      <g>
        {/* Lembar Dokumen Utama Foldy */}
        <path
          mask={`url(#${maskId})`}
          style={{ fill: "var(--foldy-body, #1F7A61)", transition: "fill 200ms ease" }}
          d="M 64 20 H 142 V 68 A 30 30 0 0 0 172 98 H 220 V 208 A 28 28 0 0 1 192 236 H 64 A 28 28 0 0 1 36 208 V 48 A 28 28 0 0 1 64 20 Z"
        />
        {/* Lipatan Origami Sudut Dokumen */}
        <path
          style={{ fill: "var(--foldy-flap, #114839)", transition: "fill 200ms ease" }}
          d="M 156 20 L 220 84 H 172 A 16 16 0 0 1 156 68 Z"
        />
      </g>
    </svg>
  );
}
