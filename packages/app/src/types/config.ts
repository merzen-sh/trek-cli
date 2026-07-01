export interface SchemaProp {
  type?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  format?: string;
  pattern?: string;
  properties?: Record<string, SchemaProp>;
  required?: string[];
  items?: SchemaProp;
  additionalProperties?: boolean;

  system?: boolean;
  ui_permissions?: {
    add: boolean;
    delete: boolean;
    edit: boolean;
  };
  ui_type?: {
    component: "color-picker" | "vector2_input" | "vector3_input" | "shadow-picker";
    format?: string;
  };
  validation?: {
    prefix?: string;
    placeholder?: string;
    help_text?: string;
  };
}

export interface SchemaGroup {
  type: string;
  description?: string;
  properties: Record<string, SchemaProp>;
  required?: string[];
}
