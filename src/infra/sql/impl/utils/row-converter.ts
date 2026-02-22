import type {Row, RowData, TableSchema} from '@/infra/sql';
import {ActionType, ExpressionEvaluator, SqlExecutionError} from '@/infra/sql';

export class RowConverter {
    private expressionEvaluator: ExpressionEvaluator;

    constructor() {
        this.expressionEvaluator = new ExpressionEvaluator();
    }

    private toRecord(obj: any): Record<number, any> | undefined {
        if (!obj) return undefined;
        if (obj instanceof Map) {
            const record: Record<number, any> = {};
            obj.forEach((value, key) => {
                record[key] = value;
            });
            return record;
        }
        return obj;
    }

    dml2row(
        statements: any[],
        tableSchemas: Record<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row[] {
        const rows: Row[] = [];

        for (const stmt of statements) {
            switch (stmt.type) {
                case 'INSERT':
                    rows.push(...this.convertInsertToRow(stmt, tableSchemas, getTableIdxByName));
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

        return rows;
    }

    row2dml(
        rows: Row[],
        tableSchemas: Record<number, TableSchema>,
        getTableNameByIdx: (tableIdx: number) => string | undefined
    ): string {
        const statements: string[] = [];

        for (const row of rows) {
            const tableName = getTableNameByIdx(row.tableIdx);
            if (!tableName) {
                throw new SqlExecutionError(`Table with idx ${row.tableIdx} not found`);
            }

            const schema = tableSchemas[row.tableIdx];
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
        tableSchemas: Record<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row[] {
        const tableName = stmt.tableName;
        const tableIdx = getTableIdxByName(tableName)!;
        const schema = tableSchemas[tableIdx]!;
        const rows: Row[] = [];

        for (const valueRow of stmt.values) {
            const after: Record<number, any> = {};
            for (let i = 0; i < stmt.columns.length; i++) {
                const colName = stmt.columns[i];
                const fieldIdx = schema.fieldName2id[colName]!;
                const expr = valueRow[i];
                after[fieldIdx] = this.expressionEvaluator.evaluateExpression(expr, schema, tableIdx, null);
            }
            rows.push({
                action: ActionType.INSERT,
                tableIdx,
                after
            });
        }

        return rows;
    }

    private convertUpdateToRow(
        stmt: any,
        tableSchemas: Record<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row {
        const tableName = stmt.tableName;
        const tableIdx = getTableIdxByName(tableName)!;
        const schema = tableSchemas[tableIdx]!;

        const after: Record<number, any> = {};

        for (const set of stmt.sets) {
            const fieldIdx = schema.fieldName2id[set.column]!;
            const value = this.expressionEvaluator.evaluateExpression(set.value, schema, tableIdx, null);
            after[fieldIdx] = value;
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
        tableSchemas: Record<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row {
        const tableName = stmt.tableName;
        const tableIdx = getTableIdxByName(tableName)!;
        const schema = tableSchemas[tableIdx]!;

        return {
            action: ActionType.DELETE,
            tableIdx,
            before: stmt.where ? this.evaluateWhereToRowData(stmt.where, schema, tableIdx) : undefined
        };
    }

    private convertAppendToRow(
        stmt: any,
        tableSchemas: Record<number, TableSchema>,
        getTableIdxByName: (tableName: string) => number | undefined
    ): Row {
        const tableName = stmt.tableName;
        const tableIdx = getTableIdxByName(tableName)!;
        const schema = tableSchemas[tableIdx]!;

        const colName = stmt.column;
        const fieldIdx = schema.fieldName2id[colName]!;
        const value = this.expressionEvaluator.evaluateExpression(stmt.value, schema, tableIdx, null);

        const after: Record<number, any> = {};
        after[fieldIdx] = value;

        return {
            action: ActionType.APPEND,
            tableIdx,
            before: stmt.where ? this.evaluateWhereToRowData(stmt.where, schema, tableIdx) : undefined,
            after
        };
    }

    private evaluateWhereToRowData(expr: any, schema: TableSchema, _tableIdx: number): RowData {
        const row: RowData = {};

        if (expr.type === 'binary') {
            if (expr.left.type === 'column' && expr.right.type === 'value') {
                const colName = expr.left.name;
                const fieldIdx = schema.fieldName2id[colName];
                if (fieldIdx !== undefined) {
                    row[fieldIdx] = expr.right.value;
                }
            }
        }

        return row;
    }

    private convertRowToInsert(schema: TableSchema, tableName: string, row: Row): string {
        const columns: string[] = [];
        const values: string[] = [];

        const afterRecord = this.toRecord(row.after);
        if (afterRecord) {
            Object.entries(afterRecord).forEach(([fieldIdxStr, value]) => {
                const fieldIdx = parseInt(fieldIdxStr);
                const colName = schema.id2fieldName[fieldIdx];
                if (colName) {
                    columns.push(colName);
                    values.push(this.valueToSql(value));
                }
            });
        }

        return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
    }

    private convertRowToUpdate(schema: TableSchema, tableName: string, row: Row): string {
        const sets: string[] = [];

        const afterRecord = this.toRecord(row.after);
        if (afterRecord) {
            Object.entries(afterRecord).forEach(([fieldIdxStr, value]) => {
                const fieldIdx = parseInt(fieldIdxStr);
                const colName = schema.id2fieldName[fieldIdx];
                if (colName) {
                    sets.push(`${colName} = ${this.valueToSql(value)}`);
                }
            });
        }

        let sql = `UPDATE ${tableName} SET ${sets.join(', ')}`;

        const beforeRecord = this.toRecord(row.before);
        if (beforeRecord && Object.keys(beforeRecord).length > 0) {
            const conditions: string[] = [];
            Object.entries(beforeRecord).forEach(([fieldIdxStr, value]) => {
                const fieldIdx = parseInt(fieldIdxStr);
                const colName = schema.id2fieldName[fieldIdx];
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

        const beforeRecord = this.toRecord(row.before);
        if (beforeRecord) {
            Object.entries(beforeRecord).forEach(([fieldIdxStr, value]) => {
                const fieldIdx = parseInt(fieldIdxStr);
                const colName = schema.id2fieldName[fieldIdx];
                if (colName) {
                    conditions.push(`${colName} = ${this.valueToSql(value)}`);
                }
            });
        }

        let sql = `DELETE FROM ${tableName}`;

        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        return sql;
    }

    private convertRowToAppend(schema: TableSchema, tableName: string, row: Row): string {
        const afterRecord = this.toRecord(row.after);
        const keys = afterRecord ? Object.keys(afterRecord) : [];
        const fieldIdxStr = keys.length > 0 ? keys[0] : undefined;
        if (fieldIdxStr === undefined) {
            throw new SqlExecutionError('Invalid APPEND row data');
        }
        const fieldIdx = parseInt(fieldIdxStr);
        const colNameStr = schema.id2fieldName[fieldIdx];
        const value = afterRecord ? afterRecord[fieldIdx] : undefined;

        let sql = `APPEND INTO ${tableName} (${colNameStr}) VALUES (${this.valueToSql(value)})`;

        const beforeRecord = this.toRecord(row.before);
        if (beforeRecord && Object.keys(beforeRecord).length > 0) {
            const conditions: string[] = [];
            Object.entries(beforeRecord).forEach(([fieldIdxStr, value]) => {
                const fieldIdx = parseInt(fieldIdxStr);
                const colName = schema.id2fieldName[fieldIdx];
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

    private valueToSql(value: any): string {
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        return String(value);
    }
}
