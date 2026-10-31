import { describe, expect, test } from "bun:test";
import { toShape, toZod } from "../src/schema";

describe("toShape", () => {
  test("required properties stay required, others optional", () => {
    const shape = toShape({
      type: "object",
      properties: { path: { type: "string" }, limit: { type: "integer" } },
      required: ["path"],
    });
    expect(shape.path.safeParse("a").success).toBe(true);
    expect(shape.path.safeParse(undefined).success).toBe(false);
    expect(shape.limit.safeParse(undefined).success).toBe(true);
    expect(shape.limit.safeParse("x").success).toBe(false);
  });

  test("string enum becomes a strict enum", () => {
    const shape = toShape({ type: "object", properties: { mode: { type: "string", enum: ["r", "w"] } }, required: ["mode"] });
    expect(shape.mode.safeParse("r").success).toBe(true);
    expect(shape.mode.safeParse("x").success).toBe(false);
  });

  test("nested arrays and objects", () => {
    const schema = toZod({ type: "array", items: { type: "object", properties: { id: { type: "number" } }, required: ["id"] } });
    expect(schema.safeParse([{ id: 1 }]).success).toBe(true);
    expect(schema.safeParse([{}]).success).toBe(false);
  });

  test("unknown or missing schema accepts anything", () => {
    expect(toZod(undefined).safeParse(123).success).toBe(true);
    expect(toZod({ type: "weird" }).safeParse({ a: 1 }).success).toBe(true);
  });
});
