"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pipette } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  HEX_RE,
  clamp,
  hexToRgb,
  hsvToRgb,
  isValidHex,
  normalizeHex,
  rgbToHex,
  rgbToHsv,
} from "./color-math";

export function ColorPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const hex = isValidHex(value) ? normalizeHex(value) : "#000000";
  const { r, g, b } = hexToRgb(hex);
  const hsv = rgbToHsv(r, g, b);

  // Local HSV state so hue survives low-saturation values.
  const [hue, setHue] = useState(hsv.h);
  const [sat, setSat] = useState(hsv.s);
  const [val, setVal] = useState(hsv.v);
  const [hexInput, setHexInput] = useState(hex);

  useEffect(() => {
    if (!isValidHex(value)) return;
    const next = normalizeHex(value);
    const rgb = hexToRgb(next);
    const h = rgbToHsv(rgb.r, rgb.g, rgb.b);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHue(h.h);
    setSat(h.s);
    setVal(h.v);
    setHexInput(next);
  }, [value]);

  const areaRef = useRef<HTMLDivElement>(null);

  const commit = useCallback(
    (nextHue: number, nextSat: number, nextVal: number) => {
      const { r: rr, g: gg, b: bb } = hsvToRgb(nextHue, nextSat, nextVal);
      const nextHex = rgbToHex(rr, gg, bb);
      setHexInput(nextHex);
      onChange(nextHex);
    },
    [onChange],
  );

  const handleAreaPointer = (clientX: number, clientY: number) => {
    const el = areaRef.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    const nextSat = x;
    const nextVal = 1 - y;
    setSat(nextSat);
    setVal(nextVal);
    commit(hue, nextSat, nextVal);
  };

  const handleAreaDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    handleAreaPointer(e.clientX, e.clientY);
  };

  const handleAreaMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      handleAreaPointer(e.clientX, e.clientY);
    }
  };

  const handleAreaUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
  };

  const handleHueChange = (nextHue: number) => {
    setHue(nextHue);
    commit(nextHue, sat, val);
  };

  const handleHexInput = (raw: string) => {
    setHexInput(raw);
    const candidate = normalizeHex(raw);
    if (HEX_RE.test(candidate)) {
      onChange(candidate);
    }
  };

  const hueColor = `hsl(${hue}, 100%, 50%)`;

  return (
    <div className="space-y-3">
      {/* Saturation / Value area */}
      <div
        ref={areaRef}
        onPointerDown={handleAreaDown}
        onPointerMove={handleAreaMove}
        onPointerUp={handleAreaUp}
        onPointerCancel={handleAreaUp}
        className={cn(
          "relative h-40 w-full touch-none select-none overflow-hidden rounded-xl border border-border",
          disabled && "pointer-events-none opacity-50",
        )}
        style={{
          background: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))
          `,
        }}
        role="slider"
        aria-label="اشباع و روشنایی"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sat * 100)}
      >
        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
          style={{
            left: `${sat * 100}%`,
            top: `${(1 - val) * 100}%`,
            backgroundColor: hex,
          }}
        />
      </div>

      {/* Hue slider */}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={359}
          step={1}
          value={Math.round(hue)}
          onChange={(e) => handleHueChange(Number(e.target.value))}
          disabled={disabled}
          className="h-3 w-full cursor-pointer appearance-none rounded-full disabled:opacity-50 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-transparent [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:shadow-md"
          style={{
            background:
              "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
          }}
          aria-label="رنگ (Hue)"
        />
        <span
          className="h-8 w-8 shrink-0 rounded-md border border-border shadow-sm"
          style={{ backgroundColor: hueColor }}
          aria-hidden
        />
      </div>

      {/* Hex + native picker */}
      <div className="flex items-center gap-2">
        <div
          className="h-10 w-14 shrink-0 rounded-lg border border-border"
          style={{ backgroundColor: hex }}
          aria-hidden
        />
        <Input
          dir="ltr"
          className="font-mono text-sm"
          value={hexInput}
          onChange={(e) => handleHexInput(e.target.value)}
          onBlur={(e) => handleHexInput(normalizeHex(e.target.value))}
          placeholder="#1587eb"
          disabled={disabled}
          aria-label="کد رنگ هگز"
        />
        <label
          className={cn(
            "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            disabled && "pointer-events-none opacity-50",
          )}
          title="انتخاب از پیکر پیش‌فرض"
        >
          <Pipette className="h-4 w-4" aria-hidden="true" />
          <input
            type="color"
            className="sr-only"
            value={hex}
            onChange={(e) => handleHexInput(e.target.value)}
            disabled={disabled}
            aria-label="انتخاب رنگ از پیکر"
          />
        </label>
      </div>
    </div>
  );
}
