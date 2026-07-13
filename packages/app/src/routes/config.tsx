import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Loader2,
  RotateCcw,
  Search,
  ChevronRight,
  Eye,
  EyeOff,
  Sliders,
  Copy,
  Server,
  Monitor,
} from "lucide-react";
import { Button, Input, Badge } from "ui";
import { useAppSetting } from "~/lib/use-app-setting";
import { getConfigSchemaQuery } from "~/data/getConfigSchema";
import { getConfigQuery } from "~/data/getConfig";
import { useSaveConfig } from "~/data/saveConfig";
import { jsonSchemaToZod } from "~/lib/json-schema-to-zod";
import { flattenSchemaPaths, buildDefaults, stripSystemFields } from "~/lib/config-utils";
import { scrollToElement } from "~/lib/dom-utils";
import { ObjectFields } from "~/components/object-fields";
import { JsonHighlight } from "~/components/json-highlight";
import type { SchemaProp } from "~/types/config";

export function ConfigEditorPage() {
  const activeScript = useAppSetting((s) => s.activeScript);
  const queryClient = useQueryClient();

  const [configType, setConfigType] = useState<"server" | "client">("server");

  const {
    data: schema,
    isLoading: schemaLoading,
    isFetching: schemaFetching,
  } = useQuery(getConfigSchemaQuery(activeScript ?? "", configType));
  const { data: config, isLoading: configLoading } = useQuery(
    getConfigQuery(activeScript ?? "", configType),
  );
  const saveMutation = useSaveConfig(activeScript ?? "", configType);

  const [searchTerm, setSearchTerm] = useState("");
  const [focusPath, setFocusPath] = useState<string | null>(null);
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);
  const [previewTab, setPreviewTab] = useState<"json" | "tree">("json");
  const [copied, setCopied] = useState(false);

  const isSwitchingType = schemaFetching && schema === undefined;

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

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValues({});
    setErrors({});
    setSaved(false);
  }, [configType]);

  const noticeProp = properties["notice"];
  const noticeMessage = noticeProp?.system ? ((noticeProp.default as string) ?? "") : "";

  const previewValues = useMemo(() => stripSystemFields(properties, values), [properties, values]);

  const allNavItems = useMemo(() => flattenSchemaPaths(properties), [properties]);

  const filteredNavItems = useMemo(() => {
    if (!searchTerm.trim()) return allNavItems;
    return allNavItems.filter((item) => item.path.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allNavItems, searchTerm]);

  useEffect(() => {
    if (schema) {
      const baseDefaults = buildDefaults(properties, required);
      const { $schema: _, ...configData } = config ?? {};
      setValues(configData ? { ...baseDefaults, ...configData } : baseDefaults);
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
      const { $schema: _, ...configData } = config ?? {};
      setValues(configData ? { ...baseDefaults, ...configData } : baseDefaults);
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
    saveMutation.mutate(stripSystemFields(properties, result.data as Record<string, unknown>), {
      onSuccess: () => {
        setSaved(true);
        queryClient.invalidateQueries({
          queryKey: getConfigQuery(activeScript ?? "", configType).queryKey,
        });
      },
    });
  }

  const handleCopyJson = useCallback(async () => {
    await navigator.clipboard.writeText(JSON.stringify(previewValues, null, 2));
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

  if (schemaLoading || configLoading || isSwitchingType) {
    return (
      <div className="flex h-full items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading config data...</p>
      </div>
    );
  }

  if (schema === null || !zodSchema) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
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
              className="gap-1.5 py-1 px-2.5 text-xs bg-primary/10 text-primary border border-primary/20"
            >
              <EyeOff className="h-3 w-3" /> {focusPath}
              <button
                onClick={() => setFocusPath(null)}
                className="ml-1 underline hover:text-primary font-bold"
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

      <div className="flex border-b bg-muted/30 px-6">
        <button
          type="button"
          onClick={() => setConfigType("server")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            configType === "server"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Server className="h-3.5 w-3.5" />
          Server Config
        </button>
        <button
          type="button"
          onClick={() => setConfigType("client")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            configType === "client"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Monitor className="h-3.5 w-3.5" />
          Client Config
        </button>
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

      {noticeMessage && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 text-xs text-amber-700 dark:text-amber-400">
          {noticeMessage}
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
                  `${JSON.stringify(previewValues, null, 2).split("\n").length} lines`}
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
                    className={`text-[10px] font-medium py-1 rounded transition-all ${isFocusModeActive ? "bg-primary/10 text-primary shadow-sm font-bold" : "text-muted-foreground hover:text-foreground"}`}
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
                            ? "bg-primary/10 text-primary font-semibold"
                            : isCurrentlyFocused && !isFocusModeActive
                              ? "bg-muted text-foreground font-semibold border-l-2 border-primary"
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                        style={{ paddingLeft: `${depth * 10 + 8}px` }}
                      >
                        <div className="flex items-center gap-1 truncate">
                          <ChevronRight
                            className={`h-3 w-3 shrink-0 ${isCurrentlyFocused && isFocusModeActive ? "text-primary" : "opacity-40"}`}
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
              data={previewValues}
              className="flex-1 overflow-auto p-4 text-[11px] leading-relaxed"
            />
          )}
        </div>
      </div>
    </div>
  );
}
