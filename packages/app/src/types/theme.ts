export interface ColorValue {
  raw: string;
  hex_preview: string;
}

export interface FontValue {
  family: string;
}

export interface LengthValue {
  numeric_value: number;
  unit: string;
}

export interface NumberValue {
  value: number;
}

export type PropertyValue =
  | { type: "Color"; value: ColorValue }
  | { type: "Font"; value: FontValue }
  | { type: "Length"; value: LengthValue }
  | { type: "Number"; value: NumberValue };

export interface ThemeData {
  root: Record<string, PropertyValue>;
  dark: Record<string, PropertyValue>;
}

export function isColorValue(pv: PropertyValue): pv is { type: "Color"; value: ColorValue } {
  return pv.type === "Color";
}

export function getPropertyType(pv: PropertyValue): string {
  return pv.type;
}

export function getDisplayValue(pv: PropertyValue): string {
  switch (pv.type) {
    case "Color":
      return pv.value.raw;
    case "Font":
      return pv.value.family;
    case "Length":
      return `${pv.value.numeric_value}${pv.value.unit}`;
    case "Number":
      return String(pv.value.value);
  }
}
