import { z } from "zod";

export function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodType {
  return z.fromJSONSchema(schema);
}
