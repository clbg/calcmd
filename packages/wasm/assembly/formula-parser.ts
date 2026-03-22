// Formula Parser: "Qty*Price" → AST (WASM version)

import {
  Expression,
  LiteralExpression,
  ColumnRefExpression,
  LabelRefExpression,
  BinaryExpression,
  UnaryExpression,
  FunctionCallExpression,
  ParenExpression,
  NumberValue,
  StringValue,
  BooleanValue,
} from './types';
import { isDigit } from './utils';

class Token {
  type: string;
  value: string;

  constructor(type: string, value: string) {
    this.type = type;
    this.value = value;
  }
}

export class FormulaParser {
  private tokens: Token[] = [];
  private current: i32 = 0;
  private hasError: bool = false;

  parse(formula: string): Expression | null {
    this.tokens = this.tokenize(formula);
    this.current = 0;
    this.hasError = false;
    const result = this.parseExpression();
    return this.hasError ? null : result;
  }

  private tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
      const char = formula.charAt(i);
      const code = formula.charCodeAt(i);

      // Skip whitespace
      if (code === 32 || code === 9 || code === 10 || code === 13) {
        i++;
        continue;
      }

      // Numbers
      if (isDigit(code)) {
        let num = '';
        while (
          i < formula.length &&
          (isDigit(formula.charCodeAt(i)) || formula.charCodeAt(i) === 46)
        ) {
          num += formula.charAt(i);
          i++;
        }
        tokens.push(new Token('number', num));
        continue;
      }

      // Strings (quoted)
      if (code === 34 || code === 39) {
        // " or '
        const quote = char;
        i++; // Skip opening quote
        let str = '';
        while (i < formula.length && formula.charAt(i) !== quote) {
          str += formula.charAt(i);
          i++;
        }
        i++; // Skip closing quote
        tokens.push(new Token('string', str));
        continue;
      }

      // Operators
      if (char === '+' || char === '-' || char === '*' || char === '/' || char === '%') {
        tokens.push(new Token('operator', char));
        i++;
        continue;
      }

      // Comparison operators
      if (char === '=' && i + 1 < formula.length && formula.charAt(i + 1) === '=') {
        tokens.push(new Token('operator', '=='));
        i += 2;
        continue;
      }
      if (char === '!' && i + 1 < formula.length && formula.charAt(i + 1) === '=') {
        tokens.push(new Token('operator', '!='));
        i += 2;
        continue;
      }
      if (char === '>' && i + 1 < formula.length && formula.charAt(i + 1) === '=') {
        tokens.push(new Token('operator', '>='));
        i += 2;
        continue;
      }
      if (char === '<' && i + 1 < formula.length && formula.charAt(i + 1) === '=') {
        tokens.push(new Token('operator', '<='));
        i += 2;
        continue;
      }
      if (char === '>') {
        tokens.push(new Token('operator', '>'));
        i++;
        continue;
      }
      if (char === '<') {
        tokens.push(new Token('operator', '<'));
        i++;
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push(new Token('lparen', '('));
        i++;
        continue;
      }
      if (char === ')') {
        tokens.push(new Token('rparen', ')'));
        i++;
        continue;
      }

      // Comma
      if (char === ',') {
        tokens.push(new Token('comma', ','));
        i++;
        continue;
      }

      // Identifiers (column names, function names, keywords)
      if (this.isAlphaOrUnderscore(code) || code === 64) {
        // @ symbol
        let ident = '';
        while (i < formula.length && this.isAlphaNumericOrUnderscore(formula.charCodeAt(i))) {
          ident += formula.charAt(i);
          i++;
        }

        // Check for keywords
        const lower = ident.toLowerCase();
        if (lower === 'true' || lower === 'false') {
          tokens.push(new Token('boolean', lower));
        } else if (lower === 'and' || lower === 'or' || lower === 'not') {
          tokens.push(new Token('operator', lower));
        } else {
          tokens.push(new Token('identifier', ident));
        }
        continue;
      }

      // Unknown character - skip it
      i++;
    }

    return tokens;
  }

  private isAlphaOrUnderscore(code: i32): bool {
    return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95;
  }

  private isAlphaNumericOrUnderscore(code: i32): bool {
    return this.isAlphaOrUnderscore(code) || (code >= 48 && code <= 57) || code === 64;
  }

  private parseExpression(): Expression {
    return this.parseOr();
  }

  private parseOr(): Expression {
    let left = this.parseAnd();

    while (this.match('operator', 'or')) {
      const right = this.parseAnd();
      left = new BinaryExpression('or', left, right);
    }

    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseComparison();

    while (this.match('operator', 'and')) {
      const right = this.parseComparison();
      left = new BinaryExpression('and', left, right);
    }

    return left;
  }

  private parseComparison(): Expression {
    const left = this.parseAdditive();

    if (this.check('operator')) {
      const op = this.peek().value;
      if (op === '==' || op === '!=' || op === '>' || op === '<' || op === '>=' || op === '<=') {
        this.advance();
        const right = this.parseAdditive();
        return new BinaryExpression(op, left, right);
      }
    }

    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (this.match('operator', '+') || this.match('operator', '-')) {
      const op = this.previous().value;
      const right = this.parseMultiplicative();
      left = new BinaryExpression(op, left, right);
    }

    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseUnary();

    while (
      this.match('operator', '*') ||
      this.match('operator', '/') ||
      this.match('operator', '%')
    ) {
      const op = this.previous().value;
      const right = this.parseUnary();
      left = new BinaryExpression(op, left, right);
    }

    return left;
  }

  private parseUnary(): Expression {
    if (this.match('operator', '-')) {
      const operand = this.parseUnary();
      return new UnaryExpression('-', operand);
    }

    if (this.match('operator', 'not')) {
      const operand = this.parseUnary();
      return new UnaryExpression('not', operand);
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    // Boolean
    if (this.check('boolean')) {
      const value = this.advance().value === 'true';
      return new LiteralExpression(new BooleanValue(value));
    }

    // Number
    if (this.check('number')) {
      const value = parseFloat(this.advance().value);
      return new LiteralExpression(new NumberValue(value));
    }

    // String
    if (this.check('string')) {
      const value = this.advance().value;
      return new LiteralExpression(new StringValue(value));
    }

    // Parenthesized expression
    if (this.match('lparen')) {
      const expr = this.parseExpression();
      if (!this.match('rparen')) {
        this.hasError = true;
        return new LiteralExpression(new NumberValue(0)); // Return dummy value
      }
      return new ParenExpression(expr);
    }

    // Identifier (column, label, or function)
    if (this.check('identifier')) {
      const name = this.advance().value;

      // Function call
      if (this.match('lparen')) {
        const args: Expression[] = [];

        if (!this.check('rparen')) {
          do {
            args.push(this.parseExpression());
          } while (this.match('comma'));
        }

        if (!this.match('rparen')) {
          this.hasError = true;
          return new LiteralExpression(new NumberValue(0)); // Return dummy value
        }

        return new FunctionCallExpression(name, args);
      }

      // Label reference
      if (name.startsWith('@')) {
        return new LabelRefExpression(name.substring(1));
      }

      // Column reference
      return new ColumnRefExpression(name);
    }

    this.hasError = true;
    return new LiteralExpression(new NumberValue(0)); // Return dummy value on error
  }

  private match(type: string, value: string = ''): bool {
    if (this.check(type)) {
      if (value.length === 0 || this.peek().value === value) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: string): bool {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): bool {
    return this.current >= this.tokens.length;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}
