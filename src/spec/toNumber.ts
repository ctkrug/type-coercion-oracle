import { Tracer } from "./trace";
import { toPrimitive } from "./toPrimitive";

/**
 * ECMA-262 7.1.4 ToNumber ( argument )
 *
 * Delegates object handling to ToPrimitive(argument, "number") and then
 * converts the resulting primitive using the same string-parsing and
 * boolean/null/undefined rules as the spec table.
 */
export function toNumber(argument: unknown, tracer?: Tracer): number {
  if (typeof argument === "object" && argument !== null) {
    const primitive = toPrimitive(argument, "number", tracer);
    return toNumber(primitive, tracer);
  }

  let result: number;
  if (argument === undefined) {
    result = NaN;
  } else if (argument === null) {
    result = 0;
  } else if (typeof argument === "boolean") {
    result = argument ? 1 : 0;
  } else if (typeof argument === "number") {
    result = argument;
  } else if (typeof argument === "string") {
    const trimmed = argument.trim();
    result = trimmed === "" ? 0 : Number(trimmed);
  } else {
    throw new TypeError("Cannot convert value to a number");
  }

  tracer?.record({
    operation: "ToNumber",
    specSection: "7.1.4",
    input: argument,
    output: result,
    detail: `Converted ${describe(argument)} to number ${describe(result)}.`,
  });
  return result;
}

function describe(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (Object.is(value, -0)) return "-0";
  }
  return String(value);
}
