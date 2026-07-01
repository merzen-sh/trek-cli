import type { SchemaProp } from "../types/config";

export function flattenSchemaPaths(
  properties: Record<string, SchemaProp>,
  prefix = "",
): Array<{ path: string; label: string; type: string }> {
  let items: Array<{ path: string; label: string; type: string }> = [];

  for (const [key, prop] of Object.entries(properties)) {
    if (prop.system) continue;
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

export function buildItemDefaults(itemsSchema: SchemaProp): Record<string, unknown> {
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

export function stripSystemFields(
  properties: Record<string, SchemaProp>,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const prop = properties[key];
    if (prop?.system) continue;
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      prop?.type === "object" &&
      prop?.properties
    ) {
      result[key] = stripSystemFields(prop.properties, value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function buildDefaults(
  properties: Record<string, SchemaProp>,
  _required: string[],
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [key, prop] of Object.entries(properties)) {
    if (prop.system) continue;
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
