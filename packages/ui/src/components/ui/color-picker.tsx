import * as React from "react";
import { cn } from "../../lib/utils";
import { Input } from "./input";

export interface ColorPickerProps {
  raw: string;
  hexPreview: string;
  onRawChange: (raw: string) => void;
  onHexChange: (hex: string) => void;
  className?: string;
}

export function ColorPicker({
  raw,
  hexPreview,
  onRawChange,
  onHexChange,
  className,
}: ColorPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md border border-input bg-background px-1.5 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring has-[input:focus-visible]:ring-offset-2",
        className,
      )}
    >
      {/* Color swatch — opens native picker on click */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-6 w-6 shrink-0 overflow-hidden rounded border"
        style={{ backgroundColor: hexPreview }}
        title="Pick color"
      >
        <input
          ref={inputRef}
          type="color"
          value={hexPreview}
          onChange={(e) => onHexChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          tabIndex={-1}
        />
        {/* checkerboard for transparent/light colors */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
            backgroundSize: "8px 8px",
            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
          }}
        />
      </button>

      {/* Hex preview text */}
      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{hexPreview}</span>

      {/* Separator */}
      <div className="h-4 w-px bg-border" />

      {/* Raw CSS value input */}
      <Input
        variant="ghost"
        size="sm"
        value={raw}
        onChange={(e) => onRawChange(e.target.value)}
        className="min-w-0 flex-1 font-mono text-xs"
      />
    </div>
  );
}
