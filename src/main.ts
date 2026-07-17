import { parseLiteral, ParseError } from "./parse/literal";
import { toNumber } from "./spec/toNumber";
import { evaluateOperator, OPERATORS, OperatorId } from "./ui/operators";
import { renderTrace } from "./ui/traceRenderer";
import { formatValue } from "./ui/format";
import { el } from "./ui/dom";

interface State {
  aSource: string;
  bSource: string;
  operator: OperatorId;
}

const state: State = {
  aSource: "[]",
  bSource: "{}",
  operator: "plus",
};

function parseOperand(source: string): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: parseLiteral(source) };
  } catch (err) {
    return { ok: false, message: err instanceof ParseError ? err.message : "Could not parse this expression." };
  }
}

function buildShell(root: HTMLElement): {
  aInput: HTMLInputElement;
  bInput: HTMLInputElement;
  aReadout: HTMLElement;
  bReadout: HTMLElement;
  aError: HTMLElement;
  bError: HTMLElement;
  operatorStrip: HTMLElement;
  resultRow: HTMLElement;
  tracePanel: HTMLElement;
  quirkCallout: HTMLElement;
} {
  const aInput = el("input", {
    className: "operand-card__input",
    id: "operand-a",
    type: "text",
    value: state.aSource,
    "aria-describedby": "operand-a-error",
  });
  aInput.setAttribute("spellcheck", "false");
  aInput.setAttribute("autocomplete", "off");

  const bInput = el("input", {
    className: "operand-card__input",
    id: "operand-b",
    type: "text",
    value: state.bSource,
    "aria-describedby": "operand-b-error",
  });
  bInput.setAttribute("spellcheck", "false");
  bInput.setAttribute("autocomplete", "off");
  const aReadout = el("p", { className: "operand-card__readout" }, []);
  const bReadout = el("p", { className: "operand-card__readout" }, []);
  const aError = el("p", { className: "operand-card__error", id: "operand-a-error", role: "alert" }, []);
  const bError = el("p", { className: "operand-card__error", id: "operand-b-error", role: "alert" }, []);

  const operandColumn = el("section", { className: "operand-column", "aria-label": "Operands" }, [
    el("div", { className: "operand-card", "data-operand": "a" }, [
      el("label", { className: "operand-card__label", htmlFor: "operand-a" }, ["Operand A"]),
      aInput,
      aReadout,
      aError,
    ]),
    el("div", { className: "operand-card", "data-operand": "b" }, [
      el("label", { className: "operand-card__label", htmlFor: "operand-b" }, ["Operand B"]),
      bInput,
      bReadout,
      bError,
    ]),
  ]);

  const operatorStrip = el("div", { className: "operator-strip", role: "radiogroup", "aria-label": "Operator" }, []);
  operandColumn.append(operatorStrip);

  const resultRow = el("div", { className: "result-row" }, []);
  const quirkCallout = el("div", { className: "quirk-callout" }, []);
  quirkCallout.hidden = true;
  const tracePanel = el(
    "section",
    { className: "trace-panel", "aria-label": "Spec trace", "aria-live": "polite" },
    [],
  );

  const traceColumn = el("section", { className: "trace-column" }, [resultRow, quirkCallout, tracePanel]);

  const wordmark = el("header", { className: "site-header" }, [
    el("h1", { className: "wordmark" }, [
      "Type Coercion ",
      el("span", { className: "wordmark__accent" }, ["Oracle"]),
    ]),
    el("p", { className: "tagline" }, [
      "Type any two JavaScript values. Watch ==, +, Boolean(), and template-literal coercion run for real.",
    ]),
  ]);

  const main = el("main", { className: "oracle-grid" }, [operandColumn, traceColumn]);

  root.append(wordmark, main);

  return { aInput, bInput, aReadout, bReadout, aError, bError, operatorStrip, resultRow, tracePanel, quirkCallout };
}

function renderOperatorStrip(container: HTMLElement, onSelect: (id: OperatorId) => void): void {
  container.replaceChildren(
    ...OPERATORS.map((op) =>
      el(
        "button",
        {
          type: "button",
          className: `operator-toggle${state.operator === op.id ? " operator-toggle--active" : ""}`,
          role: "radio",
          "aria-checked": String(state.operator === op.id),
        },
        [op.label],
      ),
    ),
  );
  [...container.children].forEach((btn, i) => {
    btn.addEventListener("click", () => onSelect(OPERATORS[i].id));
  });
}

function renderQuirkCallout(container: HTMLElement, aParsed: unknown, bOk: boolean, bValue: unknown): void {
  if (state.operator !== "plus" || state.aSource.trim() !== "{}" || !bOk) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  const statementResult = toNumber(bValue);
  container.hidden = false;
  container.replaceChildren(
    el("h2", { className: "quirk-callout__title" }, ["Parsing quirk, not a coercion swap"]),
    el("p", {}, [
      "This tool treats operand A as an object-literal expression, so A + B here is ",
      el("code", {}, [formatValue(aParsed)]),
      " + B — a coercion. But if you typed ",
      el("code", {}, ["{} + B"]),
      " at a console/statement top level, the leading ",
      el("code", {}, ["{}"]),
      " parses as an empty block, not an object literal. The statement actually evaluated is unary ",
      el("code", {}, ["+B"]),
      ".",
    ]),
    el("div", { className: "quirk-callout__row" }, [
      el("span", { className: "quirk-callout__label" }, ["Expression context (this tool)"]),
      el("code", { className: "quirk-callout__value" }, ["[object Object]"]),
    ]),
    el("div", { className: "quirk-callout__row" }, [
      el("span", { className: "quirk-callout__label" }, ["Statement context (console top level)"]),
      el("code", { className: "quirk-callout__value" }, [formatValue(statementResult)]),
    ]),
  );
}

function render(refs: ReturnType<typeof buildShell>): void {
  const aResult = parseOperand(state.aSource);
  const bResult = parseOperand(state.bSource);

  refs.aError.textContent = aResult.ok ? "" : aResult.message;
  refs.bError.textContent = bResult.ok ? "" : bResult.message;
  refs.aReadout.textContent = aResult.ok ? `= ${formatValue(aResult.value)}` : "";
  refs.bReadout.textContent = bResult.ok ? `= ${formatValue(bResult.value)}` : "";

  renderQuirkCallout(refs.quirkCallout, aResult.ok ? aResult.value : undefined, bResult.ok, bResult.ok ? bResult.value : undefined);

  if (!aResult.ok || !bResult.ok) {
    refs.resultRow.replaceChildren();
    refs.tracePanel.replaceChildren(
      el("p", { className: "trace-panel__empty" }, ["Fix the invalid operand above to see the trace."]),
    );
    return;
  }

  try {
    const outcome = evaluateOperator(state.operator, aResult.value, bResult.value);
    refs.resultRow.replaceChildren(
      ...outcome.badges.map((badge) =>
        el("div", { className: `result-badge result-badge--${badge.kind}` }, [
          el("span", { className: "result-badge__label" }, [badge.label]),
          el("span", { className: "result-badge__value" }, [badge.value]),
        ]),
      ),
    );
    refs.tracePanel.replaceChildren(renderTrace(outcome.steps));
  } catch (err) {
    const message = err instanceof Error ? err.message : "This coercion throws a TypeError.";
    refs.resultRow.replaceChildren(
      el("div", { className: "result-badge result-badge--danger" }, [
        el("span", { className: "result-badge__label" }, ["TypeError"]),
        el("span", { className: "result-badge__value" }, [message]),
      ]),
    );
    refs.tracePanel.replaceChildren(
      el("p", { className: "trace-panel__empty" }, [
        "Evaluation threw before producing a full trace: ",
        message,
      ]),
    );
  }
}

function main(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) return;
  app.replaceChildren();

  const refs = buildShell(app);

  function selectOperator(id: OperatorId): void {
    state.operator = id;
    renderOperatorStrip(refs.operatorStrip, selectOperator);
    render(refs);
  }
  renderOperatorStrip(refs.operatorStrip, selectOperator);

  refs.aInput.addEventListener("input", () => {
    state.aSource = refs.aInput.value;
    render(refs);
  });
  refs.bInput.addEventListener("input", () => {
    state.bSource = refs.bInput.value;
    render(refs);
  });

  render(refs);
}

main();
