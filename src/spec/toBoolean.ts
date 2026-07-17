import { Tracer } from "./trace";

/**
 * ECMA-262 7.1.2 ToBoolean ( argument )
 *
 * No object path needed: every object (including [] and {}) is truthy,
 * so this never touches ToPrimitive.
 */
export function toBoolean(argument: unknown, tracer?: Tracer): boolean {
  const falsy =
    argument === undefined ||
    argument === null ||
    argument === false ||
    (typeof argument === "number" && (argument === 0 || Number.isNaN(argument))) ||
    argument === "";

  const result = !falsy;

  tracer?.record({
    operation: "ToBoolean",
    specSection: "7.1.2",
    input: argument,
    output: result,
    detail: falsy
      ? `${describe(argument)} is one of the falsy values (undefined, null, false, ±0, NaN, ""), so ToBoolean returns false.`
      : `${describe(argument)} is not one of the falsy values, so ToBoolean returns true.`,
  });

  return result;
}

function describe(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Object.is(value, -0)) return "-0";
  if (typeof value === "object" && value !== null) return Array.isArray(value) ? "[array]" : "[object]";
  return String(value);
}
