interface BrandLogoProps {
  className?: string;
}

export function BrandLogo({ className = "h-7 w-auto shrink-0" }: BrandLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 281.34 367.74"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M 0.00 0.00 L 281.34 0.00 L 281.34 240.40 L 249.89 271.85 L 249.89 336.33 L 190.46 331.28 L 154.00 367.74 L 0.00 367.74 Z M 20.34 347.54 L 149.87 347.54 L 86.82 240.40 L 261.01 240.40 L 261.01 20.34 L 20.34 20.34 Z"
        fill="#000"
        fillRule="evenodd"
      />
      <rect x="43.67" y="55.86" width="55.73" height="73.43" fill="#000" />
      <rect x="117.76" y="55.86" width="120.01" height="11.78" fill="#000" />
      <rect x="117.76" y="86.72" width="120.01" height="11.68" fill="#000" />
      <rect x="117.76" y="117.45" width="120.01" height="11.84" fill="#000" />
      <rect x="43.67" y="148.34" width="194.10" height="11.50" fill="#000" />
      <rect x="43.67" y="178.92" width="194.10" height="11.79" fill="#000" />
      <rect x="43.67" y="209.76" width="194.10" height="11.58" fill="#000" />
      <polygon
        points="43.67,240.41 64.75,240.41 71.49,251.87 43.67,251.87"
        fill="#000"
      />
      <polygon
        points="43.67,270.95 82.72,270.95 89.66,282.75 43.67,282.75"
        fill="#000"
      />
      <polygon
        points="43.67,301.83 100.89,301.83 107.87,313.69 43.67,313.69"
        fill="#000"
      />
      <polygon
        points="140.52,265.28 249.89,271.85 249.89,336.33 217.18,304.56"
        fill="#000"
      />
      <polygon
        points="217.18,304.56 249.89,336.33 190.46,331.28"
        fill="#000"
      />
    </svg>
  );
}
