// Formula Parser: "Qty*Price" → AST

import { Expression } from './types';

export class FormulaParser {
  private tokens: Token[] = [];
  private current = 0;

  parse(formula: string): Expression {
    this.tokens = this.tokenize(formula);
    this.current = 0;
    return this.parseExpression();
  }

  private tokenize(formula: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < formula.length) {
      const char = formula[i];

      // Skip whitespace
      if (/\s/.test(char)) {
        i++;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        let num = '';
        while (i < formula.length && /[0-9.]/.test(formula[i])) {
          num += formula[i];
          i++;
        }
        tokens.push({ type: 'number', value: parseFloat(num) });
        continue;
      }

      // Strings (quoted)
      if (char === '"' || char === "'") {
        const quote = char;
        i++; // Skip opening quote
        let str = '';
        while (i < formula.length && formula[i] !== quote) {
          str += formula[i];
          i++;
        }
        i++; // Skip closing quote
        tokens.push({ type: 'string', value: str });
        continue;
      }

      // Operators
      if ('+-*/%'.includes(char)) {
        tokens.push({ type: 'operator', value: char });
        i++;
        continue;
      }

      // Comparison operators
      if (char === '=' && formula[i + 1] === '=') {
        tokens.push({ type: 'operator', value: '==' });
        i += 2;
        continue;
      }
      if (char === '!' && formula[i + 1] === '=') {
        tokens.push({ type: 'operator', value: '!=' });
        i += 2;
        continue;
      }
      if (char === '>' && formula[i + 1] === '=') {
        tokens.push({ type: 'operator', value: '>=' });
        i += 2;
        continue;
      }
      if (char === '<' && formula[i + 1] === '=') {
        tokens.push({ type: 'operator', value: '<=' });
        i += 2;
        continue;
      }
      if (char === '>') {
        tokens.push({ type: 'operator', value: '>' });
        i++;
        continue;
      }
      if (char === '<') {
        tokens.push({ type: 'operator', value: '<' });
        i++;
        continue;
      }

      // Parentheses
      if (char === '(') {
        tokens.push({ type: 'lparen', value: '(' });
        i++;
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'rparen', value: ')' });
        i++;
        continue;
      }

      // Comma (for function arguments)
      if (char === ',') {
        tokens.push({ type: 'comma', value: ',' });
        i++;
        continue;
      }

      // Identifiers (column names, function names, keywords)
      if (/[a-zA-Z_@]/.test(char)) {
        let ident = '';
        while (i < formula.length && /[a-zA-Z0-9_@.]/.test(formula[i])) {
          ident += formula[i];
          i++;
        }
        
        // Check for keywords
        const lower = ident.toLowerCase();
        if (lower === 'true' || lower === 'false') {
          tokens.push({ type: 'boolean', value: lower === 'true' });
        } else if (lower === 'and' || lower === 'or' || lower === 'not') {
          tokens.push({ type: 'operator', value: lower });
        } else {
          tokens.push({ type: 'identifier', value: ident });
        }
        continue;
      }

      throw new Error(`Unexpected character: ${char}`);
    }

    return tokens;
  }

  private parseExpression(): Expression {
    return this.parseOr();
  }

  private parseOr(): Expression {
    let left = this.parseAnd();
    
    while (this.match('operator', 'or')) {
      const right = this.parseAnd();
      left = { type: 'binary', operator: 'or', left, right };
    }
    
    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseComparison();
    
    while (this.match('operator', 'and')) {
      const right = this.parseComparison();
      left = { type: 'binary', operator: 'and', left, right };
    }
    
    return left;
  }

  private parseComparison(): Expression {
    const left = this.parseAdditive();
    
    const compOps = ['==', '!=', '>', '<', '>=', '<='];
    if (this.check('operator') && compOps.includes(this.peek().value)) {
      const op = this.advance().value as any;
      const right = this.parseAdditive();
      return { type: 'binary', operator: op, left, right };
    }
    
    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();
    
    while (this.match('operator', '+') || this.match('operator', '-')) {
      const op = this.previous().value as '+' | '-';
      const right = this.parseMultiplicative();
      left = { type: 'binary', operator: op, left, right };
    }
    
    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseUnary();
    
    while (this.match('operator', '*') || this.match('operator', '/') || this.match('operator', '%')) {
      const op = this.previous().value as '*' | '/' | '%';
      const right = this.parseUnary();
      left = { type: 'binary', operator: op, left, right };
    }
    
    return left;
  }

  private parseUnary(): Expression {
    if (this.match('operator', '-')) {
      const operand = this.parseUnary();
      return { type: 'unary', operator: '-', operand };
    }
    
    if (this.match('operator', 'not')) {
      const operand = this.parseUnary();
      return { type: 'unary', operator: 'not', operand };
    }
    
    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    // Boolean
    if (this.check('boolean')) {
      return { type: 'literal', value: this.advance().value };
    }

    // Number
    if (this.check('number')) {
      return { type: 'literal', value: this.advance().value };
    }

    // String
    if (this.check('string')) {
      return { type: 'literal', value: this.advance().value };
    }

    // Parenthesized expression
    if (this.match('lparen')) {
      const expr = this.parseExpression();
      if (!this.match('rparen')) {
        throw new Error('Expected closing parenthesis');
      }
      return { type: 'paren', expression: expr };
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
          throw new Error('Expected closing parenthesis in function call');
        }
        
        return { type: 'function', name, args };
      }

      // Label reference (@label or @label.Column)
      if (name.startsWith('@')) {
        const parts = name.split('.');
        if (parts.length === 1) {
          return { type: 'label', label: name.slice(1) };
        } else {
          return { type: 'label', label: parts[0].slice(1), column: parts[1] };
        }
      }

      // Column reference
      return { type: 'column', name };
    }

    throw new Error(`Unexpected token: ${JSON.stringify(this.peek())}`);
  }

  private match(type: Token['type'], value?: any): boolean {
    if (this.check(type)) {
      if (value === undefined || this.peek().value === value) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: Token['type']): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }
}

interface Token {
  type: 'number' | 'string' | 'boolean' | 'identifier' | 'operator' | 'lparen' | 'rparen' | 'comma';
  value: any;
}
