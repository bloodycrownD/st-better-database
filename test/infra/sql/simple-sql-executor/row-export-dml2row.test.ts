import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor, SqlType, ActionType } from '@/infra/sql';

describe('Row Export - dml2row', () => {
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

    describe('INSERT', () => {
        it('should convert INSERT to Row format', () => {
            const dml = 'INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)';
            const rows = executor.dml2row(dml);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe(ActionType.INSERT);
            expect(rows[0].tableIdx).toBeDefined();
            expect(rows[0].after).toBeDefined();
        });
    });

    describe('UPDATE', () => {
        it('should convert UPDATE to Row format', () => {
            const dml = 'UPDATE users SET age = 26 WHERE id = 1';
            const rows = executor.dml2row(dml);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe(ActionType.UPDATE);
            expect(rows[0].before).toBeDefined();
            expect(rows[0].after).toBeDefined();
        });
    });

    describe('DELETE', () => {
        it('should convert DELETE to Row format', () => {
            const dml = 'DELETE FROM users WHERE id = 1';
            const rows = executor.dml2row(dml);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe(ActionType.DELETE);
            expect(rows[0].before).toBeDefined();
        });
    });

    describe('APPEND', () => {
        it('should convert APPEND to Row format', () => {
            executor.execute('CREATE TABLE messages (id NUMBER, content STRING)', [SqlType.DDL]);
            const dml = 'APPEND INTO messages (content) VALUES (\' hello\')';
            const rows = executor.dml2row(dml);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe(ActionType.APPEND);
            expect(rows[0].after).toBeDefined();
        });
    });

    describe('Multiple statements', () => {
        it('should convert multiple statements', () => {
            const dml = 'INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35);UPDATE users SET age = 31 WHERE id = 2';
            const rows = executor.dml2row(dml);

            expect(rows).toHaveLength(2);
            expect(rows[0].action).toBe(ActionType.INSERT);
            expect(rows[1].action).toBe(ActionType.UPDATE);
        });
    });
});
