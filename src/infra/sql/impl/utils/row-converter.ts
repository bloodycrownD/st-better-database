import type {Row, RowData, TableSchema} from '../../index';
import {ActionType, SqlExecutionError} from '../../index';
import {ExpressionEvaluator} from './expression-evaluator';

export class RowConverter {
    private expressionEvaluator: ExpressionEvaluator;

    constructor() {
        this.expressionEvaluator = new ExpressionEvaluator();
    }

    private toMap(obj: any): Map<number, any> | undefined {
        if (!obj) return undefined;
        if (obj instanceof Map) return obj;
        const map = new Map<number, any>();
        for (const key of Object.keys(obj)) {
            map.set(Number(key), obj[key]);
        }
        return map;
    }

    dml2row(
        statements: any[],
        tableSchemas: Map<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): string {
        const rows: Row[] = [];

        for (const stmt of statements) {
            switch (stmt.type) {
                case 'INSERT':
                    rows.push(this.convertInsertToRow(stmt, tableSchemas, getTableIdxByName));
                    break;
                case 'UPDATE':
                    rows.push(this.convertUpdateToRow(stmt, tableSchemas, getTableIdxByName));
                    break;
                case 'DELETE':
                    rows.push(this.convertDeleteToRow(stmt, tableSchemas, getTableIdxByName));
                    break;
                case 'APPEND':
                    rows.push(this.convertAppendToRow(stmt, tableSchemas, getTableIdxByName));
                    break;
            }
        }

        return JSON.stringify(rows, null, 2);
    }

    row2dml(
        rows: Row[],
        tableSchemas: Map<number, TableSchema>,
        getTableNameByIdx: (tableIdx: number) => string | undefined
    ): string {
        const statements: string[] = [];

        for (const row of rows) {
            const tableName = getTableNameByIdx(row.tableIdx);
            if (!tableName) {
                throw new SqlExecutionError(`Table with idx ${row.tableIdx} not found`);
            }

            const schema = tableSchemas.get(row.tableIdx);
            if (!schema) {
                throw new SqlExecutionError(`Schema for table '${tableName}' not found`);
            }

            switch (row.action) {
                case ActionType.INSERT:
                    statements.push(this.convertRowToInsert(schema, tableName, row));
                    break;
                case ActionType.UPDATE:
                    statements.push(this.convertRowToUpdate(schema, tableName, row));
                    break;
                case ActionType.DELETE:
                    statements.push(this.convertRowToDelete(schema, tableName, row));
                    break;
                case ActionType.APPEND:
                    statements.push(this.convertRowToAppend(schema, tableName, row));
                    break;
            }
        }

        return statements.join(';\n');
    }

    private convertInsertToRow(
        stmt: any,
        tableSchemas: Map<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row {
        const tableName = stmt.tableName;
        const tableIdx = getTableIdxByName(tableName)!;
        const schema = tableSchemas.get(tableIdx)!;

        const after = new Map<number, any>();

        for (const valueRow of stmt.values) {
            for (let i = 0; i < stmt.columns.length; i++) {
                const colName = stmt.columns[i];
                const fieldIdx = schema.fieldName2id.get(colName)!;
                const expr = valueRow[i];
                after.set(fieldIdx, this.expressionEvaluator.evaluateExpression(expr, schema, tableIdx, null));
            }
        }

        return {
            action: ActionType.INSERT,
            tableIdx,
            after
        };
    }

    private convertUpdateToRow(
        stmt: any,
        tableSchemas: Map<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row {
        const tableName = stmt.tableName;
        const tableIdx = getTableIdxByName(tableName)!;
        const schema = tableSchemas.get(tableIdx)!;

        const after = new Map<number, any>();

        for (const set of stmt.sets) {
            const fieldIdx = schema.fieldName2id.get(set.column)!;
            const value = this.expressionEvaluator.evaluateExpression(set.value, schema, tableIdx, null);
            after.set(fieldIdx, value);
        }

        return {
            action: ActionType.UPDATE,
            tableIdx,
            before: stmt.where ? this.evaluateWhereToRowData(stmt.where, schema, tableIdx) : undefined,
            after
        };
    }

    private convertDeleteToRow(
        stmt: any,
        tableSchemas: Map<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row {
        const tableName = stmt.tableName;
        const tableIdx = getTableIdxByName(tableName)!;
        const schema = tableSchemas.get(tableIdx)!;

        return {
            action: ActionType.DELETE,
            tableIdx,
            before: stmt.where ? this.evaluateWhereToRowData(stmt.where, schema, tableIdx) : undefined
        };
    }

    private convertAppendToRow(
        stmt: any,
        tableSchemas: Map<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row {
        const tableName = stmt.tableName;
        const tableIdx = getTableIdxByName(tableName)!;
        const schema = tableSchemas.get(tableIdx)!;

        const colName = stmt.column;
        const fieldIdx = schema.fieldName2id.get(colName)!;
        const value = this.expressionEvaluator.evaluateExpression(stmt.value, schema, tableIdx, null);

        const after = new Map<number, any>();
        after.set(fieldIdx, value);

        return {
            action: ActionType.APPEND,
            tableIdx,
            after
        };
    }

    private evaluateWhereToRowData(expr: any, schema: TableSchema, _tableIdx: number): RowData {
        const row = new Map<number, any>();

        if (expr.type === 'binary') {
            if (expr.left.type === 'column' && expr.right.type === 'value') {
                const colName = expr.left.name;
                const fieldIdx = schema.fieldName2id.get(colName);
                if (fieldIdx !== undefined) {
                    row.set(fieldIdx, expr.right.value);
                }
            }
        }

        return row;
    }

    private convertRowToInsert(schema: TableSchema, tableName: string, row: Row): string {
        const columns: string[] = [];
        const values: string[] = [];

        const afterMap = this.toMap(row.after);
        afterMap?.forEach((value, fieldIdx) => {
            const colName = schema.id2fieldName.get(fieldIdx);
            if (colName) {
                columns.push(colName);
                values.push(this.valueToSql(value));
            }
        });

        return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    }

    private convertRowToUpdate(schema: TableSchema, tableName: string, row: Row): string {
        const sets: string[] = [];

        const afterMap = this.toMap(row.after);
        afterMap?.forEach((value, fieldIdx) => {
            const colName = schema.id2fieldName.get(fieldIdx);
            if (colName) {
                sets.push(`${colName} = ${this.valueToSql(value)}`);
            }
        });

        let sql = `UPDATE ${tableName} SET ${sets.join(', ')}`;

        const beforeMap = this.toMap(row.before);
        if (beforeMap && beforeMap.size > 0) {
            const conditions: string[] = [];
            beforeMap.forEach((value, fieldIdx) => {
                const colName = schema.id2fieldName.get(fieldIdx);
                if (colName) {
                    conditions.push(`${colName} = ${this.valueToSql(value)}`);
                }
            });

            if (conditions.length > 0) {
                sql += ` WHERE ${conditions.join(' AND ')}`;
            }
        }

        return sql;
    }

    private convertRowToDelete(schema: TableSchema, tableName: string, row: Row): string {
        const conditions: string[] = [];

        const beforeMap = this.toMap(row.before);
        beforeMap?.forEach((value, fieldIdx) => {
            const colName = schema.id2fieldName.get(fieldIdx);
            if (colName) {
                conditions.push(`${colName} = ${this.valueToSql(value)}`);
            }
        });

        let sql = `DELETE FROM ${tableName}`;

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        return sql;
    }

    private convertRowToAppend(schema: TableSchema, tableName: string, row: Row): string {
        const afterMap = this.toMap(row.after);
        const fieldIdx = afterMap ? Array.from(afterMap.keys())[0] : undefined;
        if (fieldIdx === undefined) {
            throw new SqlExecutionError('Invalid APPEND row data');
        }
        const colNameStr = schema.id2fieldName.get(fieldIdx);
        const value = afterMap?.get(fieldIdx);

        return `APPEND INTO ${tableName} (${colNameStr}) VALUES (${this.valueToSql(value)})`;
    }

    private valueToSql(value: any): string {
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        return String(value);
    }
}
