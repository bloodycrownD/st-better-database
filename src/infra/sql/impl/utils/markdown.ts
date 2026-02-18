import type {RowData, TableSchema} from '@/infra/sql';

export class MarkdownExporter {
    static exportTable(schema: TableSchema, data: RowData[]): string {
        if (data.length === 0) {
            return `**${schema.tableName}**\n\n*(无数据)*`;
        }

        const fieldIds = Array.from(schema.id2fieldName.keys());
        const headers = fieldIds.map(id => schema.id2fieldName.get(id)!);
        const separator = headers.map(() => '---');

        const rows: string[] = [];
        for (const row of data) {
            const cells: string[] = [];
            for (const fieldId of fieldIds) {
                const value = row.get(fieldId);
                cells.push(MarkdownExporter.formatValue(value));
            }
            rows.push(cells.join(' | '));
        }

        return `**${schema.tableName}**\n\n| ${headers.join(' | ')} |\n| ${separator.join(' | ')} |\n${rows.map(r => `| ${r} |`).join('\n')}`;
    }

    private static formatValue(value: any): string {
        if (value === null) {
            return '*NULL*';
        }
        if (typeof value === 'string') {
            return value.replace(/\n/g, '<br>');
        }
        return String(value);
    }
}
