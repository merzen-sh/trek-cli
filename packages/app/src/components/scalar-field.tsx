import { Input } from "ui";
import { OrderTokenButton } from "./order-token-button";
import type { SchemaProp } from "../types/config";

export function ScalarField({
  name,
  prop,
  value,
  onChange,
  error,
  path,
}: {
  name: string;
  prop: SchemaProp;
  value: unknown;
  onChange: (val: unknown) => void;
  error?: string;
  path: string;
}) {
  const id = `field-${name}`;
  const isEditable = prop.ui_permissions?.edit ?? true;

  return (
    <div id={path} className="space-y-1.5 scroll-mt-24 rounded-md transition-all duration-300">
      {prop.ui_type?.component === "color-picker" ? (
        <div className="space-y-1.5 rounded-md border p-2.5 bg-muted/20">
          <label className="text-xs font-medium text-muted-foreground capitalize">
            {name}
            {prop.description && (
              <span className="ml-1 text-muted-foreground/60">— {prop.description}</span>
            )}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              disabled={!isEditable}
              value={`#${((1 << 24) + ((value as any)?.r ?? 255) * 65536 + ((value as any)?.g ?? 255) * 256 + ((value as any)?.b ?? 255)).toString(16).slice(1)}`}
              onChange={(e) => {
                const hex = e.target.value;
                onChange({
                  r: parseInt(hex.slice(1, 3), 16),
                  g: parseInt(hex.slice(3, 5), 16),
                  b: parseInt(hex.slice(5, 7), 16),
                  a: (value as any)?.a ?? 1,
                });
              }}
              className="w-10 h-10 rounded-md border bg-background cursor-pointer p-0.5"
            />
            <div className="flex-1 grid grid-cols-4 gap-1.5">
              {["r", "g", "b", "a"].map((chan) => (
                <div
                  key={chan}
                  className="flex flex-col items-center border rounded bg-background px-1.5 py-0.5"
                >
                  <span className="text-[9px] text-muted-foreground font-bold uppercase">
                    {chan}
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={chan === "a" ? 1 : 255}
                    step={chan === "a" ? 0.1 : 1}
                    disabled={!isEditable}
                    value={(value as any)?.[chan] ?? (chan === "a" ? 1 : 255)}
                    onChange={(e) =>
                      onChange({ ...(value as any), [chan]: Number(e.target.value) })
                    }
                    className="w-full text-center bg-transparent text-xs font-mono focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-[10px] text-destructive">{error}</p>}
        </div>
      ) : prop.ui_type?.component === "vector2_input" ||
        prop.ui_type?.component === "vector3_input" ? (
        <div className="space-y-1.5 rounded-md border p-2.5 bg-muted/20">
          <label className="text-xs font-medium text-muted-foreground capitalize">
            {name}
            {prop.description && (
              <span className="ml-1 text-muted-foreground/60">— {prop.description}</span>
            )}
          </label>
          <div className="flex gap-2">
            {["x", "y", prop.ui_type.component === "vector3_input" ? "z" : null]
              .filter(Boolean)
              .map((axis) => (
                <div
                  key={axis}
                  className="flex-1 flex items-center gap-1 border rounded px-2 bg-background"
                >
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    {axis}:
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    disabled={!isEditable}
                    value={(value as any)?.[axis!] ?? 0}
                    onChange={(e) =>
                      onChange({ ...(value as any), [axis!]: Number(e.target.value) })
                    }
                    className="w-full h-7 bg-transparent text-xs focus:outline-none font-mono"
                  />
                </div>
              ))}
          </div>
          {error && <p className="text-[10px] text-destructive">{error}</p>}
        </div>
      ) : prop.enum ? (
        <div className="space-y-1.5">
          <label htmlFor={id} className="text-xs text-muted-foreground capitalize">
            {name}
          </label>
          <select
            id={id}
            disabled={!isEditable}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none"
          >
            <option value="">Select...</option>
            {prop.enum.map((opt) => (
              <option key={String(opt)} value={String(opt)}>
                {String(opt)}
              </option>
            ))}
          </select>
          {error && <p className="text-[10px] text-destructive">{error}</p>}
        </div>
      ) : prop.type === "boolean" ? (
        <div className="flex items-center justify-between py-1 border-b border-dashed">
          <label htmlFor={id} className="text-xs text-muted-foreground capitalize">
            {name}
          </label>
          <input
            id={id}
            type="checkbox"
            disabled={!isEditable}
            checked={Boolean(value ?? false)}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded accent-primary"
          />
        </div>
      ) : prop.type === "number" || prop.type === "integer" ? (
        <div className="space-y-1.5">
          <label htmlFor={id} className="text-xs text-muted-foreground capitalize">
            {name}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              disabled={!isEditable}
              min={prop.minimum ?? 0}
              max={prop.maximum ?? 100}
              value={Number(value ?? prop.minimum ?? 0)}
              onChange={(e) => onChange(Number(e.target.value))}
              className="flex-1 h-1.5 accent-primary cursor-pointer"
            />
            <Input
              type="number"
              disabled={!isEditable}
              value={String(value ?? "")}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-16 h-7 text-xs font-mono"
            />
          </div>
          {error && <p className="text-[10px] text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor={id} className="text-xs text-muted-foreground capitalize">
            {name}
          </label>
          <div className="flex items-center gap-2">
            <Input
              id={id}
              disabled={!isEditable}
              type={prop.format === "uri" || prop.format === "url" ? "url" : "text"}
              placeholder={prop.validation?.placeholder}
              value={String(value ?? "")}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1"
            />
            {prop.validation?.prefix === "trek_" && (
              <OrderTokenButton onSelect={(token) => onChange(token)} disabled={!isEditable} />
            )}
          </div>
          {prop.validation?.help_text && (
            <p className="text-[10px] text-muted-foreground/60">{prop.validation.help_text}</p>
          )}
          {error && <p className="text-[10px] text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
