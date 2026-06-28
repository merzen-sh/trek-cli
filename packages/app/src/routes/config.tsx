import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Loader2,
  Plus,
  Trash2,
  RotateCcw,
  Search,
  ChevronRight,
  Eye,
  EyeOff,
  Sliders,
  Copy,
  Key,
} from "lucide-react";
import { Button, Input, Badge } from "ui";
import { useAppSetting } from "../lib/use-app-setting";
import { getConfigSchemaQuery } from "../data/getConfigSchema/query";
import { getConfigQuery } from "../data/getConfig/query";
import { useSaveConfig } from "../data/saveConfig/mutation";
import { jsonSchemaToZod } from "../lib/json-schema-to-zod";
import { JsonHighlight } from "../components/json-highlight";
import { apiFetch } from "../lib/api";

interface SchemaProp {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  properties?: Record<string, SchemaProp>;
  required?: string[];
  items?: SchemaProp;
  additionalProperties?: boolean;

  ui_permissions?: {
    add: boolean;
    delete: boolean;
    edit: boolean;
  };
  ui_type?: {
    component: "color-picker" | "vector2_input" | "vector3_input";
    format?: string;
  };
  validation?: {
    prefix?: string;
    placeholder?: string;
    help_text?: string;
  };
}

function flattenSchemaPaths(
  properties: Record<string, SchemaProp>,
  prefix = "",
): Array<{ path: string; label: string; type: string }> {
  let items: Array<{ path: string; label: string; type: string }> = [];

  for (const [key, prop] of Object.entries(properties)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    items.push({
      path: currentPath,
      label: key,
      type: prop.type ?? "string",
    });

    if (prop.type === "object" && prop.properties && !prop.ui_type) {
      items = [...items, ...flattenSchemaPaths(prop.properties, currentPath)];
    }
  }
  return items;
}

function scrollToElement(id: string) {
  const escapedId = id.replace(/(:|\.|\[|\]|,|=)/g, "\\$1");
  const element = document.getElementById(escapedId) || document.getElementById(id);

  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add("ring-4", "ring-primary/40", "transition-all", "duration-300");
    setTimeout(() => {
      element.classList.remove("ring-4", "ring-primary/40");
    }, 1200);
  }
}

function OrderTokenButton({
  onSelect,
  disabled,
}: {
  onSelect: (token: string) => void;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetch("/external/api/orders", { credentials: "include" });
      if (!res.ok) throw res;
      const json: {
        orders: { id: string; tokenKey: string; active: boolean }[];
      } = await res.json();
      const activeOrder = json.orders.find((o) => o.active);
      if (activeOrder) {
        onSelect(activeOrder.tokenKey);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled || loading}
      onClick={handleClick}
      className="h-8 px-2 text-xs"
      title={error ? "No active order found" : "Fill from active order"}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
    </Button>
  );
}

function buildItemDefaults(itemsSchema: SchemaProp): Record<string, unknown> {
  const props = itemsSchema.properties ?? {};
  const item: Record<string, unknown> = {};
  for (const [k, p] of Object.entries(props)) {
    if (p.default !== undefined) {
      item[k] = p.default;
    } else if (p.type === "boolean") {
      item[k] = false;
    } else if (p.type === "number" || p.type === "integer") {
      item[k] = p.minimum ?? 0;
    } else if (p.enum) {
      item[k] = "";
    } else if (p.type === "object") {
      item[k] = buildItemDefaults(p);
    } else {
      item[k] = "";
    }
  }
  return item;
}

function ScalarField({
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

function ObjectFields({
  properties,
  values,
  onChange,
  errors,
  prefix,
  focusPath,
  isFocusModeActive,
}: {
  properties: Record<string, SchemaProp>;
  values: Record<string, unknown>;
  onChange: (key: string, val: unknown) => void;
  errors: Record<string, string>;
  prefix?: string;
  focusPath: string | null;
  isFocusModeActive: boolean;
}) {
  return (
    <div className="space-y-4">
      {Object.entries(properties).map(([key, prop]) => {
        const childPath = prefix ? `${prefix}.${key}` : key;
        const childError = errors[childPath];

        if (
          isFocusModeActive &&
          focusPath &&
          childPath !== focusPath &&
          !focusPath.startsWith(childPath + ".") &&
          !childPath.startsWith(focusPath + ".")
        ) {
          return null;
        }

        if (prop.type === "object" && prop.ui_type) {
          return (
            <ScalarField
              key={key}
              name={key}
              prop={prop}
              value={values[key]}
              onChange={(val) => onChange(key, val)}
              error={errors[childPath]}
              path={childPath}
            />
          );
        }

        if (prop.type === "object" && prop.properties) {
          return (
            <fieldset
              id={childPath}
              key={key}
              className="rounded-md border p-3 space-y-3 scroll-mt-24"
            >
              <legend className="text-xs font-medium text-muted-foreground px-1 capitalize">
                {key}
                {prop.description && (
                  <span className="ml-1 text-muted-foreground/60">— {prop.description}</span>
                )}
              </legend>
              <ObjectFields
                properties={prop.properties}
                values={(values[key] ?? {}) as Record<string, unknown>}
                onChange={(subKey, val) => {
                  const updated = { ...((values[key] ?? {}) as Record<string, unknown>) };
                  updated[subKey] = val;
                  onChange(key, updated);
                }}
                errors={errors}
                prefix={childPath}
                focusPath={focusPath}
                isFocusModeActive={isFocusModeActive}
              />
            </fieldset>
          );
        }

        if (prop.type === "array" && prop.items) {
          const arr = (values[key] ?? []) as unknown[];
          return (
            <div id={childPath} key={key} className="space-y-2 scroll-mt-24">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground capitalize">{key}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange(key, [...arr, buildItemDefaults(prop.items!)])}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {arr.map((item, idx) => (
                <div key={idx} className="rounded-md border p-3 space-y-3 relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      onChange(
                        key,
                        arr.filter((_, i) => i !== idx),
                      )
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  {prop.items!.properties ? (
                    <ObjectFields
                      properties={prop.items!.properties}
                      values={item as Record<string, unknown>}
                      onChange={(subKey, val) => {
                        const updated = [...arr];
                        updated[idx] = {
                          ...(updated[idx] as Record<string, unknown>),
                          [subKey]: val,
                        };
                        onChange(key, updated);
                      }}
                      errors={errors}
                      prefix={`${childPath}.${idx}`}
                      focusPath={focusPath}
                      isFocusModeActive={isFocusModeActive}
                    />
                  ) : (
                    <ScalarField
                      name={`${key}[${idx}]`}
                      prop={prop.items!}
                      value={item}
                      onChange={(val) => {
                        const updated = [...arr];
                        updated[idx] = val;
                        onChange(key, updated);
                      }}
                      error={errors[`${childPath}.${idx}`]}
                      path={`${childPath}.${idx}`}
                    />
                  )}
                </div>
              ))}
              {childError && <p className="text-[10px] text-destructive">{childError}</p>}
            </div>
          );
        }

        return (
          <ScalarField
            key={key}
            name={key}
            prop={prop}
            value={values[key]}
            onChange={(val) => onChange(key, val)}
            error={errors[childPath]}
            path={childPath}
          />
        );
      })}
    </div>
  );
}

function buildDefaults(
  properties: Record<string, SchemaProp>,
  _required: string[],
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.default !== undefined) defaults[key] = prop.default;
    else if (prop.ui_type?.component === "color-picker")
      defaults[key] = { r: 255, g: 255, b: 255, a: 1 };
    else if (prop.ui_type?.component === "vector3_input") defaults[key] = { x: 0, y: 0, z: 0 };
    else if (prop.ui_type?.component === "vector2_input") defaults[key] = { x: 0, y: 0 };
    else if (prop.type === "boolean") defaults[key] = false;
    else if (prop.type === "number" || prop.type === "integer") defaults[key] = prop.minimum ?? 0;
    else if (prop.type === "object" && prop.properties)
      defaults[key] = buildDefaults(prop.properties, prop.required ?? []);
    else if (prop.type === "array" && prop.items) defaults[key] = [];
    else defaults[key] = "";
  }
  return defaults;
}

export function ConfigEditorPage() {
  const activeScript = useAppSetting((s) => s.activeScript);
  const queryClient = useQueryClient();

  const { data: schema, isLoading: schemaLoading } = useQuery(
    getConfigSchemaQuery(activeScript ?? ""),
  );
  const { data: config, isLoading: configLoading } = useQuery(getConfigQuery(activeScript ?? ""));
  const saveMutation = useSaveConfig(activeScript ?? "");

  const [searchTerm, setSearchTerm] = useState("");
  const [focusPath, setFocusPath] = useState<string | null>(null);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [previewTab, setPreviewTab] = useState<"json" | "tree">("json");
  const [copied, setCopied] = useState(false);

  const zodSchema = useMemo(() => {
    if (!schema) return null;
    try {
      return jsonSchemaToZod(schema);
    } catch {
      return null;
    }
  }, [schema]);

  const properties = (schema?.properties as Record<string, SchemaProp> | undefined) ?? {};
  const required = (schema?.required as string[] | undefined) ?? [];

  const allNavItems = useMemo(() => flattenSchemaPaths(properties), [properties]);

  const filteredNavItems = useMemo(() => {
    if (!searchTerm.trim()) return allNavItems;
    return allNavItems.filter((item) => item.path.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allNavItems, searchTerm]);

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (schema) {
      const baseDefaults = buildDefaults(properties, required);
      setValues(config ? { ...baseDefaults, ...config } : baseDefaults);
      setErrors({});
      setSaved(false);
    }
  }, [schema, config]);

  const setValue = useCallback((key: string, val: unknown) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (k === key || k.startsWith(key + ".") || k.startsWith(key + "[")) delete next[k];
      }
      return next;
    });
    setSaved(false);
  }, []);

  const handleReset = useCallback(() => {
    if (schema) {
      const baseDefaults = buildDefaults(properties, required);
      setValues(config ? { ...baseDefaults, ...config } : baseDefaults);
      setErrors({});
      setSaved(false);
    }
  }, [schema, config, properties, required]);

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
        queryClient.invalidateQueries({ queryKey: getConfigQuery(activeScript ?? "").queryKey });
      },
    });
  }

  const handleCopyJson = useCallback(async () => {
    await navigator.clipboard.writeText(JSON.stringify(values, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [values]);

  const handleNavItemClick = (path: string) => {
    setFocusPath(focusPath === path ? null : path);

    if (!isFocusModeActive) {
      setTimeout(() => scrollToElement(path), 50);
    }
  };

  if (!activeScript) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select a script from the navbar first</p>
      </div>
    );
  }

  if (schemaLoading || configLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading config data...</p>
      </div>
    );
  }

  if (schema === null || !zodSchema) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No valid config schema found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-3">
          <Sliders className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">{activeScript} Config</h1>
          <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {allNavItems.length} fields
          </span>
          {saved && (
            <span className="rounded border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[11px] text-green-600">
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isFocusModeActive && focusPath && (
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 px-2.5 text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20"
            >
              <EyeOff className="h-3 w-3" /> {focusPath}
              <button
                onClick={() => setFocusPath(null)}
                className="ml-1 underline hover:text-amber-400 font-bold"
              >
                Clear
              </button>
            </Badge>
          )}
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
          <div className="flex-1 overflow-auto p-6">
            <ObjectFields
              properties={properties}
              values={values}
              onChange={setValue}
              errors={errors}
              focusPath={focusPath}
              isFocusModeActive={isFocusModeActive}
            />
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
                onClick={() => setPreviewTab("tree")}
                className={`text-xs font-medium transition-colors ${previewTab === "tree" ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                Tree
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/50">
                {previewTab === "json" &&
                  `${JSON.stringify(values, null, 2).split("\n").length} lines`}
                {previewTab === "tree" && `${filteredNavItems.length} keys`}
              </span>
              {previewTab === "json" && (
                <button
                  onClick={handleCopyJson}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>

          {previewTab === "tree" ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search keys..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 bg-background p-0.5 rounded border shadow-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFocusModeActive(false);
                      setFocusPath(null);
                    }}
                    className={`text-[10px] font-medium py-1 rounded transition-all ${!isFocusModeActive ? "bg-muted text-foreground shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Scroll
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFocusModeActive(true)}
                    className={`text-[10px] font-medium py-1 rounded transition-all ${isFocusModeActive ? "bg-amber-500 text-white shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Focus
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
                {filteredNavItems.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-[11px]">
                    No fields match
                  </p>
                ) : (
                  filteredNavItems.map((item) => {
                    const depth = item.path.split(".").length - 1;
                    const isCurrentlyFocused = focusPath === item.path;
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNavItemClick(item.path)}
                        className={`w-full text-left py-1.5 px-2 rounded transition-colors group flex items-center justify-between font-mono ${
                          isCurrentlyFocused && isFocusModeActive
                            ? "bg-amber-500 text-white font-semibold"
                            : isCurrentlyFocused && !isFocusModeActive
                              ? "bg-muted text-foreground font-semibold border-l-2 border-primary"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        style={{ paddingLeft: `${depth * 10 + 8}px` }}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <ChevronRight
                            className={`h-3 w-3 shrink-0 ${isCurrentlyFocused && isFocusModeActive ? "text-white" : "opacity-40"}`}
                          />
                          <span className="truncate" title={item.path}>
                            {item.label}
                          </span>
                        </div>
                        <div className="shrink-0 ml-1 opacity-60 group-hover:opacity-100">
                          {isCurrentlyFocused && isFocusModeActive ? (
                            <Eye className="h-3 w-3 text-white" />
                          ) : (
                            <EyeOff className="h-3 w-3 opacity-0 group-hover:opacity-40" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
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
