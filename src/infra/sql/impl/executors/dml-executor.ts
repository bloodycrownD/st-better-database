import type {DataStorage, ExecutorStructure, RowData, SqlResult, TableSchema} from '@/infra/sql';
import {ExpressionEvaluator, FieldType, SqlType, SqlValidationError} from '@/infra/sql';

export class DmlExecutor {
    private expressionEvaluator: ExpressionEvaluator;

    constructor(
        private structure: ExecutorStructure,
        private dataStorage: DataStorage,
        private validateTableExists: (tableName: string) => number
    ) {
        this.expressionEvaluator = new ExpressionEvaluator();
    }

    private get tableSchemas(): Record<number, TableSchema> {
        return this.structure.tableSchemas;
    }

    executeInsert(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        const tableIdx = this.validateTableExists(tableName);
        const schema = this.tableSchemas[tableIdx]!;

        let affectedRows = 0;

        for (const valueRow of stmt.values) {
            const rowData: RowData = {};

            const providedColumns: Record<string, number> = {};
            for (let i = 0; i < stmt.columns.length; i++) {
                const colName = stmt.columns[i];
                const fieldIdx = schema.fieldName2id[colName];
                if (fieldIdx === undefined) {
                    throw new SqlValidationError(
                        `Column '${colName}' does not exist in table '${tableName}'`,
                        `INSERT INTO ${tableName}`
                    );
                }
                providedColumns[colName] = i;
            }

            for (const [fieldIdxStr, colSchema] of Object.entries(schema.columnSchemas)) {
                const fieldIdx = parseInt(fieldIdxStr);
                const colName = colSchema.name;
                const providedIdx = providedColumns[colName];

                if (providedIdx !== undefined) {
                    const expr = valueRow[providedIdx];
                    const value = this.expressionEvaluator.evaluateExpression(expr, schema, tableIdx, null);

                    if (value === null && colSchema.defaultValue !== undefined) {
                        rowData[fieldIdx] = colSchema.defaultValue;
                    } else {
                        rowData[fieldIdx] = value;
                    }
                } else if (colSchema.defaultValue !== undefined) {
                    rowData[fieldIdx] = colSchema.defaultValue;
                } else {
                    rowData[fieldIdx] = null;
                }
            }

            const data = this.dataStorage.getTableData(tableIdx);
            data.push(rowData);
            this.dataStorage.setTableData(tableIdx, data);
            affectedRows++;
        }

        return {
            success: true,
            message: `Inserted ${affectedRows} row(s) into '${tableName}'`,
            data: affectedRows,
            type: SqlType.DML
        };
    }

    executeUpdate(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        const tableIdx = this.validateTableExists(tableName);
        const schema = this.tableSchemas[tableIdx]!;

        let affectedRows = 0;
        const data = this.dataStorage.getTableData(tableIdx);

        for (const row of data) {
            const matchWhere = stmt.where === undefined || stmt.where === null || this.expressionEvaluator.evaluateWhere(stmt.where, schema, tableIdx, row);
            if (matchWhere) {
                for (const set of stmt.sets) {
                    const fieldIdx = schema.fieldName2id[set.column];
                    if (fieldIdx === undefined) {
                        throw new SqlValidationError(
                            `Column '${set.column}' does not exist in table '${tableName}'`,
                            `UPDATE ${tableName}`
                        );
                    }

                    const value = this.expressionEvaluator.evaluateExpression(set.value, schema, tableIdx, row);
                    row[fieldIdx] = value;
                }
                affectedRows++;
            }
        }

        this.dataStorage.setTableData(tableIdx, data);

        return {
            success: true,
            message: `Updated ${affectedRows} row(s) in '${tableName}'`,
            data: affectedRows,
            type: SqlType.DML
        };
    }

    executeDelete(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        const tableIdx = this.validateTableExists(tableName);
        const schema = this.tableSchemas[tableIdx]!;

        const data = this.dataStorage.getTableData(tableIdx);
        const newData: RowData[] = [];

        for (const row of data) {
            const matchWhere = stmt.where === undefined || stmt.where === null || this.expressionEvaluator.evaluateWhere(stmt.where, schema, tableIdx, row);
            if (!matchWhere) {
                newData.push(row);
            }
        }

        const affectedRows = data.length - newData.length;
        this.dataStorage.setTableData(tableIdx, newData);

        return {
            success: true,
            message: `Deleted ${affectedRows} row(s) from '${tableName}'`,
            data: affectedRows,
            type: SqlType.DML
        };
    }

    executeAppend(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        const tableIdx = this.validateTableExists(tableName);
        const schema = this.tableSchemas[tableIdx]!;

        const colName = stmt.column;
        const fieldIdx = schema.fieldName2id[colName];
        if (fieldIdx === undefined) {
            throw new SqlValidationError(
                `Column '${colName}' does not exist in table '${tableName}'`,
                `APPEND INTO ${tableName}`
            );
        }

        const colSchema = schema.columnSchemas[fieldIdx];
        if (!colSchema || colSchema.type !== FieldType.STRING) {
            throw new SqlValidationError(
                `Column '${colName}' must be STRING type for APPEND operation`,
                `APPEND INTO ${tableName}`
            );
        }

        let affectedRows = 0;
        const data = this.dataStorage.getTableData(tableIdx);

        for (const row of data) {
            const matchWhere = stmt.where === undefined || stmt.where === null || this.expressionEvaluator.evaluateWhere(stmt.where, schema, tableIdx, row);
            if (matchWhere) {
                let currentValue = row[fieldIdx];
                if (currentValue === null || currentValue === undefined) {
                    currentValue = '';
                }
                const appendValue = this.expressionEvaluator.evaluateExpression(stmt.value, schema, tableIdx, row) as string;
                row[fieldIdx] = (currentValue as string) + appendValue;
                affectedRows++;
            }
        }

        this.dataStorage.setTableData(tableIdx, data);

        return {
            success: true,
            message: `Appended to ${affectedRows} row(s) in '${tableName}'`,
            data: affectedRows,
            type: SqlType.DML
        };
    }
}
