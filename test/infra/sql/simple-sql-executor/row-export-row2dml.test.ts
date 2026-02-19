import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../../src/infra/sql';
import { SqlType, ActionType, type Row } from '../../../../src/infra/sql';

function createRowData(obj: Record<number, any>): Map<number, any> {
    return new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));
}

describe('Row Export - row2dml', () => {
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

    it('should convert Row format to INSERT statement', () => {
        const rows: Row[] = [{
            action: ActionType.INSERT,
            tableIdx: 0,
            after: createRowData({ 0: 3, 1: "Charlie", 2: 35 })
        }];
        const dml = executor.row2dml(rows);

        expect(dml).toContain('INSERT INTO users');
        expect(dml).toContain('VALUES');
    });

    it('should convert Row format to UPDATE statement', () => {
        const rows: Row[] = [{
            action: ActionType.UPDATE,
            tableIdx: 0,
            before: createRowData({ 0: 1 }),
            after: createRowData({ 2: 26 })
        }];
        const dml = executor.row2dml(rows);

        expect(dml).toContain('UPDATE users SET');
        expect(dml).toContain('WHERE');
    });

    it('should convert Row format to DELETE statement', () => {
        const rows: Row[] = [{
            action: ActionType.DELETE,
            tableIdx: 0,
            before: createRowData({ 0: 1 })
        }];
        const dml = executor.row2dml(rows);

        expect(dml).toContain('DELETE FROM users');
    });

    it('should convert Row format to APPEND statement', () => {
        const rows: Row[] = [{
            action: ActionType.APPEND,
            tableIdx: 0,
            after: createRowData({ 1: " hello" })
        }];
        const dml = executor.row2dml(rows);

        expect(dml).toContain('APPEND INTO users');
    });

    it('should convert multiple Row entries', () => {
        const rows: Row[] = [
            {
                action: ActionType.INSERT,
                tableIdx: 0,
                after: createRowData({ 0: 3, 1: "Charlie", 2: 35 })
            },
            {
                action: ActionType.UPDATE,
                tableIdx: 0,
                before: createRowData({ 0: 1 }),
                after: createRowData({ 2: 26 })
            }
        ];
        const dml = executor.row2dml(rows);

        expect(dml).toContain('INSERT INTO users');
        expect(dml).toContain('UPDATE users SET');
    });
});
