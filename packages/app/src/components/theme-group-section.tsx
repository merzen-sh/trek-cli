import { Input, ColorPicker } from "ui";
import { ShadowPicker } from "react-shadow-picker";
import { ChevronRight, ChevronDown } from "lucide-react";
import { groupKeyToCssVar, GROUP_LABELS } from "../lib/theme-utils";
import type { SchemaGroup } from "../types/config";

export function ThemeGroupSection({
  group,
  schema,
  values,
  onChange,
  openShadows,
  onToggleShadow,
}: {
  group: string;
  schema: SchemaGroup;
  values: Record<string, unknown>;
  onChange: (group: string, key: string, val: unknown) => void;
  openShadows: Set<string>;
  onToggleShadow: (key: string) => void;
}) {
  return (
    <fieldset className="rounded-md border p-4 space-y-3">
      <legend className="text-xs font-semibold text-muted-foreground px-1">
        {GROUP_LABELS[group] ?? group}
        {schema.description && (
          <span className="ml-2 text-muted-foreground/50 font-normal">— {schema.description}</span>
        )}
      </legend>
      <div className="space-y-1">
        {Object.entries(schema.properties).map(([key, prop]) => {
          if (prop.system) return null;
          const val = values[key];
          const cssVar = groupKeyToCssVar(group, key);

          if (prop.ui_type?.component === "shadow-picker") {
            const isOpen = openShadows.has(key);
            return (
              <div
                key={key}
                className="group rounded-md border border-border/60 bg-card/30 text-sm transition-colors hover:bg-card/60"
              >
                <button
                  type="button"
                  onClick={() => onToggleShadow(key)}
                  className="flex w-full items-center gap-3 px-3 py-2"
                >
                  <div className="w-44 shrink-0 text-left">
                    <code className="block truncate text-xs font-medium text-foreground/70">
                      {cssVar}
                    </code>
                    <span className="block truncate text-[10px] text-muted-foreground/50 leading-tight">
                      {prop.description}
                    </span>
                  </div>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                    Shadow
                  </span>
                  <div
                    className="ml-auto h-4 w-12 rounded border"
                    style={{ boxShadow: String(val ?? "none") }}
                  />
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {isOpen && (
                  <div className="border-t px-3 py-3">
                    <ShadowPicker
                      value={String(val ?? "0px 0px 0px 0px #000000")}
                      onChange={(v) => onChange(group, key, v)}
                    />
                  </div>
                )}
              </div>
            );
          }

          if (
            prop.ui_type?.component === "color-picker" ||
            (prop.pattern && prop.pattern.includes("#"))
          ) {
            const strVal = String(val ?? "#000000");
            const hexMatch = strVal.match(/^#([0-9a-f]{3,6})$/i);
            const hexPreview = hexMatch
              ? (() => {
                  let h = hexMatch[1];
                  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
                  return `#${h}`;
                })()
              : "#000000";
            return (
              <div
                key={key}
                className="group flex items-center gap-3 rounded-md border border-border/60 bg-card/30 px-3 py-2 text-sm transition-colors hover:bg-card/60"
              >
                <div className="w-44 shrink-0">
                  <code className="block truncate text-xs font-medium text-foreground/70">
                    {cssVar}
                  </code>
                  <span className="block truncate text-[10px] text-muted-foreground/50 leading-tight">
                    {prop.description}
                  </span>
                </div>
                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                  Color
                </span>
                <div className="flex flex-1 items-center gap-1">
                  <ColorPicker
                    raw={strVal}
                    hexPreview={hexPreview}
                    onRawChange={(v) => onChange(group, key, v)}
                    onHexChange={(v) => onChange(group, key, v)}
                  />
                </div>
              </div>
            );
          }

          return (
            <div
              key={key}
              className="group flex items-center gap-3 rounded-md border border-border/60 bg-card/30 px-3 py-2 text-sm transition-colors hover:bg-card/60"
            >
              <div className="w-44 shrink-0">
                <code className="block truncate text-xs font-medium text-foreground/70">
                  {cssVar}
                </code>
                <span className="block truncate text-[10px] text-muted-foreground/50 leading-tight">
                  {prop.description}
                </span>
              </div>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/70">
                {prop.type === "number" ? "Number" : "String"}
              </span>
              <div className="flex flex-1 items-center gap-1">
                <Input
                  variant="mono"
                  size="sm"
                  type={prop.type === "number" ? "number" : "text"}
                  step={prop.type === "number" ? "any" : undefined}
                  min={prop.minimum}
                  max={prop.maximum}
                  value={String(val ?? "")}
                  onChange={(e) =>
                    onChange(
                      group,
                      key,
                      prop.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value,
                    )
                  }
                />
              </div>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
