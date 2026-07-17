# Vision

## The problem

Every explainer on JavaScript type coercion is the same ten-item meme table:
`[] + []`, `'5' + 3`, `1 == '1'`, `NaN === NaN`. They're memorable but they
teach memorization, not understanding. The moment you hit a coercion bug on
a value that isn't in the famous ten — some object with a custom `valueOf`,
a nested array, a value that came out of a form field as a string when you
expected a number — those explainers are useless. You're back to pasting
into a scratch `node` REPL and guessing.

The actual mechanism behind all of it — `ToPrimitive`, `ToNumber`,
`ToString`, the Abstract Equality Comparison — is not secret or even that
complicated. It's a short, deterministic algorithm published in the ECMA-262
spec. Almost nobody reads it, because the spec is dense and nobody's built a
tool that turns "read the spec" into "type your two values and watch the
spec run."

## Who it's for

JavaScript/TypeScript developers who are mid-debug on an actual coercion
bug — not students browsing curiosities. The tool needs to be fast to open,
fast to paste two real values into, and immediately legible about *why* the
result is what it is. Secondary audience: people teaching or learning JS
who want the real mechanism instead of a mnemonic.

## The core idea

Implement the ECMAScript abstract operations that govern coercion —
`ToPrimitive` (7.1.1), `ToNumber` (7.1.4), `ToString` (7.1.17), `ToBoolean`
(7.1.2), and the Abstract/Strict Equality Comparison algorithms (7.2.13 /
7.2.14) — as real, traced TypeScript functions, not a lookup table of known
gotchas. Every call optionally records each intermediate step (operation
name, spec section, input, output, human-readable detail) to a `Tracer`.
The UI is a thin layer on top: two operand inputs, an operator strip, and a
rendered trace of whatever the engine actually did for *this* pair of
values. Because the engine is general, it's correct for values nobody
thought to hardcode — that's the whole edge over the meme-table sites.

## Key design decisions

- **Spec-accurate, not spec-complete.** The engine implements the abstract
  operations needed for coercion of primitives, plain objects, and arrays.
  `Symbol.toPrimitive`, `BigInt`, and exotic objects (Proxies, Dates with
  custom `valueOf`) are out of scope for v1 — they're real spec paths but
  not where the wow moment lives. Note the boundary explicitly in the UI
  rather than silently getting it wrong.
- **Trace is a first-class data structure, not a formatted string.** `Tracer`
  records structured `TraceStep` objects (`operation`, `specSection`,
  `input`, `output`, `detail`). The renderer formats them; a future
  permalink feature can serialize them directly. This also makes the
  engine trivially unit-testable independent of any DOM.
- **Client-only, no backend.** Every value typed into the tool stays in the
  browser. This also means the entire product ships as a static site
  (`dist/`), deployable to any static host or subpath with zero
  infrastructure.
- **Live evaluation, no submit button.** Coercion bugs are explored
  iteratively — tweak one operand, see how the trace changes. A submit step
  would break that loop.
- **Design direction decided up front** (`docs/DESIGN.md`): blueprint/
  technical, because the product's whole thesis — "this is a knowable
  algorithm, not folklore" — should be visible in the visual language
  before a single line of copy explains it.

## What "v1 done" looks like

- Two operand inputs accept arbitrary JS-literal expressions (primitives,
  arrays, plain objects, `null`/`undefined`, `NaN`, `-0`).
- All four target operations work end to end: `==`, `+`, `Boolean()` (per
  operand), and template-literal interpolation.
- Every result is accompanied by a rendered, numbered spec-step trace with
  spec-section citations, not just a bare answer.
- The wow moment (`[] + {}` vs `{} + []`) is reachable from a fresh page
  load in under 10 seconds, including via a one-click preset.
- The page matches `docs/DESIGN.md`'s direction and passes the shared
  design standard's craft/self-review bar (responsive at 390/768/1440,
  themed interaction states, no anti-generic tells).
- CI is green (typecheck, lint, tests, build) and the static build is
  deployable to a subpath with no absolute-path assumptions.
