import { describe, expect, it } from "vitest";
import { Tracer } from "../src/spec/trace";
import { toPrimitive } from "../src/spec/toPrimitive";
import { toNumber } from "../src/spec/toNumber";
import { toStringSpec } from "../src/spec/toStringSpec";

describe("ToNumber hardening", () => {
  it("uses a custom valueOf over the default toString", () => {
    const withValueOf = { valueOf: () => 42, toString: () => "not this" };
    expect(toNumber(withValueOf)).toBe(42);
  });

  it("returns NaN for an array with more than one element", () => {
    expect(toNumber([1, 2])).toBe(NaN);
  });

  it("distinguishes -0 from +0 in the trace detail while both stringify to \"0\"", () => {
    const negTracer = new Tracer();
    toNumber("-0", negTracer);
    const posTracer = new Tracer();
    toNumber("0", posTracer);

    expect(Object.is(negTracer.steps.at(-1)?.output, -0)).toBe(true);
    expect(negTracer.steps.at(-1)?.detail).toContain("-0");
    expect(posTracer.steps.at(-1)?.detail).not.toContain("-0");
  });

  it("handles NaN and Infinity inputs", () => {
    expect(toNumber(NaN)).toBe(NaN);
    expect(toNumber(Infinity)).toBe(Infinity);
    expect(toNumber("Infinity")).toBe(Infinity);
  });
});

describe("ToPrimitive TypeError", () => {
  it("throws when both valueOf and toString return objects", () => {
    const hostile = {
      valueOf: () => ({}),
      toString: () => ({}),
    };
    expect(() => toPrimitive(hostile)).toThrow(TypeError);
    expect(() => toNumber(hostile)).toThrow(TypeError);
    expect(() => toStringSpec(hostile)).toThrow(TypeError);
  });
});
