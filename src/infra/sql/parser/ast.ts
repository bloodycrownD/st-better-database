import type {FieldType, JoinType} from '../index';

/**
 * Token类型
 */
export enum TokenType {
    KEYWORD = 'KEYWORD',
    IDENTIFIER = 'IDENTIFIER',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    OPERATOR = 'OPERATOR',
    COMMA = 'COMMA',
    SEMICOLON = 'SEMICOLON',
    LPAREN = 'LPAREN',
    RPAREN = 'RPAREN',
    DOT = 'DOT',
    EOF = 'EOF'
}

/**
 * Token接口
 */
export interface Token {
    type: TokenType;
    value: string;
    position: number;
}

/**
 * SQL语句类型
 */
export enum StatementType {
    CREATE_TABLE = 'CREATE_TABLE',
    ALTER_TABLE = 'ALTER_TABLE',
    DROP_TABLE = 'DROP_TABLE',
    INSERT = 'INSERT',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    APPEND = 'APPEND',
    SELECT = 'SELECT',
    ROW = 'ROW'
}

/**
 * 基础AST节点
 */
export interface AstNode {
    type: StatementType;
    position?: number;
}

/**
 * 列定义
 */
export interface ColumnDef {
    name: string;
    type: FieldType;
    primitiveKey?: boolean;
    defaultValue?: string | number | null;
    comment?: string;
}

/**
 * CREATE TABLE语句
 */
export interface CreateTableNode extends AstNode {
    type: StatementType.CREATE_TABLE;
    tableName: string;
    columns: ColumnDef[];
    comment?: string;
}

/**
 * ALTER TABLE操作类型
 */
export enum AlterTableOpType {
    ADD_COLUMN = 'ADD_COLUMN',
    DROP_COLUMN = 'DROP_COLUMN',
    RENAME = 'RENAME',
    RENAME_COLUMN = 'RENAME_COLUMN',
    MODIFY_COLUMN_COMMENT = 'MODIFY_COLUMN_COMMENT',
    MODIFY_COLUMN_PRIMITIVE_KEY = 'MODIFY_COLUMN_PRIMITIVE_KEY',
    ALTER_TABLE_COMMENT = 'ALTER_TABLE_COMMENT'
}

/**
 * ALTER TABLE语句
 */
export interface AlterTableNode extends AstNode {
    type: StatementType.ALTER_TABLE;
    tableName: string;
    opType: AlterTableOpType;
    columnName?: string;
    columnDef?: ColumnDef;
    newTableName?: string;
    newColumnName?: string;
    comment?: string;
}

/**
 * DROP TABLE语句
 */
export interface DropTableNode extends AstNode {
    type: StatementType.DROP_TABLE;
    tableName: string;
}

/**
 * 表达式基类
 */
export type Expression =
    | ColumnExpression
    | ValueExpression
    | BinaryExpression
    | FunctionExpression
    | BetweenExpression
    | InExpression
    | NullExpression;

/**
 * 列引用表达式
 */
export interface ColumnExpression {
    type: 'column';
    tableName?: string;
    name: string;
}

/**
 * 值表达式
 */
export interface ValueExpression {
    type: 'value';
    value: string | number | null;
}

/**
 * 二元运算表达式
 */
export interface BinaryExpression {
    type: 'binary';
    operator: string;
    left: Expression;
    right: Expression;
}

/**
 * 函数表达式
 */
export interface FunctionExpression {
    type: 'function';
    name: string;
    args: Expression[];
}

/**
 * BETWEEN表达式
 */
export interface BetweenExpression {
    type: 'between';
    value: Expression;
    min: Expression;
    max: Expression;
    not?: boolean;
}

/**
 * IN表达式
 */
export interface InExpression {
    type: 'in';
    value: Expression;
    values: Expression[];
    not?: boolean;
}

/**
 * NULL表达式
 */
export interface NullExpression {
    type: 'null';
    value: Expression;
    not?: boolean;
}

/**
 * INSERT语句
 */
export interface InsertNode extends AstNode {
    type: StatementType.INSERT;
    tableName: string;
    columns?: string[];
    values: (Expression[])[];
}

/**
 * SET子句
 */
export interface SetClause {
    column: string;
    value: Expression;
}

/**
 * UPDATE语句
 */
export interface UpdateNode extends AstNode {
    type: StatementType.UPDATE;
    tableName: string;
    sets: SetClause[];
    where?: Expression;
}

/**
 * DELETE语句
 */
export interface DeleteNode extends AstNode {
    type: StatementType.DELETE;
    tableName: string;
    where?: Expression;
}

/**
 * APPEND语句
 */
export interface AppendNode extends AstNode {
    type: StatementType.APPEND;
    tableName: string;
    columns: string[];
    values: Expression[];
    where?: Expression;
}

/**
 * SELECT列表项
 */
export type SelectItem = ColumnExpression | { type: 'star' };

/**
 * JOIN条件
 */
export interface JoinClause {
    type: JoinType;
    tableName: string;
    on: {
        left: ColumnExpression;
        right: ColumnExpression;
    };
}

/**
 * ORDER BY子句
 */
export interface OrderByClause {
    column: string;
    ascending?: boolean;
}

/**
 * SELECT语句
 */
export interface SelectNode extends AstNode {
    type: StatementType.SELECT;
    distinct?: boolean;
    columns: SelectItem[];
    from: string;
    joins?: JoinClause[];
    where?: Expression;
    orderBy?: OrderByClause[];
}

/**
 * SQL语句（联合类型）
 */
export type Statement =
    | CreateTableNode
    | AlterTableNode
    | DropTableNode
    | InsertNode
    | UpdateNode
    | DeleteNode
    | AppendNode
    | SelectNode;

/**
 * 解析结果
 */
export interface ParseResult {
    statements: Statement[];
    errors: string[];
}
