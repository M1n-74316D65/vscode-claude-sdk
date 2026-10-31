import { z } from "zod";

// Copilot sends tool inputSchema as JSON Schema. Covers the common subset; anything else becomes z.any().
interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  description?: string;
}

export function toZod(schema: JsonSchema | undefined): z.ZodType {
  if (!schema || typeof schema !== "object") return z.any();
  let out: z.ZodType;
  if (Array.isArray(schema.enum) && schema.enum.length > 0 && schema.enum.every((v) => typeof v === "string")) {
    out = z.enum(schema.enum as [string, ...string[]]);
  } else {
    switch (schema.type) {
      case "string":
        out = z.string();
        break;
      case "number":
      case "integer":
        out = z.number();
        break;
      case "boolean":
        out = z.boolean();
        break;
      case "array":
        out = z.array(toZod(schema.items));
        break;
      case "object":
        out = z.object(toShape(schema));
        break;
      default:
        out = z.any();
    }
  }
  return schema.description ? out.describe(schema.description) : out;
}

// Top-level object schema -> raw shape for the SDK tool() helper.
export function toShape(schema: JsonSchema): Record<string, z.ZodType> {
  const required = new Set(schema.required ?? []);
  return Object.fromEntries(
    Object.entries(schema.properties ?? {}).map(([key, prop]) => {
      const zodProp = toZod(prop);
      return [key, required.has(key) ? zodProp : zodProp.optional()];
    }),
  );
}
