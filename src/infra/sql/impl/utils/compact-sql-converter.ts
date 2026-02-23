import type {TableSchema} from '@/infra/sql';
import {Parser} from '@/infra/sql';

export class SqlValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SqlValidationError';
    }
}

export class CompactSqlConverter {
    static validateSql(sql: string): string[] {
        const errors: string[] = [];
        const parseResult = Parser.parse(sql);

        for (const error of parseResult.errors) {
            errors.push(error);
        }

        const sqlStatements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const stmt of sqlStatements) {
            const errors2 = this.checkBasicSyntax(stmt);
            errors.push(...errors2);
        }

        return errors;
    }

    private static checkBasicSyntax(sql: string): string[] {
        const errors: string[] = [];

        const singleQuotes = (sql.match(/'/g) || []).length;
        if (singleQuotes % 2 !== 0) {
            errors.push(`SQL 语句中的单引号未闭合: ${sql}`);
        }

        const parenthesisStack: string[] = [];
        let inString = false;
        let i = 0;

        while (i < sql.length) {
            const char = sql[i];
            const nextChar = sql[i + 1];

            if (char === "'" && (!inString || (inString && (nextChar !== "'" || sql[i - 1] === "'")))) {
                inString = !inString;
            }

            if (!inString) {
                if (char === '(') {
                    parenthesisStack.push('(');
                } else if (char === ')') {
                    if (parenthesisStack.length === 0) {
                        errors.push(`SQL 语句中有未匹配的右括号: ${sql}`);
                        return errors;
                    }
                    parenthesisStack.pop();
                }
            }

            i++;
        }

        if (parenthesisStack.length > 0) {
            errors.push(`SQL 语句中有未闭合的括号: ${sql}`);
        }

        return errors;
    }

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
            const tableId = `@t${tableIdx}`;

            const columnEntries = Object.entries(schema.columnSchemas);

            columnEntries.sort((a, b) => {
                const [, colSchemaA] = a;
                const [, colSchemaB] = b;
                return colSchemaB.name.length - colSchemaA.name.length;
            });

            for (const [colIdxStr, colSchema] of columnEntries) {
                const colIdx = parseInt(colIdxStr);
                const columnName = colSchema.name;
                const colId = `@t${tableIdx}c${colIdx}`;

                result = result.replace(new RegExp(`\\b${columnName.replace(/@/g, '\\@')}\\b`, 'g'), colId);
            }

            result = result.replace(new RegExp(`\\b${tableName.replace(/@/g, '\\@')}\\b`, 'g'), tableId);
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
            const tableId = `@t${tableIdx}`;

            const columnEntries = Object.entries(schema.columnSchemas);

            columnEntries.sort((a, b) => {
                const [idxA] = a;
                const [idxB] = b;
                return idxB.length - idxA.length;
            });

            for (const [colIdxStr, colSchema] of columnEntries) {
                const colIdx = parseInt(colIdxStr);
                const columnName = colSchema.name;
                const colId = `@t${tableIdx}c${colIdx}`;

                result = result.replace(new RegExp(colId.replace(/@/g, '\\@'), 'g'), columnName);
            }

            result = result.replace(new RegExp(tableId.replace(/@/g, '\\@'), 'g'), tableName);
        }

        return result;
    }
}
