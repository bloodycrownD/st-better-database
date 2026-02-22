import type {TableSchema} from '@/infra/sql';

export class CompactSqlConverter {
    static compressDml(
        dml: string,
        tableSchemas: Record<number, TableSchema>
    ): string {
        let result = dml;

        const tableEntries = Object.entries(tableSchemas);

        tableEntries.sort((a, b) => {
            const [, schemaA] = a;
            const [, schemaB] = b;
            return schemaB.tableName.length - schemaA.tableName.length;
        });

        for (const [tableIdxStr, schema] of tableEntries) {
            const tableIdx = parseInt(tableIdxStr);
            const tableName = schema.tableName;
            const tableId = `$t${tableIdx}`;

            const columnEntries = Object.entries(schema.columnSchemas);

            columnEntries.sort((a, b) => {
                const [, colSchemaA] = a;
                const [, colSchemaB] = b;
                return colSchemaB.name.length - colSchemaA.name.length;
            });

            for (const [colIdxStr, colSchema] of columnEntries) {
                const colIdx = parseInt(colIdxStr);
                const columnName = colSchema.name;
                const colId = `$t${tableIdx}c${colIdx}`;

                result = result.replace(new RegExp(`\\b${columnName.replace(/\$/g, '\\$')}\\b`, 'g'), colId);
            }

            result = result.replace(new RegExp(`\\b${tableName.replace(/\$/g, '\\$')}\\b`, 'g'), tableId);
        }

        return result;
    }

    static decompressDml(
        compressedDml: string,
        tableSchemas: Record<number, TableSchema>
    ): string {
        let result = compressedDml;

        const tableEntries = Object.entries(tableSchemas);

        tableEntries.sort((a, b) => {
            const [idxA] = a;
            const [idxB] = b;
            return idxB.length - idxA.length;
        });

        for (const [tableIdxStr, schema] of tableEntries) {
            const tableIdx = parseInt(tableIdxStr);
            const tableName = schema.tableName;
            const tableId = `$t${tableIdx}`;

            const columnEntries = Object.entries(schema.columnSchemas);

            columnEntries.sort((a, b) => {
                const [idxA] = a;
                const [idxB] = b;
                return idxB.length - idxA.length;
            });

            for (const [colIdxStr, colSchema] of columnEntries) {
                const colIdx = parseInt(colIdxStr);
                const columnName = colSchema.name;
                const colId = `$t${tableIdx}c${colIdx}`;

                result = result.replace(new RegExp(colId.replace(/\$/g, '\\$'), 'g'), columnName);
            }

            result = result.replace(new RegExp(tableId.replace(/\$/g, '\\$'), 'g'), tableName);
        }

        return result;
    }
}
