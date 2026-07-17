# Coax

**▶ Live demo — [apps.charliekrug.com/type-coercion-oracle](https://apps.charliekrug.com/type-coercion-oracle/)**

[![CI](https://github.com/ctkrug/type-coercion-oracle/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/type-coercion-oracle/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](LICENSE)

See how JavaScript coerces any two values. Paste them in, pick `==`, `+`,
`Boolean()`, or a template literal, and watch the real ECMAScript spec
algorithm run step by step, with each abstract operation and its spec section
printed underneath the result.

It is not a meme table of the ten famous gotchas. It runs the actual spec
operations (`ToPrimitive`, `ToNumber`, `ToString`, `ToBoolean`, the Abstract
Equality Comparison) on whatever pair of values you type, so it is correct for
the value you are actually debugging, not just the ones someone hardcoded.

## Who it is for

JavaScript and TypeScript developers mid-debug on a coercion bug that is not
one of the famous ten: an object with a custom `valueOf`, a nested array, a
value that arrived from a form field as a string when you expected a number.
Every "JS is weird" post shows you `[] + {}` and tells you to memorize the
answer. None of them show you the algorithm that produced it. Coax does.

## The wow moment

Type `[]` and `{}` into the two operand slots, hit `+`, then swap the operand
order. Two different results, each with its own step-by-step trace through
`ToPrimitive` then `ToNumber`/`ToString` then the `+` operator. Coercion stops
being folklore and starts being a knowable, steppable algorithm.

## Sample trace

`[] + {}`, exactly as the app renders it:

```
1. OrdinaryToPrimitive  7.1.1.1   [].valueOf()  returned an object, skipped
2. OrdinaryToPrimitive  7.1.1.1   [].toString() -> ""
3. OrdinaryToPrimitive  7.1.1.1   {}.valueOf()  returned an object, skipped
4. OrdinaryToPrimitive  7.1.1.1   {}.toString() -> "[object Object]"
5. ToString             7.1.17    "" -> ""
6. ToString             7.1.17    "[object Object]" -> "[object Object]"
7. +                    13.15.3   one primitive is a string, so concatenate

   A + B = "[object Object]"
```

Swap the operands to `{} + []` and the parsing-quirk callout appears: at a
console statement top level the leading `{}` parses as an empty block, so the
statement is really unary `+[]`, which is `0`. The tool shows both the
expression-context and statement-context results side by side.

## Features

- **Operand editor.** Type any two JS literal values (numbers, strings,
  booleans, `null`/`undefined`/`NaN`/`Infinity`, nested arrays and objects).
  Parsed by a restricted literal grammar, never `eval`, so unsupported syntax
  shows an inline error instead of running anything.
- **Four operators.** `==`, `+`, `Boolean(x)` per operand, and
  template-literal interpolation (`` `${a}${b}` ``), each with result badges.
- **Spec step trace.** A numbered trace of every abstract operation invoked,
  showing its spec section, a plain-English detail, and its output value.
- **Parsing-quirk callout.** When operand A is `{}` and the operator is `+`, a
  panel explains why `{} + []` at a console top level disagrees with the same
  values as an expression, and shows both results.

## Usage

```
npm install
npm run dev         # local dev server
npm test            # vitest (140 tests)
npm run typecheck
npm run lint
npm run build       # static output in dist/, subpath-relative
```

Open the dev server and type into Operand A / Operand B. The trace updates
live on every keystroke, no submit button.

## How it works

The engine (`src/spec/`) implements the ECMAScript abstract operations as
plain functions that optionally record each step into a `Tracer`. The UI is a
thin layer that dispatches to the right engine call and renders whatever the
engine actually did. Because the engine is general rather than a lookup table,
it is correct for value pairs nobody thought to hardcode. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the module map,
[`docs/VISION.md`](docs/VISION.md) for the design rationale, and
[`docs/DESIGN.md`](docs/DESIGN.md) for the visual direction.

Scope: the engine covers primitives, plain objects, and arrays.
`Symbol.toPrimitive`, `BigInt`, and exotic objects are out of scope for v1 and
noted where the boundary matters, rather than silently handled wrong.

## Stack

Client-only TypeScript, static-site output (no server, no backend). Built with
Vite, tested with Vitest across the spec engine, the parser, and the DOM layer
(jsdom). Ships as a single `dist/` directory deployable to any static host or
CDN subpath.

## License

[MIT](LICENSE) © Charlie Krug

More of Charlie's projects → https://apps.charliekrug.com
