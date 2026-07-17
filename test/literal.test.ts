import { describe, expect, it } from "vitest";
import { parseLiteral, ParseError } from "../src/parse/literal";

describe("parseLiteral", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["true", true],
    ["false", false],
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["-Infinity", -Infinity],
    ["0", 0],
    ["-0", -0],
    ["42", 42],
    ["-3.5", -3.5],
    ["1e3", 1000],
    ["''", ""],
    ["'hello'", "hello"],
    ['"quoted"', "quoted"],
    ["'a\\'b'", "a'b"],
    ["[]", []],
    ["[1, 2, 3]", [1, 2, 3]],
    ["[[1], [2]]", [[1], [2]]],
    ["{}", {}],
    ["{a: 1}", { a: 1 }],
    ["{'a b': 1, c: [2]}", { "a b": 1, c: [2] }],
  ])("parses %s", (src, expected) => {
    expect(parseLiteral(src)).toEqual(expected);
  });

  it("distinguishes -0 from 0", () => {
    expect(Object.is(parseLiteral("-0"), -0)).toBe(true);
  });

  it.each([
    ["", "empty input"],
    ["foo", "bare identifier"],
    ["foo()", "function call"],
    ["[1, 2", "unterminated array"],
    ["{a: 1", "unterminated object"],
    ["'unterminated", "unterminated string"],
    ["[1] extra", "trailing input"],
    ["{a 1}", "missing colon"],
    ["toString", "Object.prototype member as bare identifier"],
    ["constructor", "constructor as bare identifier"],
    ["valueOf", "valueOf as bare identifier"],
    ["hasOwnProperty", "hasOwnProperty as bare identifier"],
    ["__proto__", "__proto__ as bare identifier"],
  ])("rejects %s (%s)", (src) => {
    expect(() => parseLiteral(src)).toThrow(ParseError);
  });

  it("rejects pathologically deep nesting as a ParseError instead of overflowing the stack", () => {
    const depth = 5000;
    const src = "[".repeat(depth) + "1" + "]".repeat(depth);
    expect(() => parseLiteral(src)).toThrow(ParseError);
  });

  it("accepts nesting comfortably within the depth limit", () => {
    const depth = 100;
    const src = "[".repeat(depth) + "1" + "]".repeat(depth);
    expect(() => parseLiteral(src)).not.toThrow();
  });
});
