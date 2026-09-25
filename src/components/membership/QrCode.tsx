"use client";

import QRCode from "qrcode";
import { useMemo } from "react";

export function QrCode({ value, className }: { value: string; className?: string }) {
  const { size, path } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
    const n = modules.size;
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (modules.data[y * n + x]) d += `M${x} ${y}h1v1h-1z`;
    return { size: n, path: d };
  }, [value]);
  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} shapeRendering="crispEdges" className={className} role="img" aria-label="QR code de la carte membre">
      <rect x="-2" y="-2" width={size + 4} height={size + 4} rx="1.5" fill="#fff" />
      <path d={path} fill="#050b18" />
    </svg>
  );
}
