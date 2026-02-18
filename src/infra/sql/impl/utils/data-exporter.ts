import type {Row, RowData, TableSchema} from '../../index';
import {ActionType, ExportFormat, SqlExecutionError} from '../../index';
import type {DataStorage} from '@/infra/sql';

export class DataExporter {
    export(
        dataStorage: DataStorage,
        tableSchemas: Map<number, TableSchema>,
        format: ExportFormat,
        table?: string,
        getTableIdxByName?: (tableName: string) => number | undefined
    ): string {
        if (table) {
            if (!getTableIdxByName) {
                throw new SqlExecutionError('getTableIdxByName function is required when exporting a specific table');
            }
            const tableIdx = getTableIdxByName(table);
            if (tableIdx === undefined) {
                throw new SqlExecutionError(`Table '${table}' does not exist`);
            }
            const schema = tableSchemas.get(tableIdx);
            if (!schema) {
                throw new SqlExecutionError(`Schema for table '${table}' not found`);
            }
            const data = dataStorage.getTableData(tableIdx);
            return this.exportTable(schema, data, format, tableIdx);
        }

        const results: string[] = [];
        for (const [tableIdx, schema] of tableSchemas.entries()) {
            const data = dataStorage.getTableData(tableIdx);
            results.push(this.exportTable(schema, data, format, tableIdx));
        }

        return results.join('\n\n');
    }

    private exportTable(schema: TableSchema, data: RowData[], format: ExportFormat, tableIdx: number): string {
        switch (format) {
            case ExportFormat.INSERT_SQL:
                return this.exportAsInsertSql(schema, data);
            case ExportFormat.ROW_JSON:
                return this.exportAsRowJson(schema, data, tableIdx);
            case ExportFormat.TABLE_SCHEMA:
                return JSON.stringify(schema, null, 2);
            default:
                throw new SqlExecutionError(`Unknown export format: ${format}`);
        }
    }

    private exportAsInsertSql(schema: TableSchema, data: RowData[]): string {
        const lines: string[] = [];

        for (const row of data) {
            const values: string[] = [];
            for (const [fieldIdx] of schema.id2fieldName.entries()) {
                const value = row.get(fieldIdx);
                if (value === null) {
                    values.push('NULL');
                } else if (typeof value === 'string') {
                    values.push(`'${value.replace(/'/g, "''")}'`);
                } else {
                    values.push(String(value));
                }
            }

            const columns = Array.from(schema.id2fieldName.values()).join(', ');
            lines.push(`INSERT INTO ${schema.tableName} (${columns}) VALUES (${values.join(', ')});`);
        }

        return lines.join('\n');
    }

    private exportAsRowJson(schema: TableSchema, data: RowData[], tableIdx: number): string {
        const rows: Row[] = [];

        for (const row of data) {
            const rowData = new Map<number, any>();
            for (const [fieldIdx] of schema.id2fieldName.entries()) {
                rowData.set(fieldIdx, row.get(fieldIdx));
            }

            rows.push({
                action: ActionType.INSERT,
                tableIdx,
                after: rowData
            });
        }

        return JSON.stringify(rows, null, 2);
    }
}
