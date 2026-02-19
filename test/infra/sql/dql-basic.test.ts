import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql';
import { SqlType } from '../../../src/infra/sql';

describe('DQL - Basic SELECT', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)', [SqlType.DML]);
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    it('should select all columns with *', () => {
        const sql = 'SELECT * FROM users';
        const result = executor.execute(sql, [SqlType.DQL]);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Selected 3 row(s)');
        expect((result.data as any[]).length).toBe(3);

        const row = (result.data as any[])[0];
        expect(row.id).toBe(1);
        expect(row.name).toBe('Alice');
        expect(row.age).toBe(25);
    });

    it('should select specific columns', () => {
        const sql = 'SELECT name, age FROM users';
        const result = executor.execute(sql, [SqlType.DQL]);

        expect(result.success).toBe(true);
        expect((result.data as any[]).length).toBe(3);

        const row = (result.data as any[])[0];
        expect(row.id).toBeUndefined();
        expect(row.name).toBe('Alice');
        expect(row.age).toBe(25);
    });

    it('should select single column', () => {
        const sql = 'SELECT name FROM users';
        const result = executor.execute(sql, [SqlType.DQL]);

        expect(result.success).toBe(true);
        expect((result.data as any[]).length).toBe(3);
    });

    it('should throw error when selecting from non-existent table', () => {
        expect(() => {
            executor.execute('SELECT * FROM nonexist', [SqlType.DQL]);
        }).toThrow();
    });
});
