/**
 * A restricted, side-effect-free literal-expression parser.
 *
 * Supports exactly the JS literal grammar the oracle needs: primitives,
 * nested arrays, and nested plain objects. It never calls `eval` or
 * `Function`, and it never executes anything from the input — arbitrary
 * identifiers, function calls, and any syntax outside this grammar are
 * rejected with a ParseError rather than silently ignored.
 */
export class ParseError extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(message);
    this.name = "ParseError";
  }
}

const KEYWORD_VALUES = new Map<string, unknown>([
  ["null", null],
  ["undefined", undefined],
  ["true", true],
  ["false", false],
  ["NaN", NaN],
  ["Infinity", Infinity],
]);

export function parseLiteral(source: string): unknown {
  const parser = new Parser(source);
  const value = parser.parseValue();
  parser.skipWhitespace();
  if (!parser.atEnd()) {
    throw new ParseError(`Unexpected trailing input at position ${parser.pos}`, parser.pos);
  }
  return value;
}

const MAX_NESTING_DEPTH = 500;

class Parser {
  pos = 0;
  private depth = 0;

  constructor(private readonly src: string) {}

  atEnd(): boolean {
    return this.pos >= this.src.length;
  }

  skipWhitespace(): void {
    while (!this.atEnd() && /\s/.test(this.src[this.pos])) this.pos++;
  }

  peek(): string {
    return this.src[this.pos] ?? "";
  }

  parseValue(): unknown {
    this.skipWhitespace();
    if (this.atEnd()) {
      throw new ParseError("Unexpected end of input", this.pos);
    }

    const ch = this.peek();
    if (ch === "[") return this.parseArray();
    if (ch === "{") return this.parseObject();
    if (ch === '"' || ch === "'") return this.parseString();
    if (ch === "-" || (ch >= "0" && ch <= "9")) return this.parseNumber();
    return this.parseKeywordOrIdentifier();
  }

  private parseArray(): unknown[] {
    this.expect("[");
    this.enterContainer();
    try {
      const items: unknown[] = [];
      this.skipWhitespace();
      if (this.peek() === "]") {
        this.pos++;
        return items;
      }
      for (;;) {
        items.push(this.parseValue());
        this.skipWhitespace();
        const ch = this.peek();
        if (ch === ",") {
          this.pos++;
          continue;
        }
        if (ch === "]") {
          this.pos++;
          return items;
        }
        throw new ParseError(`Expected ',' or ']' at position ${this.pos}`, this.pos);
      }
    } finally {
      this.depth--;
    }
  }

  private parseObject(): Record<string, unknown> {
    this.expect("{");
    this.enterContainer();
    try {
      const obj: Record<string, unknown> = {};
      this.skipWhitespace();
      if (this.peek() === "}") {
        this.pos++;
        return obj;
      }
      for (;;) {
        this.skipWhitespace();
        const key = this.parseKey();
        this.skipWhitespace();
        this.expect(":");
        const value = this.parseValue();
        obj[key] = value;
        this.skipWhitespace();
        const ch = this.peek();
        if (ch === ",") {
          this.pos++;
          continue;
        }
        if (ch === "}") {
          this.pos++;
          return obj;
        }
        throw new ParseError(`Expected ',' or '}' at position ${this.pos}`, this.pos);
      }
    } finally {
      this.depth--;
    }
  }

  private enterContainer(): void {
    this.depth++;
    if (this.depth > MAX_NESTING_DEPTH) {
      throw new ParseError(`Nesting too deep (max ${MAX_NESTING_DEPTH} levels) at position ${this.pos}`, this.pos);
    }
  }

  private parseKey(): string {
    const ch = this.peek();
    if (ch === '"' || ch === "'") return this.parseString();
    const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(this.src.slice(this.pos));
    if (!match) throw new ParseError(`Expected object key at position ${this.pos}`, this.pos);
    this.pos += match[0].length;
    return match[0];
  }

  private parseString(): string {
    const quote = this.peek();
    this.pos++;
    let result = "";
    while (!this.atEnd() && this.peek() !== quote) {
      let ch = this.src[this.pos];
      if (ch === "\\") {
        this.pos++;
        const escaped = this.src[this.pos];
        const map: Record<string, string> = { n: "\n", t: "\t", r: "\r", "\\": "\\", "'": "'", '"': '"' };
        ch = map[escaped] ?? escaped;
      }
      result += ch;
      this.pos++;
    }
    if (this.peek() !== quote) {
      throw new ParseError(`Unterminated string starting before position ${this.pos}`, this.pos);
    }
    this.pos++;
    return result;
  }

  private parseNumber(): number {
    const match = /^-?(?:Infinity|\d+\.?\d*(?:[eE][+-]?\d+)?)/.exec(this.src.slice(this.pos));
    if (!match) throw new ParseError(`Expected number at position ${this.pos}`, this.pos);
    this.pos += match[0].length;
    return Number(match[0]);
  }

  private parseKeywordOrIdentifier(): unknown {
    const match = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(this.src.slice(this.pos));
    if (!match) throw new ParseError(`Unexpected character '${this.peek()}' at position ${this.pos}`, this.pos);
    const word = match[0];
    if (!KEYWORD_VALUES.has(word)) {
      throw new ParseError(
        `Unsupported expression "${word}" — only literals (numbers, strings, booleans, null, undefined, NaN, Infinity, arrays, objects) are allowed`,
        this.pos,
      );
    }
    this.pos += word.length;
    return KEYWORD_VALUES.get(word);
  }

  private expect(ch: string): void {
    if (this.peek() !== ch) {
      throw new ParseError(`Expected '${ch}' at position ${this.pos}`, this.pos);
    }
    this.pos++;
  }
}
