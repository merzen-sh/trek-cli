import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "ui";
import { Check, RotateCcw, Sun, Loader2 } from "lucide-react";
import { useAppSetting } from "../lib/use-app-setting";
import { getThemeSchemaQuery } from "../data/getThemeSchema/query";
import { getThemeQuery } from "../data/getTheme/query";
import { useSaveTheme } from "../data/saveTheme/mutation";
import { jsonSchemaToZod } from "../lib/json-schema-to-zod";
import { buildThemeDefaults, groupKeyToCssVar } from "../lib/theme-utils";
import { ThemeGroupSection } from "../components/theme-group-section";
import { JsonHighlight } from "../components/json-highlight";
import type { SchemaGroup } from "../types/config";

export function ThemeEditorPage() {
  const activeScript = useAppSetting((s) => s.activeScript);
  const queryClient = useQueryClient();

  const { data: schema, isLoading: schemaLoading } = useQuery(
    getThemeSchemaQuery(activeScript ?? ""),
  );
  const { data: theme, isLoading: themeLoading } = useQuery(getThemeQuery(activeScript ?? ""));
  const saveMutation = useSaveTheme(activeScript ?? "");

  const [previewTab, setPreviewTab] = useState<"json" | "palette">("json");
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [openShadows, setOpenShadows] = useState<Set<string>>(new Set());

  const zodSchema = useMemo(() => {
    if (!schema) return null;
    try {
      return jsonSchemaToZod(schema);
    } catch {
      return null;
    }
  }, [schema]);

  const groups = (schema?.properties as Record<string, SchemaGroup> | undefined) ?? {};

  useEffect(() => {
    if (schema) {
      const baseDefaults = buildThemeDefaults(groups);
      if (theme) {
        const merged: Record<string, Record<string, unknown>> = {};
        for (const group of Object.keys(baseDefaults)) {
          merged[group] = {
            ...baseDefaults[group],
            ...((theme as Record<string, Record<string, unknown>>)[group] ?? {}),
          };
        }
        setValues(merged);
      } else {
        setValues(baseDefaults);
      }
      setErrors({});
      setSaved(false);
    }
  }, [schema, theme]);

  const setGroupValue = useCallback((group: string, key: string, val: unknown) => {
    setValues((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: val },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      const path = `${group}.${key}`;
      delete next[path];
      return next;
    });
    setSaved(false);
  }, []);

  const handleReset = useCallback(() => {
    if (schema) {
      const baseDefaults = buildThemeDefaults(groups);
      if (theme) {
        const merged: Record<string, Record<string, unknown>> = {};
        for (const group of Object.keys(baseDefaults)) {
          merged[group] = {
            ...baseDefaults[group],
            ...((theme as Record<string, Record<string, unknown>>)[group] ?? {}),
          };
        }
        setValues(merged);
      } else {
        setValues(baseDefaults);
      }
      setErrors({});
      setSaved(false);
    }
  }, [schema, theme, groups]);

  const toggleShadow = useCallback((key: string) => {
    setOpenShadows((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  function handleSave() {
    if (!zodSchema) return;
    const result = zodSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    saveMutation.mutate(result.data as Record<string, unknown>, {
      onSuccess: () => {
        setSaved(true);
        queryClient.invalidateQueries({
          queryKey: getThemeQuery(activeScript ?? "").queryKey,
        });
      },
    });
  }

  const colorVars = useMemo(() => {
    const vars: Array<{ group: string; key: string; cssVar: string; hex: string }> = [];
    for (const [group, props] of Object.entries(values)) {
      for (const [key, val] of Object.entries(props)) {
        const prop = groups[group]?.properties[key];
        if (prop?.pattern?.includes("#") || prop?.ui_type?.component === "color-picker") {
          const str = String(val ?? "");
          const hexMatch = str.match(/^#([0-9a-f]{3,6})$/i);
          if (hexMatch) {
            let h = hexMatch[1];
            if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            vars.push({ group, key, cssVar: groupKeyToCssVar(group, key), hex: `#${h}` });
          }
        }
      }
    }
    return vars;
  }, [values, groups]);

  const getColor = (key: string, fallback: string) => {
    // Search through all groups (colors, sidebar, etc.) to find the matching key dynamically
    for (const group of Object.values(values)) {
      const val = group?.[key];
      if (typeof val === "string" && val.trim() !== "") {
        return val;
      }
    }
    return fallback;
  };

  const groupEntries = Object.entries(groups);

  if (!activeScript) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a script from the navbar first</p>
      </div>
    );
  }

  if (schemaLoading || themeLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading theme editor...</p>
      </div>
    );
  }

  if (schema === null || !zodSchema) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No theme schema found for this script</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <Sun className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">Theme Editor</h1>
          <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {groupEntries.length} groups
          </span>
          {saved && (
            <span className="rounded border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] text-green-600">
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Check className="mr-1 h-3 w-3" />
            )}
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {saveMutation.isError && (
        <div className="border-b border-destructive/30 bg-destructive/5 px-6 py-2 text-xs text-destructive">
          Save failed:{" "}
          {saveMutation.error instanceof Error ? saveMutation.error.message : "Unknown error"}
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <div className="border-b border-destructive/30 bg-destructive/5 px-6 py-2 text-xs text-destructive">
          Validation errors: {Object.values(errors).join(", ")}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-6 space-y-4">
            {groupEntries.map(([group, schema]) => (
              <ThemeGroupSection
                key={group}
                group={group}
                schema={schema}
                values={values[group] ?? {}}
                onChange={setGroupValue}
                openShadows={openShadows}
                onToggleShadow={toggleShadow}
              />
            ))}
          </div>
        </div>

        <div className="hidden w-96 flex-shrink-0 border-l md:flex md:flex-col">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewTab("json")}
                className={`text-xs font-medium transition-colors ${previewTab === "json" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                JSON
              </button>
              <button
                onClick={() => setPreviewTab("palette")}
                className={`text-xs font-medium transition-colors ${previewTab === "palette" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Palette
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground/50">
              {previewTab === "json" &&
                `${JSON.stringify(values, null, 2).split("\n").length} lines`}
              {previewTab === "palette" && `${colorVars.length} colors`}
            </span>
          </div>

          {previewTab === "palette" ? (
            <div className="flex-1 overflow-auto p-4 space-y-4 text-xs">
              <div
                className="rounded-lg border p-4 space-y-3"
                style={{
                  backgroundColor: getColor("card", "#ffffff"),
                  borderColor: getColor("border", "#cccccc"),
                  color: getColor("card_foreground", "#1e1e1e"),
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: getColor("card_foreground", "#1e1e1e"),
                  }}
                >
                  Card
                </p>
                <p
                  style={{
                    color: getColor("muted_foreground", "#5e5a52"),
                  }}
                >
                  This is how muted body text looks inside a card.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: getColor("primary", "#000000"),
                      color: getColor("primary_foreground", "#ffffff"),
                    }}
                  >
                    Primary
                  </span>
                  <span
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: getColor("secondary", "#e0e0e0"),
                      color: getColor("secondary_foreground", "#000000"),
                    }}
                  >
                    Secondary
                  </span>
                  <span
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: getColor("accent", "#f0f0f0"),
                      color: getColor("accent_foreground", "#000000"),
                    }}
                  >
                    Accent
                  </span>
                  <span
                    className="rounded px-2 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: getColor("destructive", "#dc2626"),
                      color: getColor("destructive_foreground", "#ffffff"),
                    }}
                  >
                    Destructive
                  </span>
                </div>
              </div>

              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: getColor("muted", "#f0f0f0"),
                  borderColor: getColor("border", "#cccccc"),
                }}
              >
                <p
                  className="text-xs font-medium mb-2"
                  style={{
                    color: getColor("muted_foreground", "#5e5a52"),
                  }}
                >
                  Muted Section
                </p>
                <div className="flex flex-wrap gap-2">
                  <span
                    className="rounded px-3 py-1.5 text-xs font-medium"
                    style={{
                      backgroundColor: getColor("background", "#ffffff"),
                      color: getColor("foreground", "#000000"),
                      border: `1px solid ${getColor("input", "#cccccc")}`,
                    }}
                  >
                    Input Field
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-xs"
                    style={{
                      backgroundColor: getColor("primary", "#000000"),
                      color: getColor("primary_foreground", "#ffffff"),
                    }}
                  >
                    Pill Badge
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-muted-foreground/60">ALL COLORS</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {colorVars.map(({ cssVar, hex }) => (
                    <div key={cssVar} className="group relative">
                      <div
                        className="h-10 w-full rounded border"
                        style={{ backgroundColor: hex }}
                      />
                      <div className="mt-0.5 truncate text-[9px] text-muted-foreground/60">
                        {cssVar}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <JsonHighlight
              data={values}
              className="flex-1 overflow-auto p-4 text-[11px] leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
}
