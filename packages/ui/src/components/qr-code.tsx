// oxlint-disable typescript/no-non-null-assertion
import { formatHex, oklch } from "culori";
import QRCodeGenerator from "qrcode";
import { type HTMLAttributes, useEffect, useState } from "react";

import { cn } from "../lib/utils";

export type QRCodeProps = HTMLAttributes<HTMLDivElement> & {
  data: string;
  foreground?: string;
  background?: string;
  robustness?: "L" | "M" | "Q" | "H";
};

const oklchRegex = /oklch\(([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)\)/;

function getOklchColor(color: string, fallback: [number, number, number]) {
  const matchedColor = color.trim().match(oklchRegex);

  if (!matchedColor) {
    return { l: fallback[0], c: fallback[1], h: fallback[2] };
  }

  return {
    l: Number.parseFloat(matchedColor[1]!),
    c: Number.parseFloat(matchedColor[2]!),
    h: Number.parseFloat(matchedColor[3]!),
  };
}

function resolveThemeColor(propertyName: "--foreground" | "--background") {
  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue(propertyName);

  return (
    value || (propertyName === "--foreground" ? "oklch(0.21 0.006 285.885)" : "oklch(0.985 0 0)")
  );
}

export function QRCode({
  data,
  foreground,
  background,
  robustness = "M",
  className,
  ...props
}: QRCodeProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const renderQrCode = async () => {
      try {
        const darkColor = getOklchColor(
          foreground ?? resolveThemeColor("--foreground"),
          [0.21, 0.006, 285.885],
        );
        const lightColor = getOklchColor(
          background ?? resolveThemeColor("--background"),
          [0.985, 0, 0],
        );
        const nextSvg = await QRCodeGenerator.toString(data, {
          type: "svg",
          width: 200,
          margin: 0,
          errorCorrectionLevel: robustness,
          color: {
            dark: formatHex(oklch({ mode: "oklch", ...darkColor })),
            light: formatHex(oklch({ mode: "oklch", ...lightColor })),
          },
        });

        if (!cancelled) {
          setSvg(nextSvg);
        }
      } catch {
        if (!cancelled) {
          setSvg(null);
        }
      }
    };

    void renderQrCode();

    return () => {
      cancelled = true;
    };
  }, [background, data, foreground, robustness]);

  if (!svg) {
    return null;
  }

  return (
    <div
      className={cn("size-full [&_svg]:size-full", className)}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...props}
    />
  );
}
