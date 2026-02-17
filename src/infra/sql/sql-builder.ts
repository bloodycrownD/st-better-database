import type {SqlValue} from './types/core';
import type {JoinType} from './enums/join-type';

type WhereNode = 
    | {type: 'condition', sql: string}
    | {type: 'and', left: WhereNode, right: WhereNode}
    | {type: 'or', left: WhereNode, right: WhereNode};

export class Where {
    private root?: WhereNode;
    private currentCondition?: WhereNode;

    static of(): Where {
        return new Where();
    }

    eq(column: string, value: SqlValue): Where {
        const sql = `${column} = ${this.formatValue(value)}`;
        return this.addCondition({type: 'condition', sql});
    }

    ne(column: string, value: SqlValue): Where {
        const sql = `${column} != ${this.formatValue(value)}`;
        return this.addCondition({type: 'condition', sql});
    }

    gt(column: string, value: SqlValue): Where {
        const sql = `${column} > ${this.formatValue(value)}`;
        return this.addCondition({type: 'condition', sql});
    }

    lt(column: string, value: SqlValue): Where {
        const sql = `${column} < ${this.formatValue(value)}`;
        return this.addCondition({type: 'condition', sql});
    }

    ge(column: string, value: SqlValue): Where {
        const sql = `${column} >= ${this.formatValue(value)}`;
        return this.addCondition({type: 'condition', sql});
    }

    le(column: string, value: SqlValue): Where {
        const sql = `${column} <= ${this.formatValue(value)}`;
        return this.addCondition({type: 'condition', sql});
    }

    between(column: string, min: SqlValue, max: SqlValue): Where {
        const sql = `${column} BETWEEN ${this.formatValue(min)} AND ${this.formatValue(max)}`;
        return this.addCondition({type: 'condition', sql});
    }

    notBetween(column: string, min: SqlValue, max: SqlValue): Where {
        const sql = `${column} NOT BETWEEN ${this.formatValue(min)} AND ${this.formatValue(max)}`;
        return this.addCondition({type: 'condition', sql});
    }

    in(column: string, values: SqlValue[]): Where {
        const formattedValues = values.map(v => this.formatValue(v)).join(', ');
        const sql = `${column} IN (${formattedValues})`;
        return this.addCondition({type: 'condition', sql});
    }

    notIn(column: string, values: SqlValue[]): Where {
        const formattedValues = values.map(v => this.formatValue(v)).join(', ');
        const sql = `${column} NOT IN (${formattedValues})`;
        return this.addCondition({type: 'condition', sql});
    }

    isNull(column: string): Where {
        const sql = `${column} IS NULL`;
        return this.addCondition({type: 'condition', sql});
    }

    isNotNull(column: string): Where {
        const sql = `${column} IS NOT NULL`;
        return this.addCondition({type: 'condition', sql});
    }

    and(where: Where): Where {
        return this.combine('and', where);
    }

    or(where: Where): Where {
        return this.combine('or', where);
    }

    private addCondition(node: WhereNode): Where {
        if (!this.currentCondition) {
            this.currentCondition = node;
        } else {
            this.currentCondition = {type: 'and', left: this.currentCondition, right: node};
        }
        this.root = this.currentCondition;
        return this;
    }

    private combine(operator: 'and' | 'or', where: Where): Where {
        const otherNode = where.root || where.currentCondition;
        if (!otherNode) {
            return this;
        }
        if (!this.currentCondition) {
            this.currentCondition = otherNode;
        } else {
            this.currentCondition = {type: operator, left: this.currentCondition, right: otherNode};
        }
        this.root = this.currentCondition;
        return this;
    }

    private formatValue(value: SqlValue): string {
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `"${value}"`;
        return String(value);
    }

    build(): string {
        const node = this.root || this.currentCondition;
        if (!node) return '';
        return this.buildNode(node);
    }

    private buildNode(node: WhereNode): string {
        if (node.type === 'condition') {
            return node.sql;
        }
        const left = this.buildNode(node.left);
        const right = this.buildNode(node.right);
        const op = node.type.toUpperCase();
        return `(${left} ${op} ${right})`;
    }
}

abstract class AbstractWrapper<T extends AbstractWrapper<T>> {
    protected whereCondition?: Where;
    protected orderByClauses: string[] = [];
    protected joins: {type: string; table: string; on: string}[] = [];

    where(condition: Where): T {
        this.whereCondition = condition;
        return this as unknown as T;
    }

    orderBy(column: string, asc: boolean = true): T {
        this.orderByClauses.push(`${column} ${asc ? 'ASC' : 'DESC'}`);
        return this as unknown as T;
    }

    protected formatValue(value: SqlValue): string {
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `"${value}"`;
        return String(value);
    }

    protected buildWhere(): string {
        if (!this.whereCondition) return '';
        const whereSql = this.whereCondition.build();
        return whereSql ? ` WHERE ${whereSql}` : '';
    }
}

export class SelectWrapper extends AbstractWrapper<SelectWrapper> {
    private tableName?: string;
    private columns: string[] = [];

    from(table: string): SelectWrapper {
        this.tableName = table;
        return this as unknown as SelectWrapper;
    }

    select(...columns: string[]): SelectWrapper {
        this.columns = columns;
        return this as unknown as SelectWrapper;
    }

    join(type: JoinType, table: string, onLeft: string, onRight: string): SelectWrapper {
        this.joins.push({type: type.toString(), table, on: `${onLeft} = ${onRight}`});
        return this as unknown as SelectWrapper;
    }

    build(): string {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }
        const selectColumns = this.columns.length > 0 ? this.columns.join(', ') : '*';
        let sql = `SELECT ${selectColumns} FROM ${this.tableName}`;

        if (this.joins.length > 0) {
            sql += this.joins.map(j => ` ${j.type} JOIN ${j.table} ON ${j.on}`).join('');
        }

        sql += this.buildWhere();

        if (this.orderByClauses.length > 0) {
            sql += ` ORDER BY ${this.orderByClauses.join(', ')}`;
        }

        return sql;
    }
}

export class InsertWrapper extends AbstractWrapper<InsertWrapper> {
    private tableName?: string;
    private values: Map<string, SqlValue> = new Map();
    private batchValues: Map<string, SqlValue>[] = [];

    into(table: string): InsertWrapper {
        this.tableName = table;
        return this as unknown as InsertWrapper;
    }

    set(column: string, value: SqlValue): InsertWrapper {
        this.values.set(column, value);
        return this as unknown as InsertWrapper;
    }

    setValues(data: Map<string, SqlValue>): InsertWrapper {
        data.forEach((value, key) => this.values.set(key, value));
        return this as unknown as InsertWrapper;
    }

    batch(data: Map<string, SqlValue>[]): InsertWrapper {
        this.batchValues = data;
        return this as unknown as InsertWrapper;
    }

    build(): string {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }

        const dataToInsert = this.batchValues.length > 0 ? this.batchValues : [this.values];
        const firstRow = dataToInsert[0];
        if (!firstRow || firstRow.size === 0) {
            throw new Error('No data to insert');
        }

        const columns = Array.from(firstRow.keys()).join(', ');

        const valuesClauses = dataToInsert.map(row => {
            const orderedValues = Array.from(firstRow.keys())
                .map(key => {
                    const val = row.get(key);
                    return this.formatValue(val !== undefined ? val : null);
                })
                .join(', ');
            return `(${orderedValues})`;
        }).join(', ');

        return `INSERT INTO ${this.tableName} (${columns}) VALUES ${valuesClauses}`;
    }
}

export class UpdateWrapper extends AbstractWrapper<UpdateWrapper> {
    private tableName?: string;
    private sets: Map<string, SqlValue> = new Map();

    table(table: string): UpdateWrapper {
        this.tableName = table;
        return this as unknown as UpdateWrapper;
    }

    set(column: string, value: SqlValue): UpdateWrapper {
        this.sets.set(column, value);
        return this as unknown as UpdateWrapper;
    }

    setValues(data: Map<string, SqlValue>): UpdateWrapper {
        data.forEach((value, key) => this.sets.set(key, value));
        return this as unknown as UpdateWrapper;
    }

    build(): string {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }
        if (this.sets.size === 0) {
            throw new Error('At least one SET clause is required');
        }

        const setClauses = Array.from(this.sets.entries())
            .map(([col, val]) => `${col} = ${this.formatValue(val)}`)
            .join(', ');

        return `UPDATE ${this.tableName} SET ${setClauses}${this.buildWhere()}`;
    }
}

export class DeleteWrapper extends AbstractWrapper<DeleteWrapper> {
    private tableName?: string;

    from(table: string): DeleteWrapper {
        this.tableName = table;
        return this as unknown as DeleteWrapper;
    }

    build(): string {
        if (!this.tableName) {
            throw new Error('Table name is required');
        }
        return `DELETE FROM ${this.tableName}${this.buildWhere()}`;
    }
}

export class AppendWrapper extends AbstractWrapper<AppendWrapper> {
    private tableName?: string;
    private columnName?: string;
    private appendValue?: string;

    into(table: string): AppendWrapper {
        this.tableName = table;
        return this as unknown as AppendWrapper;
    }

    column(col: string): AppendWrapper {
        this.columnName = col;
        return this as unknown as AppendWrapper;
    }

    value(val: string): AppendWrapper {
        this.appendValue = val;
        return this as unknown as AppendWrapper;
    }

    build(): string {
        if (!this.tableName || !this.columnName || this.appendValue === undefined) {
            throw new Error('Table name, column, and value are required');
        }
        const formattedValue = this.formatValue(this.appendValue);
        return `APPEND INTO ${this.tableName} (${this.columnName}) VALUES (${formattedValue})${this.buildWhere()}`;
    }
}

export class DDLBuilder {
    static createTable(tableName: string, columns: Map<string, string>, comment?: string): string {
        const columnDefs = Array.from(columns.entries())
            .map(([name, type]) => `${name} ${type}`)
            .join(', ');
        let sql = `CREATE TABLE ${tableName} (${columnDefs})`;
        if (comment) {
            sql += ` COMMENT ${this.formatValue(comment)}`;
        }
        return sql;
    }

    static alterTableAddColumn(tableName: string, columnName: string, columnType: string): string {
        return `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`;
    }

    static alterTableDropColumn(tableName: string, columnName: string): string {
        return `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`;
    }

    static alterTableRename(tableName: string, newTableName: string): string {
        return `ALTER TABLE ${tableName} RENAME TO ${newTableName}`;
    }

    static alterTableModifyColumnComment(tableName: string, columnName: string, columnType: string, comment: string): string {
        return `ALTER TABLE ${tableName} MODIFY COLUMN ${columnName} ${columnType} COMMENT ${this.formatValue(comment)}`;
    }

    static alterTableRenameColumn(tableName: string, columnName: string, newColumnName: string): string {
        return `ALTER TABLE ${tableName} RENAME COLUMN ${columnName} TO ${newColumnName}`;
    }

    static alterTableComment(tableName: string, comment: string): string {
        return `ALTER TABLE ${tableName} COMMENT ${this.formatValue(comment)}`;
    }

    static dropTable(tableName: string): string {
        return `DROP TABLE ${tableName}`;
    }

    private static formatValue(value: string): string {
        return `"${value}"`;
    }
}

/**
 * 使用示例：
 * // SELECT with Where
 * SQLBuilder.select()
 *   .from('users')
 *   .select('name', 'age')
 *   .where(
 *     Where.of().eq('age', 25).or(Where.of().gt('age', 30))
 *   )
 *   .orderBy('age', false)
 *   .build()
 * // INSERT
 * const data = new Map([['name', '张三'], ['age', 25]]);
 * SQLBuilder.insert()
 *   .into('users')
 *   .setValues(data)
 *   .build()
 * // UPDATE with Where
 * SQLBuilder.update()
 *   .table('users')
 *   .set('age', 26)
 *   .where(Where.of().eq('name', '张三'))
 *   .build()
 * // DELETE with Where
 * SQLBuilder.delete()
 *   .from('users')
 *   .where(Where.of().lt('age', 20))
 *   .build()
 * // APPEND with Where
 * SQLBuilder.append()
 *   .into('users')
 *   .column('name')
 *   .value('你好')
 *   .where(Where.of().eq('id', 1))
 *   .build()
 * // Complex Where with nesting
 * SQLBuilder.select().from('users').where(
 *   Where.of()
 *     .eq('age', 25)
 *     .or(Where.of().gt('age', 30).and(Where.of().isNull('name')))
 * ).build()
 * // DDL
 * SQLBuilder.ddl().createTable('users', new Map([['name', 'STRING'], ['age', 'NUMBER']]))
 */
export class SQLBuilder {
    static select(): SelectWrapper {
        return new SelectWrapper();
    }

    static insert(): InsertWrapper {
        return new InsertWrapper();
    }

    static update(): UpdateWrapper {
        return new UpdateWrapper();
    }

    static delete(): DeleteWrapper {
        return new DeleteWrapper();
    }

    static append(): AppendWrapper {
        return new AppendWrapper();
    }

    static ddl(): typeof DDLBuilder {
        return DDLBuilder;
    }
}
