import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType, ExportFormat, ActionType } from '@/infra/sql';

describe('Row Export - ROW_JSON format', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    it('should export as Row JSON format', () => {
        const exported = executor.export(ExportFormat.ROW_JSON);
        const rows = JSON.parse(exported);

        expect(Array.isArray(rows)).toBe(true);
        expect(rows.length).toBe(2);
        expect(rows[0].action).toBe(ActionType.INSERT);
    });

    it('should include tableIdx in exported rows', () => {
        const exported = executor.export(ExportFormat.ROW_JSON);
        const rows = JSON.parse(exported);

        rows.forEach((row: any) => {
            expect(row.tableIdx).toBeDefined();
            expect(typeof row.tableIdx).toBe('number');
        });
    });
});
