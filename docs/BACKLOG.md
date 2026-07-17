# Backlog

Epics are ordered so the wow moment ships first. Every story has 1-3
verifiable acceptance criteria — concrete checks, not vibes.

## Epic 1 — The Oracle core (wow moment first)

- [x] **1.1 Operand editor + `+` operator, including the `{} + []` parsing
  quirk (WOW MOMENT)**
  - Entering `[]` as operand A and `{}` as operand B, then selecting `+`,
    shows the result `"[object Object]"` with a rendered trace listing
    `ToPrimitive(default)` → `ToString`/`ToNumber` steps for each operand,
    each citing its spec section.
  - The page also shows the well-known statement-context answer: when a
    leading `{}` is parsed as an empty block rather than an object
    literal (as happens when `{} + []` is typed at a console top level),
    unary `+[]` evaluates to `0`. Both the expression-context result
    (`"[object Object]"`) and this statement-context result (`0`) are
    shown side by side with a one-line explanation of why they differ —
    a parsing quirk, not a coercion swap.
  - Swapping operand A/B and re-running updates the trace within one
    render tick (no stale trace left on screen).

- [x] **1.2 Harden the ToPrimitive/ToNumber/ToString engine**
  - `toNumber`/`toStringSpec` correctly handle: objects with a custom
    `valueOf`, arrays with >1 element (`ToNumber([1,2])` is `NaN`), `-0`
    (stringifies to `"0"`, but `Object.is` trace distinguishes it from
    `+0`), and `NaN`/`Infinity`.
  - Calling `toPrimitive` on an object whose `valueOf`/`toString` both
    return objects throws a `TypeError`, and that error is caught and
    rendered as a designed error state, not an unhandled exception.
  - Unit tests cover each case above and pass in CI.

- [x] **1.3 Abstract Equality Comparison (`==`) operator**
  - Selecting `==` on two operands of different types (e.g. `1` and
    `'1'`, `null` and `undefined`, `0` and `false`) shows the correct
    boolean result and a trace following ECMA-262 7.2.13 step-by-step,
    including which operand got coerced via `ToNumber`.
  - `NaN == NaN` shows `false` with a trace step explicitly noting the
    spec's `NaN`-never-equals-`NaN` rule (not silently falling out of
    generic numeric comparison).

- [x] **1.4 `Boolean()` (ToBoolean) operator**
  - Selecting `Boolean()` evaluates it independently per operand (two
    badges, not one), correctly marking `0`, `''`, `NaN`, `null`,
    `undefined`, and `false` as falsy and everything else — including
    `[]` and `{}` — as truthy, each with a one-line spec citation
    (7.1.2).

- [x] **1.5 Template-literal interpolation operator**
  - Selecting the template-literal operator shows the result of
    `` `${A}${B}` `` and a trace reusing the `ToString` engine for each
    operand, matching real template-literal semantics (e.g. an object
    with only `valueOf` still stringifies via `ToPrimitive(string)` →
    `toString` fallback, not `valueOf`).

- [x] **1.6 Design polish — apply DESIGN.md to the core oracle**
  - The operand editor + operator strip + trace panel use the tokens and
    two-column hero layout from `docs/DESIGN.md` (blueprint palette,
    Space Grotesk/JetBrains Mono pairing) at 1440px, not scaffold
    default styling.
  - Trace steps render with the staggered reveal cascade described in
    DESIGN.md, and that animation is skipped (instant reveal) when
    `prefers-reduced-motion` is set.

## Epic 2 — Real-world usability

- [x] **2.1 Arbitrary operand input via safe expression parsing**
  - Users can type any JS-literal-shaped expression (nested arrays,
    nested plain objects, `null`, `undefined`, `NaN`, negative numbers,
    strings with escapes) into either operand field, not just a fixed
    preset list.
  - Input is parsed as a restricted literal grammar (no arbitrary code
    execution / no function calls other than recognized literal forms)
    so the tool never `eval`s attacker-controlled strings.
  - Typing something outside the supported grammar (e.g. a bare
    identifier, a function call) shows an inline "unsupported
    expression" message instead of crashing the page.

- [ ] **2.2 Preset gotcha gallery**
  - A secondary panel lists at least 8 classic gotchas (`[] + []`,
    `'5' + 3`, `1 == '1'`, `null == undefined`, `NaN === NaN`, etc.) as
    one-click "load into operands" buttons, visually secondary to the
    operand editor (per DESIGN.md's layout intent — the editor stays
    the hero).
  - Clicking a preset populates both operands and the operator and
    immediately renders that trace.

- [ ] **2.3 Shareable permalink**
  - The current operand pair + operator are encoded into the URL (query
    string or hash) on every change.
  - Loading a URL with an encoded state reproduces the exact same
    operands, operator, and trace on first paint, with no extra click.

- [ ] **2.4 Inline error handling for invalid input**
  - An operand that throws during evaluation (e.g. the
    both-methods-return-an-object `TypeError` case from 1.2) renders a
    designed inline error state on that operand's card, not a blank
    result or a browser console-only error.
  - The rest of the UI (the other operand, the operator strip) stays
    interactive while an error is shown.

- [ ] **2.5 Design polish — operator strip, presets, and states**
  - Every control (operator toggle, preset button, operand input) has
    themed hover/focus-visible/active states per DESIGN.md — no naked
    native buttons/selects.
  - Empty state (no operands entered yet) and error state are designed,
    not blank or default-browser-styled.

## Epic 3 — Ship readiness

- [x] **3.1 Responsive layout across breakpoints**
  - The app is usable with no horizontal scroll and no overlapping
    elements at 390px, 768px, and 1440px widths, matching the two
    layouts (desktop two-column, mobile stacked) specified in
    `docs/DESIGN.md`.

- [x] **3.2 Accessibility pass**
  - All interactive controls are reachable and operable via keyboard
    alone, with a visible focus ring at every stop.
  - The trace panel result updates are announced via an `aria-live`
    region so screen-reader users know the answer changed without
    re-reading the whole panel.
  - Text/background color pairs meet 4.5:1 contrast per the DESIGN.md
    token set.

- [ ] **3.3 Brand assets — favicon and animated wordmark**
  - A code-generated SVG favicon (blueprint accent + `≟` monogram)
    replaces the scaffold placeholder and is used as the site favicon.
  - The wordmark's monogram plays its stroke-dasharray "draw-on"
    animation once on first load, and is static (no animation) when
    `prefers-reduced-motion` is set.

- [x] **3.4 Deploy readiness for subpath hosting**
  - Running the production build (`npm run build`) and serving `dist/`
    from a non-root subpath (e.g. `/type-coercion-oracle/`) loads with
    no broken asset requests — confirms every asset reference is
    relative, not absolute.
  - CI (`ci.yml`) passes lint, typecheck, tests, and build on a clean
    checkout.
