import { describe, expect, it } from "vitest";
import { Tracer } from "../src/spec/trace";
import { toBoolean } from "../src/spec/toBoolean";

describe("ToBoolean", () => {
  it.each([
    [undefined, false],
    [null, false],
    [false, false],
    [0, false],
    [-0, false],
    [NaN, false],
    ["", false],
    [true, true],
    [1, true],
    [-1, true],
    ["0", true],
    ["false", true],
    [[], true],
    [{}, true],
  ])("ToBoolean(%p) is %p", (input, expected) => {
    expect(toBoolean(input)).toBe(expected);
  });

  it("records a ToBoolean trace step citing 7.1.2", () => {
    const tracer = new Tracer();
    toBoolean(0, tracer);
    expect(tracer.steps).toHaveLength(1);
    expect(tracer.steps[0]).toMatchObject({ operation: "ToBoolean", specSection: "7.1.2", output: false });
  });
});
