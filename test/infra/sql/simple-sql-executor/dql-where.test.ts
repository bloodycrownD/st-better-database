import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor, SqlType } from '../../../../src/infra/sql';

describe('DQL - WHERE', () => {
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

    describe('Equality', () => {
        it('should filter with equality condition', () => {
            const sql = 'SELECT * FROM users WHERE id = 1';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].name).toBe('Alice');
        });
    });

    describe('AND', () => {
        it('should filter with multiple conditions using AND', () => {
            const sql = 'SELECT * FROM users WHERE age > 25 AND age < 35';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].name).toBe('Bob');
        });
    });

    describe('OR', () => {
        it('should filter with OR condition', () => {
            const sql = 'SELECT * FROM users WHERE name = \'Alice\' OR name = \'Charlie\'';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(2);
        });
    });

    describe('Inequality', () => {
        it('should filter with inequality operators', () => {
            const sql = 'SELECT * FROM users WHERE age != 30';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(2);
        });
    });

    describe('BETWEEN', () => {
        it('should filter with BETWEEN', () => {
            const sql = 'SELECT * FROM users WHERE age BETWEEN 25 AND 35';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(3);
        });
    });

    describe('IN', () => {
        it('should filter with IN', () => {
            const sql = 'SELECT * FROM users WHERE name IN (\'Alice\', \'Bob\')';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(2);
        });
    });

    describe('IS NULL', () => {
        it('should filter NULL values', () => {
            executor.execute('INSERT INTO users (id, name) VALUES (4, \'David\')', [SqlType.DML]);
            const sql = 'SELECT * FROM users WHERE age IS NULL';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].name).toBe('David');
        });
    });

    describe('IS NOT NULL', () => {
        it('should filter NOT NULL values', () => {
            executor.execute('INSERT INTO users (id, name) VALUES (4, \'David\')', [SqlType.DML]);
            const sql = 'SELECT * FROM users WHERE age IS NOT NULL';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(3);
        });
    });
});
