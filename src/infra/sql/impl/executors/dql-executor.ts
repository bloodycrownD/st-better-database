import type {TableSchema} from '../../index';
import {SqlType} from '../../index';
import type {SqlResult} from '../../types/result';
import type {DataStorage} from '../../interfaces/storage/data-storage';
import {ExpressionEvaluator} from '../utils';

export class DqlExecutor {
    private expressionEvaluator: ExpressionEvaluator;

    constructor(
        private tableSchemas: Map<number, TableSchema>,
        private dataStorage: DataStorage,
        private validateTableExists: (tableName: string) => number
    ) {
        this.expressionEvaluator = new ExpressionEvaluator();
    }

    executeSelect(stmt: any): SqlResult {
        const tableName = stmt.from;
        const tableIdx = this.validateTableExists(tableName);
        const schema = this.tableSchemas.get(tableIdx)!;

        let data = this.dataStorage.getTableData(tableIdx);

        if (stmt.where) {
            data = data.filter(row =>
                this.expressionEvaluator.evaluateWhere(stmt.where!, schema, tableIdx, row)
            );
        }

        const result: Map<string, any>[] = [];

        for (const row of data) {
            const resultRow = new Map<string, any>();

            for (const col of stmt.columns) {
                if (col.type === 'star') {
                    for (const [fieldIdx, fieldName] of schema.id2fieldName.entries()) {
                        resultRow.set(fieldName, row.get(fieldIdx));
                    }
                } else if (col.type === 'column') {
                    const colName = col.tableName ? col.name : col.name;
                    const fieldIdx = schema.fieldName2id.get(colName);
                    if (fieldIdx !== undefined) {
                        resultRow.set(colName, row.get(fieldIdx));
                    }
                }
            }

            result.push(resultRow);
        }

        if (stmt.orderBy) {
            const orderByClause = stmt.orderBy[0];
            if (orderByClause) {
                const colName = orderByClause.column;
                const fieldIdx = schema.fieldName2id.get(colName);

                if (fieldIdx !== undefined) {
                    result.sort((a, b) => {
                        const aVal = a.get(colName);
                        const bVal = b.get(colName);

                        if (aVal === null && bVal === null) return 0;
                        if (aVal === null) return orderByClause.ascending ? -1 : 1;
                        if (bVal === null) return orderByClause.ascending ? 1 : -1;

                        if (aVal < bVal) return orderByClause.ascending ? -1 : 1;
                        if (aVal > bVal) return orderByClause.ascending ? 1 : -1;
                        return 0;
                    });
                }
            }
        }

        return {
            success: true,
            message: `Selected ${result.length} row(s)`,
            data: result,
            type: SqlType.DQL
        };
    }
}
