import { describe, expect, it } from "vitest";
import { Tracer } from "../src/spec/trace";
import { plus, templateConcat } from "../src/spec/operators";

describe("+ operator", () => {
  it("adds two numbers", () => {
    expect(plus(1, 2)).toBe(3);
  });

  it("concatenates when either operand is a string", () => {
    expect(plus("5", 3)).toBe("53");
    expect(plus(3, "5")).toBe("35");
  });

  it("the wow moment: [] + {} and {} + [] disagree", () => {
    expect(plus([], {})).toBe("[object Object]");
    expect(plus({}, [])).toBe("[object Object]");
  });

  it("[] + [] concatenates two empty-string primitives", () => {
    expect(plus([], [])).toBe("");
  });

  it("records at least one ToPrimitive step per operand for object operands", () => {
    const tracer = new Tracer();
    plus({}, []);
    plus({}, [], tracer);
    expect(tracer.steps.filter((s) => s.operation === "ToPrimitive" || s.operation === "OrdinaryToPrimitive").length).toBeGreaterThanOrEqual(2);
  });
});

describe("template-literal interpolation", () => {
  it("matches real template-literal output for primitives", () => {
    expect(templateConcat(1, "a")).toBe(`${1}${"a"}`);
  });

  it("stringifies objects via ToString even when only valueOf is custom", () => {
    const obj = { valueOf: () => 42 };
    expect(templateConcat(obj, "")).toBe(`${obj}`);
  });

  it("empty operands produce the empty string", () => {
    expect(templateConcat("", "")).toBe("");
  });
});
