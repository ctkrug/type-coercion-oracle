# Architecture

A client-only static site. No backend, no build-time data — every value
typed into the app stays in the browser and is recomputed on every
keystroke.

## Data flow

```
operand text (2x) --parseLiteral--> JS value (2x)
                                        |
                                        v
                          evaluateOperator(operator, a, b)
                                        |
                    +-------------------+-------------------+
                    |                                       |
              spec/* engine calls                    ui/operators.ts
              (each records TraceStep[]                (dispatches to the
               into a Tracer)                           right engine fn,
                                        |                shapes result
                                        v                badges)
                              TraceStep[] + badges
                                        |
                                        v
                    ui/traceRenderer.ts + main.ts render()
                                        |
                                        v
                                    DOM (via ui/dom.ts's el())
```

## Modules

- **`src/spec/`** — the ECMAScript abstract operations, implemented as
  plain functions that optionally take a `Tracer` and record each step:
  - `trace.ts` — `Tracer`/`TraceStep`, the shared recording structure.
  - `toPrimitive.ts` — 7.1.1 ToPrimitive (OrdinaryToPrimitive path only;
    no `Symbol.toPrimitive`, documented as out of scope in VISION.md).
  - `toNumber.ts` — 7.1.4 ToNumber.
  - `toStringSpec.ts` — 7.1.17 ToString (named to avoid shadowing
    `Object.prototype.toString`).
  - `toBoolean.ts` — 7.1.2 ToBoolean.
  - `equality.ts` — 7.2.13 Abstract Equality Comparison (`==`), recursive,
    BigInt/Symbol steps omitted.
  - `operators.ts` — the `+` operator (13.15.3
    ApplyStringOrNumericBinaryOperator) and template-literal concatenation.

  These are unit-tested independently of the DOM (`test/*.test.ts`) and
  are the only place spec logic lives — the UI never reimplements a
  coercion rule.

- **`src/parse/literal.ts`** — a restricted recursive-descent parser for a
  JS-literal grammar (primitives, nested arrays/objects). This is what
  turns operand textbox input into real JS values without `eval`.
  Anything outside the grammar throws `ParseError`.

- **`src/ui/`** — thin presentation layer over the engine:
  - `dom.ts` — `el()`, a small element builder that only ever writes text
    via `textContent`/DOM properties (never `innerHTML`), so rendering
    user-typed values can't become an XSS vector.
  - `format.ts` — `formatValue()`, turns a parsed value back into literal
    source for readouts and trace step output.
  - `operators.ts` — `evaluateOperator()`, maps an `OperatorId` to the
    right `spec/*` call(s) and shapes the result into badges + a merged
    trace.
  - `traceRenderer.ts` — renders `TraceStep[]` as the numbered, connected
    callout column, staggering each step's reveal by 90ms unless
    `prefers-reduced-motion` is set.

- **`src/main.ts`** — app entrypoint. Holds the only mutable state (two
  operand source strings + the selected operator), builds the DOM shell
  once, and re-runs `render()` on every input/operator change. Handles
  three states: valid trace, per-operand parse error (inline, doesn't
  block the other operand or the operator strip), and an evaluation
  `TypeError` (defensive — unreachable via the literal-parser grammar
  today, but the engine's public contract can throw).

- **`src/style.css`** — the full token system and layout from
  `docs/DESIGN.md` (blueprint/technical direction): CSS custom properties
  for color/type/spacing/motion, the two-column desktop / stacked-mobile
  grid, and every control's hover/focus-visible/active state.

## Run / test

```
npm run dev        # vite dev server
npm run build       # tsc --noEmit && vite build -> dist/
npm test            # vitest run
npm run typecheck
npm run lint
```

`vite.config.ts` sets `base: "./"` so the production build is relative
and deployable to a subpath (`apps.charliekrug.com/type-coercion-oracle/`)
with no absolute-path asset requests.

## Known gaps (see docs/BACKLOG.md Epic 2/3)

- The operand grammar covers literals only — no presets gallery, no
  shareable permalink yet.
- No automated a11y/contrast audit beyond manual review.
