import type {TableSchema} from '@/infra/sql';
import type {ExecutorStructure} from '@/infra/sql';
import {SqlType} from '@/infra/sql';
import type {SqlResult} from '@/infra/sql';
import type {DataStorage} from '@/infra/sql';
import {ExpressionEvaluator} from '@/infra/sql';

export class DqlExecutor {
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

    executeSelect(stmt: any): SqlResult {
        const tableName = stmt.from;
        const tableIdx = this.validateTableExists(tableName);
        const schema = this.tableSchemas[tableIdx]!;

        let data = this.dataStorage.getTableData(tableIdx);

        if (stmt.where) {
            data = data.filter(row =>
                this.expressionEvaluator.evaluateWhere(stmt.where!, schema, tableIdx, row)
            );
        }

        const result: Record<string, any>[] = [];

        for (const row of data) {
            const resultRow: Record<string, any> = {};

            for (const col of stmt.columns) {
                if (col.type === 'star') {
                    for (const [fieldIdxStr, fieldName] of Object.entries(schema.id2fieldName)) {
                        const fieldIdx = parseInt(fieldIdxStr);
                        resultRow[fieldName] = row[fieldIdx];
                    }
                } else if (col.type === 'column') {
                    const colName = col.tableName ? col.name : col.name;
                    const fieldIdx = schema.fieldName2id[colName];
                    if (fieldIdx !== undefined) {
                        resultRow[colName] = row[fieldIdx];
                    }
                }
            }

            result.push(resultRow);
        }

        if (stmt.orderBy) {
            const orderByClause = stmt.orderBy[0];
            if (orderByClause) {
                const colName = orderByClause.column;
                const fieldIdx = schema.fieldName2id[colName];

                if (fieldIdx !== undefined) {
                    result.sort((a, b) => {
                        const aVal = a[colName];
                        const bVal = b[colName];

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
