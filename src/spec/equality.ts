import { Tracer } from "./trace";
import { toPrimitive } from "./toPrimitive";
import { toNumber } from "./toNumber";

type JsType = "undefined" | "null" | "boolean" | "number" | "string" | "object";

function jsTypeOf(value: unknown): JsType {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  return "object";
}

/**
 * ECMA-262 7.2.13 IsLooselyEqual ( x, y ) — the algorithm behind `==`.
 *
 * BigInt/Symbol steps are omitted (out of scope per docs/VISION.md); every
 * other step, including the NaN-never-equals-NaN carve-out and the
 * recursive ToNumber/ToPrimitive coercions, is implemented.
 */
export function looselyEquals(x: unknown, y: unknown, tracer?: Tracer): boolean {
  const xType = jsTypeOf(x);
  const yType = jsTypeOf(y);

  if (xType === yType) {
    const result = sameTypeEquals(x, y, xType);
    tracer?.record({
      operation: "IsLooselyEqual",
      specSection: "7.2.13 step 1",
      input: [x, y],
      output: result,
      detail:
        xType === "number" && (Number.isNaN(x) || Number.isNaN(y))
          ? "Both operands are Number and at least one is NaN; NaN never equals anything, including itself, so the result is false."
          : xType === "object"
            ? "Both operands are objects (or arrays); they are only equal if they are the same reference, which two independently entered operands never are, so the result is false."
            : `Both operands have type ${xType}; compared directly, giving ${result}.`,
    });
    return result;
  }

  if ((x === null && y === undefined) || (x === undefined && y === null)) {
    tracer?.record({
      operation: "IsLooselyEqual",
      specSection: "7.2.13 step 2-3",
      input: [x, y],
      output: true,
      detail: "One operand is null and the other undefined; the spec special-cases this pair as equal.",
    });
    return true;
  }

  if (xType === "number" && yType === "string") {
    note("7.2.13 step 6", x, y, "y is a String; comparing x == ToNumber(y).", tracer);
    return looselyEquals(x, toNumber(y, tracer), tracer);
  }
  if (xType === "string" && yType === "number") {
    note("7.2.13 step 7", x, y, "x is a String; comparing ToNumber(x) == y.", tracer);
    return looselyEquals(toNumber(x, tracer), y, tracer);
  }

  if (xType === "boolean") {
    note("7.2.13 step 9", x, y, "x is a Boolean; comparing ToNumber(x) == y.", tracer);
    return looselyEquals(toNumber(x, tracer), y, tracer);
  }
  if (yType === "boolean") {
    note("7.2.13 step 10", x, y, "y is a Boolean; comparing x == ToNumber(y).", tracer);
    return looselyEquals(x, toNumber(y, tracer), tracer);
  }

  if ((xType === "number" || xType === "string") && yType === "object") {
    note("7.2.13 step 11", x, y, "y is an Object; comparing x == ToPrimitive(y).", tracer);
    return looselyEquals(x, toPrimitive(y, "default", tracer), tracer);
  }
  if (xType === "object" && (yType === "number" || yType === "string")) {
    note("7.2.13 step 12", x, y, "x is an Object; comparing ToPrimitive(x) == y.", tracer);
    return looselyEquals(toPrimitive(x, "default", tracer), y, tracer);
  }

  tracer?.record({
    operation: "IsLooselyEqual",
    specSection: "7.2.13 step 13",
    input: [x, y],
    output: false,
    detail: `No coercion rule connects type ${xType} and type ${yType}; the result is false.`,
  });
  return false;
}

function note(specSection: string, x: unknown, y: unknown, detail: string, tracer?: Tracer): void {
  tracer?.record({ operation: "IsLooselyEqual", specSection, input: [x, y], output: undefined, detail });
}

function sameTypeEquals(x: unknown, y: unknown, type: JsType): boolean {
  switch (type) {
    case "undefined":
    case "null":
      return true;
    case "number":
      return (x as number) === (y as number);
    case "string":
    case "boolean":
      return x === y;
    case "object":
      return x === y;
  }
}
