import {type Token, TokenType} from './ast';

/**
 * 关键字集合
 */
const KEYWORDS = new Set([
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES',
    'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER',
    'DROP', 'ADD', 'COLUMN', 'RENAME', 'TO', 'APPEND',
    'AND', 'OR', 'NOT', 'NULL', 'IS', 'BETWEEN', 'IN',
    'ORDER', 'BY', 'ASC', 'DESC', 'INNER', 'LEFT', 'JOIN',
    'ON', 'DISTINCT', 'STRING', 'NUMBER', 'PRIMARY', 'KEY', 'DEFAULT',
    'COMMENT', 'MODIFY'
]);

/**
 * 运算符集合
 */
const OPERATORS = ['=', '!=', '<>', '>', '<', '>=', '<='];

/**
 * 词法分析器
 */
export class Lexer {
    private input: string;
    private pos: number = 0;
    private length: number;

    constructor(input: string) {
        this.input = input;
        this.length = input.length;
    }

    /**
     * 获取当前位置的字符
     */
    private peek(offset: number = 0): string {
        const idx = this.pos + offset;
        return this.input[idx] ?? '';
    }

    /**
     * 消耗当前字符
     */
    private advance(): string {
        if (this.pos >= this.length) return '';
        return this.input[this.pos++] ?? '';
    }

    /**
     * 跳过空白字符
     */
    private skipWhitespace(): void {
        while (this.pos < this.length && /\s/.test(this.peek())) {
            this.pos++;
        }
    }

    /**
     * 跳过注释
     */
    private skipComment(): void {
        while (this.peek() === '-' && this.peek(1) === '-') {
            this.pos += 2;
            while (this.pos < this.length && this.peek() !== '\n') {
                this.pos++;
            }
            if (this.pos < this.length && this.peek() === '\n') {
                this.pos++;
            }
            this.skipWhitespace();
        }
    }

    /**
     * 读取标识符或关键字
     */
    private readIdentifier(): string {
        let result = '';
        while (this.pos < this.length && /[\w]/.test(this.peek())) {
            result += this.advance();
        }
        return result;
    }

    /**
     * 读取字符串
     */
    private readString(quote: string): string {
        let result = '';
        this.advance();
        while (this.pos < this.length) {
            const ch = this.peek();
            if (ch === quote) {
                this.advance();
                if (this.peek() === quote) {
                    result += quote;
                    this.advance();
                } else {
                    break;
                }
            } else if (ch === '\\') {
                this.advance();
                result += this.advance();
            } else {
                result += this.advance();
            }
        }
        return result;
    }

    /**
     * 读取数字
     */
    private readNumber(): string {
        let result = '';
        while (this.pos < this.length && /[\d.]/.test(this.peek())) {
            result += this.advance();
        }
        return result;
    }

    /**
     * 读取运算符
     */
    private readOperator(): string {
        const twoChar = this.peek() + this.peek(1);
        if (OPERATORS.includes(twoChar)) {
            this.advance();
            this.advance();
            return twoChar;
        }
        return this.advance();
    }

    /**
     * 获取下一个Token
     */
    public nextToken(): Token {
        this.skipWhitespace();
        this.skipComment();

        if (this.pos >= this.length) {
            return {type: TokenType.EOF, value: '', position: this.pos};
        }

        const position = this.pos;
        const ch = this.peek();

        if (ch === '(') {
            this.advance();
            return {type: TokenType.LPAREN, value: '(', position};
        }

        if (ch === ')') {
            this.advance();
            return {type: TokenType.RPAREN, value: ')', position};
        }

        if (ch === ',') {
            this.advance();
            return {type: TokenType.COMMA, value: ',', position};
        }

        if (ch === ';') {
            this.advance();
            return {type: TokenType.SEMICOLON, value: ';', position};
        }

        if (ch === '.') {
            this.advance();
            return {type: TokenType.DOT, value: '.', position};
        }

        if (ch === "'") {
            const value = this.readString(ch);
            return {type: TokenType.STRING, value, position};
        }

        if (ch === '"') {
            const value = this.readString(ch);
            return {type: TokenType.STRING, value, position};
        }

        if (ch === '*') {
            this.advance();
            return {type: TokenType.KEYWORD, value: '*', position};
        }

        if (/[\d]/.test(ch)) {
            const value = this.readNumber();
            return {type: TokenType.NUMBER, value, position};
        }

        if (/[a-zA-Z_]/.test(ch)) {
            const value = this.readIdentifier();
            const upperValue = value.toUpperCase();
            if (KEYWORDS.has(upperValue)) {
                return {type: TokenType.KEYWORD, value: upperValue, position};
            }
            return {type: TokenType.IDENTIFIER, value, position};
        }

        if (OPERATORS.some(op => op.startsWith(ch))) {
            const value = this.readOperator();
            return {type: TokenType.OPERATOR, value, position};
        }

        throw new Error(`Unexpected character: ${ch} at position ${position}`);
    }

    /**
     * 获取所有Token
     */
    public tokenize(): Token[] {
        const tokens: Token[] = [];
        let token: Token;

        do {
            token = this.nextToken();
            tokens.push(token);
        } while (token.type !== TokenType.EOF);

        return tokens;
    }
}
