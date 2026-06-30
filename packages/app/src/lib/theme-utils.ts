import type { SchemaProp, SchemaGroup } from "../types/config";

export function resolveTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

export function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
}

export function applyThemeSmooth(resolved: "light" | "dark") {
  const root = document.documentElement;
  root.classList.add("disable-transition");
  applyTheme(resolved);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove("disable-transition");
    });
  });
}

export const GROUP_LABELS: Record<string, string> = {
  colors: "Core Colors",
  charts: "Chart Colors",
  sidebar: "Sidebar",
  layout: "Typography & Layout",
  shadows: "Shadows",
};

export function groupKeyToCssVar(group: string, key: string): string {
  return `--${group}-${key}`.replace(/_/g, "-");
}

export function buildGroupDefaults(properties: Record<string, SchemaProp>): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.default !== undefined) {
      defaults[key] = prop.default;
    } else if (prop.type === "number") {
      defaults[key] = prop.minimum ?? 0;
    } else {
      defaults[key] = "";
    }
  }
  return defaults;
}

export function buildThemeDefaults(
  groups: Record<string, SchemaGroup>,
): Record<string, Record<string, unknown>> {
  const defaults: Record<string, Record<string, unknown>> = {};
  for (const [group, schema] of Object.entries(groups)) {
    defaults[group] = buildGroupDefaults(schema.properties);
  }
  return defaults;
}
