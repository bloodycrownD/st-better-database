import type {DataStorage, Row, RowData, SqlValue, TableSchema} from '@/infra/sql';
import {ActionType, ExportFormat, SQLBuilder, SqlExecutionError} from '@/infra/sql';
import {MarkdownExporter} from './markdown';

export class DataExporter {
    export(
        dataStorage: DataStorage,
        tableSchemas: Record<number, TableSchema>,
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
            const schema = tableSchemas[tableIdx];
            if (!schema) {
                throw new SqlExecutionError(`Schema for table '${table}' not found`);
            }
            const data = dataStorage.getTableData(tableIdx);
            return this.exportTable(schema, data, format, tableIdx);
        }

        const results: string[] = [];
        for (const [tableIdxStr, schema] of Object.entries(tableSchemas)) {
            const tableIdx = parseInt(tableIdxStr);
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
            case ExportFormat.DDL:
                return this.exportAsDDL(schema);
            case ExportFormat.MARKDOWN:
                return this.exportAsMarkdown(schema, data);
            case ExportFormat.STANDARD_DATA:
                return this.exportAsStandardData(schema, data);
            default:
                throw new SqlExecutionError(`Unknown export format: ${format}`);
        }
    }

    private exportAsInsertSql(schema: TableSchema, data: RowData[]): string {
        const lines: string[] = [];

        for (const row of data) {
            const values: string[] = [];
            for (const [fieldIdxStr] of Object.entries(schema.id2fieldName)) {
                const fieldIdx = parseInt(fieldIdxStr);
                const value = row[fieldIdx];
                if (value === null) {
                    values.push('NULL');
                } else if (typeof value === 'string') {
                    values.push(`'${value.replace(/'/g, "''")}'`);
                } else {
                    values.push(String(value));
                }
            }

            const columns = Object.values(schema.id2fieldName).join(', ');
            lines.push(`INSERT INTO ${schema.tableName} (${columns}) VALUES (${values.join(', ')});`);
        }

        return lines.join('\n');
    }

    private exportAsRowJson(schema: TableSchema, data: RowData[], tableIdx: number): string {
        const rows: Row[] = [];

        for (const row of data) {
            const rowData: Record<number, any> = {};
            for (const [fieldIdxStr] of Object.entries(schema.id2fieldName)) {
                const fieldIdx = parseInt(fieldIdxStr);
                rowData[fieldIdx] = row[fieldIdx];
            }

            rows.push({
                action: ActionType.INSERT,
                tableIdx,
                after: rowData
            });
        }

        return JSON.stringify(rows, null, 2);
    }

    private exportAsMarkdown(schema: TableSchema, data: RowData[]): string {
        return MarkdownExporter.exportTable(schema, data);
    }

    private exportAsStandardData(schema: TableSchema, data: RowData[]): string {
        const standardData: Record<string, Record<string, SqlValue>[]> = {};
        const rows: Record<string, SqlValue>[] = [];

        for (const row of data) {
            const rowData: Record<string, SqlValue> = {};
            for (const [fieldIdxStr, fieldName] of Object.entries(schema.id2fieldName)) {
                const fieldIdx = parseInt(fieldIdxStr);
                rowData[fieldName] = row[fieldIdx] ?? null;
            }
            rows.push(rowData);
        }
        standardData[schema.tableName] = rows;
        return JSON.stringify(standardData, null, 2);
    }

    private exportAsDDL(schema: TableSchema): string {
        const columnDefs: Record<string, string> = {};
        const columnComments: Record<string, string> = {};
        for (const [fieldIdxStr] of Object.entries(schema.id2fieldName)) {
            const fieldIdx = parseInt(fieldIdxStr);
            const colSchema = schema.columnSchemas[fieldIdx];
            if (colSchema) {
                const typeDef = colSchema.type + (colSchema.primitiveKey ? ' PRIMARY KEY' : '');
                columnDefs[colSchema.name] = typeDef;
                if (colSchema.comment) {
                    columnComments[colSchema.name] = colSchema.comment;
                }
            }
        }
        const columnDefsMap = new Map(Object.entries(columnDefs));
        const columnCommentsMap = new Map(Object.entries(columnComments));
        return SQLBuilder.ddl().createTable(schema.tableName, columnDefsMap, schema.comment, columnCommentsMap);
    }
}
