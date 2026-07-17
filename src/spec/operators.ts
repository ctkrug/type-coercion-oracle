import { Tracer } from "./trace";
import { toPrimitive } from "./toPrimitive";
import { toNumber } from "./toNumber";
import { toStringSpec } from "./toStringSpec";

/**
 * ECMA-262 13.15.3 ApplyStringOrNumericBinaryOperator for "+".
 *
 * Each operand goes through ToPrimitive(default) first; if either
 * primitive is a string, both are stringified and concatenated,
 * otherwise both are converted to numbers and added.
 */
export function plus(a: unknown, b: unknown, tracer?: Tracer): string | number {
  const aPrim = toPrimitive(a, "default", tracer);
  const bPrim = toPrimitive(b, "default", tracer);

  if (typeof aPrim === "string" || typeof bPrim === "string") {
    const aStr = toStringSpec(aPrim, tracer);
    const bStr = toStringSpec(bPrim, tracer);
    const result = aStr + bStr;
    tracer?.record({
      operation: "+",
      specSection: "13.15.3",
      input: [a, b],
      output: result,
      detail: "At least one primitive is a string, so both operands are stringified and concatenated.",
    });
    return result;
  }

  const aNum = toNumber(aPrim, tracer);
  const bNum = toNumber(bPrim, tracer);
  const result = aNum + bNum;
  tracer?.record({
    operation: "+",
    specSection: "13.15.3",
    input: [a, b],
    output: result,
    detail: "Neither primitive is a string, so both operands are converted to numbers and added.",
  });
  return result;
}

/**
 * Template-literal interpolation: `${a}${b}`.
 *
 * The spec applies ToString directly to each substitution, which for
 * objects means ToPrimitive(string) -> toString()/valueOf() fallback —
 * distinct from `+`'s ToPrimitive(default).
 */
export function templateConcat(a: unknown, b: unknown, tracer?: Tracer): string {
  const aStr = toStringSpec(a, tracer);
  const bStr = toStringSpec(b, tracer);
  const result = aStr + bStr;
  tracer?.record({
    operation: "TemplateLiteral",
    specSection: "13.2.8.1",
    input: [a, b],
    output: result,
    detail: "Each substitution is converted via ToString and concatenated.",
  });
  return result;
}
