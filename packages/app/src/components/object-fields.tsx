import { Button } from "ui";
import { Plus, Trash2 } from "lucide-react";
import { ScalarField } from "./scalar-field";
import { buildItemDefaults } from "../lib/config-utils";
import type { SchemaProp } from "../types/config";

function ObjectFieldsInner({
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
              <ObjectFieldsInner
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
                    <ObjectFieldsInner
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

export { ObjectFieldsInner as ObjectFields };
