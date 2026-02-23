import {Lexer} from './lexer';
import {
    AlterTableOpType,
    type ColumnDef,
    type ColumnExpression,
    type CreateTableNode,
    type Expression,
    type JoinClause,
    type OrderByClause,
    type ParseResult,
    type SelectItem,
    type SetClause,
    type Statement,
    StatementType,
    type Token,
    TokenType
} from './ast';
import {FieldType, JoinType} from '../index';

/**
 * 语法分析器
 */
export class Parser {
    private lexer: Lexer;
    private current: Token;
    private peekToken: Token;
    private errors: string[] = [];

    constructor(lexer: Lexer) {
        this.lexer = lexer;
        this.current = this.lexer.nextToken();
        this.peekToken = this.lexer.nextToken();
    }

    /**
     * 前进一个Token
     */
    private nextToken(): void {
        this.current = this.peekToken;
        this.peekToken = this.lexer.nextToken();
    }

    /**
     * 检查当前Token类型
     */
    private isCurrentType(type: TokenType): boolean {
        return this.current.type === type;
    }

    /**
     * 检查当前Token值
     */
    private isCurrentValue(value: string): boolean {
        return (this.current.type === TokenType.KEYWORD || this.current.type === TokenType.OPERATOR) && this.current.value === value;
    }

    /**
     * 期望当前Token是特定类型
     */
    private expectType(type: TokenType): Token {
        if (!this.isCurrentType(type)) {
            this.errors.push(`Expected ${type}, got ${this.current.type} at position ${this.current.position}`);
            throw new Error(`Parse error at position ${this.current.position}`);
        }
        const token = this.current;
        this.nextToken();
        return token;
    }

    /**
     * 期望当前Token是特定值
     */
    private expectValue(value: string): Token {
        if (!this.isCurrentValue(value)) {
            this.errors.push(`Expected ${value}, got ${this.current.value} at position ${this.current.position}`);
            throw new Error(`Parse error at position ${this.current.position}`);
        }
        const token = this.current;
        this.nextToken();
        return token;
    }

    /**
     * 如果当前Token是特定值，则消耗它
     */
    private matchValue(value: string): boolean {
        if (this.current.value === value && (this.current.type === TokenType.KEYWORD || this.current.type === TokenType.OPERATOR || this.current.type === TokenType.COMMA || this.current.type === TokenType.SEMICOLON)) {
            this.nextToken();
            return true;
        }
        return false;
    }

    /**
     * 解析标识符
     */
    private parseIdentifier(): string {
        if (this.isCurrentType(TokenType.IDENTIFIER) || this.isCurrentType(TokenType.KEYWORD)) {
            const value = this.current.value;
            this.nextToken();
            return value;
        }
        throw new Error(`Expected identifier at position ${this.current.position}`);
    }

    /**
     * 解析字段类型
     */
    private parseFieldType(): FieldType {
        if (this.isCurrentValue('STRING')) {
            this.nextToken();
            return FieldType.STRING;
        }
        if (this.isCurrentValue('NUMBER')) {
            this.nextToken();
            return FieldType.NUMBER;
        }
        throw new Error(`Expected field type at position ${this.current.position}`);
    }

    /**
     * 解析列定义
     */
    private parseColumnDef(): ColumnDef {
        const name = this.parseIdentifier();
        const type = this.parseFieldType();
        const column: ColumnDef = {name, type};

        if (this.matchValue('PRIMARY')) {
            this.expectValue('KEY');
            column.primitiveKey = true;
        }

        if (this.matchValue('DEFAULT')) {
            if (this.isCurrentType(TokenType.STRING)) {
                column.defaultValue = this.current.value;
                this.nextToken();
            } else if (this.isCurrentType(TokenType.NUMBER)) {
                column.defaultValue = Number(this.current.value);
                this.nextToken();
            } else if (this.matchValue('NULL')) {
                column.defaultValue = null;
            } else {
                throw new Error(`Expected default value at position ${this.current.position}`);
            }
        }

        if (this.matchValue('COMMENT')) {
            if (this.isCurrentType(TokenType.STRING)) {
                column.comment = this.current.value;
                this.nextToken();
            } else {
                throw new Error(`Expected string value for COMMENT at position ${this.current.position}`);
            }
        }

        return column;
    }

    /**
     * 解析表达式
     */
    private parseExpression(): Expression {
        return this.parseLogicalOr();
    }

    /**
     * 解析逻辑OR表达式
     */
    private parseLogicalOr(): Expression {
        let left = this.parseLogicalAnd();

        while (this.matchValue('OR')) {
            const right = this.parseLogicalAnd();
            left = {type: 'binary', operator: 'OR', left, right};
        }

        return left;
    }

    /**
     * 解析逻辑AND表达式
     */
    private parseLogicalAnd(): Expression {
        let left = this.parseNot();

        while (this.matchValue('AND')) {
            const right = this.parseNot();
            left = {type: 'binary', operator: 'AND', left, right};
        }

        return left;
    }

    /**
     * 解析NOT表达式
     */
    private parseNot(): Expression {
        if (this.matchValue('NOT')) {
            const expr = this.parseNot();
            if (expr.type === 'binary') {
                return {...expr, operator: `NOT ${expr.operator}` as any};
            }
            return expr;
        }
        return this.parseComparison();
    }

    /**
     * 解析比较表达式
     */
    private parseComparison(): Expression {
        let left = this.parseIs();

        const operators = ['=', '!=', '<>', '>', '<', '>=', '<='];
        while (operators.includes(this.current.value)) {
            const operator = this.current.value;
            this.nextToken();
            const right = this.parseIs();
            left = {type: 'binary', operator, left, right};
        }

        if (this.matchValue('IN')) {
            this.expectType(TokenType.LPAREN);
            const values: Expression[] = [];
            values.push(this.parseExpression());
            while (this.matchValue(',')) {
                values.push(this.parseExpression());
            }
            this.expectType(TokenType.RPAREN);
            return {type: 'in', value: left, values};
        }

        if (this.matchValue('BETWEEN')) {
            const min = this.parseAdditive();
            this.expectValue('AND');
            const max = this.parseAdditive();
            return {type: 'between', value: left, min, max};
        }

        return left;
    }

    /**
     * 解析IS表达式
     */
    private parseIs(): Expression {
        const left = this.parseAdditive();

        if (this.matchValue('IS')) {
            if (this.matchValue('NOT')) {
                const right = this.parseAdditive();
                if (right.type === 'null') {
                    return {type: 'null', value: left, not: true};
                }
                return {type: 'binary', operator: 'IS NOT', left, right};
            } else {
                const right = this.parseAdditive();
                if (right.type === 'null') {
                    return {type: 'null', value: left};
                }
                return {type: 'binary', operator: 'IS', left, right};
            }
        }

        return left;
    }

    /**
     * 解析加法表达式
     */
    private parseAdditive(): Expression {
        let left = this.parseMultiplicative();

        while (this.current.value === '+' || this.current.value === '-') {
            const operator = this.current.value;
            this.nextToken();
            const right = this.parseMultiplicative();
            left = {type: 'binary', operator, left, right};
        }

        return left;
    }

    /**
     * 解析乘法表达式
     */
    private parseMultiplicative(): Expression {
        let left = this.parsePrimary();

        while (this.current.value === '*' || this.current.value === '/') {
            const operator = this.current.value;
            this.nextToken();
            const right = this.parsePrimary();
            left = {type: 'binary', operator, left, right};
        }

        return left;
    }

    /**
     * 解析基础表达式
     */
    private parsePrimary(): Expression {
        if (this.isCurrentType(TokenType.NUMBER)) {
            const value = Number(this.current.value);
            this.nextToken();
            return {type: 'value', value};
        }

        if (this.isCurrentType(TokenType.STRING)) {
            const value = this.current.value;
            this.nextToken();
            return {type: 'value', value};
        }

        if (this.matchValue('NULL')) {
            return {type: 'null', value: {type: 'value', value: null}};
        }

        if (this.isCurrentType(TokenType.IDENTIFIER) || this.isCurrentType(TokenType.KEYWORD)) {
            return this.parseColumnExpression();
        }

        if (this.isCurrentType(TokenType.LPAREN)) {
            this.nextToken();
            const expr = this.parseExpression();
            this.expectType(TokenType.RPAREN);
            return expr;
        }

        throw new Error(`Unexpected token at position ${this.current.position}`);
    }

    /**
     * 解析列表达式
     */
    private parseColumnExpression(): ColumnExpression {
        const name = this.parseIdentifier();

        if (this.matchValue('.')) {
            const tableName = name;
            const colName = this.parseIdentifier();
            return {type: 'column', tableName, name: colName};
        }

        return {type: 'column', name};
    }

    /**
     * 解析CREATE TABLE语句
     */
    private parseCreateTable(): Statement {
        this.expectValue('TABLE');
        const tableName = this.parseIdentifier();
        this.expectType(TokenType.LPAREN);

        const columns: ColumnDef[] = [];
        columns.push(this.parseColumnDef());

        while (this.matchValue(',')) {
            columns.push(this.parseColumnDef());
        }

        this.expectType(TokenType.RPAREN);

        const table: CreateTableNode = {
            type: StatementType.CREATE_TABLE,
            tableName,
            columns,
            position: this.current.position
        };

        if (this.matchValue('COMMENT')) {
            if (this.isCurrentType(TokenType.STRING)) {
                table.comment = this.current.value;
                this.nextToken();
            } else {
                throw new Error(`Expected string value for COMMENT at position ${this.current.position}`);
            }
        }

        return table;
    }

    /**
     * 解析ALTER TABLE语句
     */
    private parseAlterTable(): Statement {
        this.expectValue('TABLE');
        const tableName = this.parseIdentifier();

        let opType: AlterTableOpType;
        let columnName: string | undefined;
        let columnDef: ColumnDef | undefined;
        let newTableName: string | undefined;
        let newColumnName: string | undefined;
        let comment: string | undefined;

        if (this.matchValue('ADD')) {
            this.expectValue('COLUMN');
            opType = AlterTableOpType.ADD_COLUMN;
            columnDef = this.parseColumnDef();
        } else if (this.matchValue('DROP')) {
            this.expectValue('COLUMN');
            opType = AlterTableOpType.DROP_COLUMN;
            columnName = this.parseIdentifier();
        } else if (this.matchValue('RENAME')) {
            if (this.matchValue('COLUMN')) {
                opType = AlterTableOpType.RENAME_COLUMN;
                columnName = this.parseIdentifier();
                this.expectValue('TO');
                newColumnName = this.parseIdentifier();
            } else {
                this.expectValue('TO');
                opType = AlterTableOpType.RENAME;
                newTableName = this.parseIdentifier();
            }
        } else if (this.matchValue('MODIFY')) {
            this.expectValue('COLUMN');
            columnName = this.parseIdentifier();
            const type = this.parseFieldType();
            let primitiveKey = false;
            if (this.matchValue('PRIMARY')) {
                this.expectValue('KEY');
                primitiveKey = true;
            }
            if (this.matchValue('COMMENT')) {
                if (this.isCurrentType(TokenType.STRING)) {
                    comment = this.current.value;
                    this.nextToken();
                } else {
                    throw new Error(`Expected string value for COMMENT at position ${this.current.position}`);
                }
            }
            if (primitiveKey) {
                opType = AlterTableOpType.MODIFY_COLUMN_PRIMITIVE_KEY;
                columnDef = {name: columnName, type, primitiveKey, comment};
            } else if (comment !== undefined) {
                opType = AlterTableOpType.MODIFY_COLUMN_COMMENT;
            } else {
                throw new Error(`Expected PRIMARY KEY or COMMENT after MODIFY COLUMN at position ${this.current.position}`);
            }
        } else if (this.matchValue('COMMENT')) {
            opType = AlterTableOpType.ALTER_TABLE_COMMENT;
            if (this.isCurrentType(TokenType.STRING)) {
                comment = this.current.value;
                this.nextToken();
            } else {
                throw new Error(`Expected string value for COMMENT at position ${this.current.position}`);
            }
        } else {
            throw new Error(`Expected ADD, DROP, RENAME, MODIFY COLUMN or COMMENT after ALTER TABLE at position ${this.current.position}`);
        }

        return {
            type: StatementType.ALTER_TABLE,
            tableName,
            opType,
            columnName,
            columnDef,
            newTableName,
            newColumnName,
            comment,
            position: this.current.position
        };
    }

    /**
     * 解析DROP TABLE语句
     */
    private parseDropTable(): Statement {
        this.expectValue('TABLE');
        const tableName = this.parseIdentifier();

        return {
            type: StatementType.DROP_TABLE,
            tableName,
            position: this.current.position
        };
    }

    /**
     * 解析INSERT语句
     */
    private parseInsert(): Statement {
        this.expectValue('INTO');
        const tableName = this.parseIdentifier();

        let columns: string[] | undefined;
        if (this.isCurrentType(TokenType.LPAREN)) {
            this.nextToken();

            columns = [];
            columns.push(this.parseIdentifier());

            while (this.matchValue(',')) {
                columns.push(this.parseIdentifier());
            }

            this.expectType(TokenType.RPAREN);
        }

        this.expectValue('VALUES');
        this.expectType(TokenType.LPAREN);

        const values: (Expression[])[] = [];
        const row: Expression[] = [];
        row.push(this.parseExpression());

        while (this.matchValue(',')) {
            row.push(this.parseExpression());
        }
        values.push(row);

        this.expectType(TokenType.RPAREN);

        while (this.matchValue(',')) {
            this.expectType(TokenType.LPAREN);
            const newRow: Expression[] = [];
            newRow.push(this.parseExpression());
            while (this.matchValue(',')) {
                newRow.push(this.parseExpression());
            }
            values.push(newRow);
            this.expectType(TokenType.RPAREN);
        }

        return {
            type: StatementType.INSERT,
            tableName,
            columns,
            values,
            position: this.current.position
        };
    }

    /**
     * 解析UPDATE语句
     */
    private parseUpdate(): Statement {
        const tableName = this.parseIdentifier();
        this.expectValue('SET');

        const sets: SetClause[] = [];
        const column = this.parseIdentifier();
        this.expectValue('=');
        const value = this.parseExpression();
        sets.push({column, value});

        while (this.matchValue(',')) {
            const col = this.parseIdentifier();
            this.expectValue('=');
            const val = this.parseExpression();
            sets.push({column: col, value: val});
        }

        let where: Expression | undefined;
        if (this.matchValue('WHERE')) {
            where = this.parseExpression();
        }

        return {
            type: StatementType.UPDATE,
            tableName,
            sets,
            where,
            position: this.current.position
        };
    }

    /**
     * 解析DELETE语句
     */
    private parseDelete(): Statement {
        this.expectValue('FROM');
        const tableName = this.parseIdentifier();

        let where: Expression | undefined;
        if (this.matchValue('WHERE')) {
            where = this.parseExpression();
        }

        return {
            type: StatementType.DELETE,
            tableName,
            where,
            position: this.current.position
        };
    }

    /**
     * 解析APPEND语句
     */
    private parseAppend(): Statement {
        this.expectValue('INTO');
        const tableName = this.parseIdentifier();
        this.expectType(TokenType.LPAREN);

        const column = this.parseIdentifier();
        this.expectType(TokenType.RPAREN);
        this.expectValue('VALUES');
        const value = this.parseExpression();

        let where: Expression | undefined;
        if (this.matchValue('WHERE')) {
            where = this.parseExpression();
        }

        return {
            type: StatementType.APPEND,
            tableName,
            column,
            value,
            where,
            position: this.current.position
        };
    }

    /**
     * 解析SELECT列表
     */
    private parseSelectList(): SelectItem[] {
        const items: SelectItem[] = [];

        if (this.matchValue('*')) {
            items.push({type: 'star'});
        } else {
            items.push(this.parseSelectItem());

            while (this.matchValue(',')) {
                items.push(this.parseSelectItem());
            }
        }

        return items;
    }

    /**
     * 解析SELECT项
     */
    private parseSelectItem(): SelectItem {
        return this.parseColumnExpression();
    }

    /**
     * 解析JOIN子句
     */
    private parseJoin(): JoinClause | undefined {
        if (this.matchValue('INNER')) {
            this.expectValue('JOIN');
            const tableName = this.parseIdentifier();
            this.expectValue('ON');
            const left = this.parseColumnExpression();
            const right = this.parseColumnExpression();

            return {
                type: JoinType.INNER,
                tableName,
                on: {left, right}
            };
        }

        if (this.matchValue('LEFT')) {
            this.expectValue('JOIN');
            const tableName = this.parseIdentifier();
            this.expectValue('ON');
            const left = this.parseColumnExpression();
            const right = this.parseColumnExpression();

            return {
                type: JoinType.LEFT,
                tableName,
                on: {left, right}
            };
        }

        return undefined;
    }

    /**
     * 解析ORDER BY子句
     */
    private parseOrderBy(): OrderByClause[] | undefined {
        if (!this.matchValue('ORDER')) return undefined;

        this.expectValue('BY');

        const clauses: OrderByClause[] = [];
        clauses.push({
            column: this.parseIdentifier(),
            ascending: !this.matchValue('DESC')
        });

        if (this.matchValue('ASC')) {
            const lastClause = clauses[clauses.length - 1];
            if (lastClause) lastClause.ascending = true;
        }

        while (this.matchValue(',')) {
            clauses.push({
                column: this.parseIdentifier(),
                ascending: !this.matchValue('DESC')
            });

            if (this.matchValue('ASC')) {
                const lastClause = clauses[clauses.length - 1];
                if (lastClause) lastClause.ascending = true;
            }
        }

        return clauses;
    }

    /**
     * 解析SELECT语句
     */
    private parseSelect(): Statement {
        let distinct = false;
        if (this.matchValue('DISTINCT')) {
            distinct = true;
        }

        const columns = this.parseSelectList();
        this.expectValue('FROM');
        const tableName = this.parseIdentifier();

        const joins: JoinClause[] = [];
        while (true) {
            const join = this.parseJoin();
            if (!join) break;
            joins.push(join);
        }

        let where: Expression | undefined;
        if (this.matchValue('WHERE')) {
            where = this.parseExpression();
        }

        let orderBy: OrderByClause[] | undefined;
        if (this.isCurrentValue('ORDER')) {
            orderBy = this.parseOrderBy();
        }

        return {
            type: StatementType.SELECT,
            distinct,
            columns,
            from: tableName,
            joins,
            where,
            orderBy,
            position: this.current.position
        };
    }

    /**
     * 解析单个语句
     */
    private parseStatement(): Statement | null {
        if (this.isCurrentValue('CREATE')) {
            this.nextToken();
            return this.parseCreateTable();
        }

        if (this.isCurrentValue('ALTER')) {
            this.nextToken();
            return this.parseAlterTable();
        }

        if (this.isCurrentValue('DROP')) {
            this.nextToken();
            return this.parseDropTable();
        }

        if (this.isCurrentValue('INSERT')) {
            this.nextToken();
            return this.parseInsert();
        }

        if (this.isCurrentValue('UPDATE')) {
            this.nextToken();
            return this.parseUpdate();
        }

        if (this.isCurrentValue('DELETE')) {
            this.nextToken();
            return this.parseDelete();
        }

        if (this.isCurrentValue('APPEND')) {
            this.nextToken();
            return this.parseAppend();
        }

        if (this.isCurrentValue('SELECT')) {
            this.nextToken();
            return this.parseSelect();
        }

        return null;
    }

    /**
     * 解析所有语句
     */
    public parse(): ParseResult {
        const statements: Statement[] = [];
        const errors: string[] = [];

        while (!this.isCurrentType(TokenType.EOF)) {
            try {
                const statement = this.parseStatement();
                if (statement) {
                    statements.push(statement);
                }
                if (!this.matchValue(';')) {
                    if (!this.isCurrentType(TokenType.EOF)) {
                        errors.push(`Expected ';' at position ${this.current.position}`);
                    }
                }
            } catch (e) {
                errors.push((e as Error).message);
                while (!this.isCurrentType(TokenType.EOF) && !this.isCurrentType(TokenType.SEMICOLON)) {
                    this.nextToken();
                }
                if (this.isCurrentType(TokenType.SEMICOLON)) {
                    this.nextToken();
                }
            }
        }

        return {statements, errors};
    }

    /**
     * 解析SQL字符串
     */
    public static parse(sql: string): ParseResult {
        const lexer = new Lexer(sql);
        const parser = new Parser(lexer);
        return parser.parse();
    }
}
