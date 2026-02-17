import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql';
import { SqlType } from '../../../src/infra/sql';

describe('DQL Operations', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)', [SqlType.DML]);
    });

    describe('SELECT - Basic', () => {
        it('should select all columns with *', () => {
            const sql = 'SELECT * FROM users';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Selected 3 row(s)');
            expect((result.data as any[]).length).toBe(3);

            const row = (result.data as any[])[0];
            expect(row.get('id')).toBe(1);
            expect(row.get('name')).toBe('Alice');
            expect(row.get('age')).toBe(25);
        });

        it('should select specific columns', () => {
            const sql = 'SELECT name, age FROM users';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect(result.success).toBe(true);
            expect((result.data as any[]).length).toBe(3);

            const row = (result.data as any[])[0];
            expect(row.has('id')).toBe(false);
            expect(row.get('name')).toBe('Alice');
            expect(row.get('age')).toBe(25);
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

    describe('WHERE clause', () => {
        it('should filter with equality condition', () => {
            const sql = 'SELECT * FROM users WHERE id = 1';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].get('name')).toBe('Alice');
        });

        it('should filter with inequality condition', () => {
            const sql = 'SELECT * FROM users WHERE age > 28';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(2);
        });

        it('should filter with multiple conditions using AND', () => {
            const sql = 'SELECT * FROM users WHERE age > 25 AND age < 35';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].get('name')).toBe('Bob');
        });

        it('should filter with multiple conditions using OR', () => {
            const sql = 'SELECT * FROM users WHERE age = 25 OR age = 35';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(2);
        });

        it('should filter with BETWEEN operator', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (4, \'David\', 28)', [SqlType.DML]);
            const sql = 'SELECT * FROM users WHERE age BETWEEN 25 AND 30';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(3);
        });

        it('should filter with IN operator', () => {
            const sql = 'SELECT * FROM users WHERE id IN (1, 3)';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(2);
        });

        it('should filter with IS NULL', () => {
            executor.execute('CREATE TABLE items (id NUMBER, name STRING)', [SqlType.DDL]);
            executor.execute('INSERT INTO items (id, name) VALUES (1, NULL)', [SqlType.DML]);
            executor.execute('INSERT INTO items (id, name) VALUES (2, \'Test\')', [SqlType.DML]);

            const sql = 'SELECT * FROM items WHERE name IS NULL';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(1);
        });

        it('should filter with IS NOT NULL', () => {
            executor.execute('CREATE TABLE items (id NUMBER, name STRING)', [SqlType.DDL]);
            executor.execute('INSERT INTO items (id, name) VALUES (1, NULL)', [SqlType.DML]);
            executor.execute('INSERT INTO items (id, name) VALUES (2, \'Test\')', [SqlType.DML]);

            const sql = 'SELECT * FROM items WHERE name IS NOT NULL';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect((result.data as any[]).length).toBe(1);
        });
    });

    describe('ORDER BY clause', () => {
        it('should sort by column ascending', () => {
            const sql = 'SELECT * FROM users ORDER BY age ASC';
            const result = executor.execute(sql, [SqlType.DQL]);
            const rows = result.data as any[];

            expect(rows[0].get('age')).toBe(25);
            expect(rows[1].get('age')).toBe(30);
            expect(rows[2].get('age')).toBe(35);
        });

        it('should sort by column descending', () => {
            const sql = 'SELECT * FROM users ORDER BY age DESC';
            const result = executor.execute(sql, [SqlType.DQL]);
            const rows = result.data as any[];

            expect(rows[0].get('age')).toBe(35);
            expect(rows[1].get('age')).toBe(30);
            expect(rows[2].get('age')).toBe(25);
        });

        it('should sort with WHERE condition', () => {
            const sql = 'SELECT * FROM users WHERE age > 25 ORDER BY age ASC';
            const result = executor.execute(sql, [SqlType.DQL]);
            const rows = result.data as any[];

            expect(rows.length).toBe(2);
            expect(rows[0].get('age')).toBe(30);
            expect(rows[1].get('age')).toBe(35);
        });

        it('should handle NULL values in sorting', () => {
            executor.execute('CREATE TABLE items (id NUMBER, age NUMBER)', [SqlType.DDL]);
            executor.execute('INSERT INTO items (id, age) VALUES (1, NULL)', [SqlType.DML]);
            executor.execute('INSERT INTO items (id, age) VALUES (2, 30)', [SqlType.DML]);
            executor.execute('INSERT INTO items (id, age) VALUES (3, 25)', [SqlType.DML]);

            const sql = 'SELECT * FROM items ORDER BY age ASC';
            const result = executor.execute(sql, [SqlType.DQL]);
            const rows = result.data as any[];

            expect(rows[0].get('age')).toBeNull();
            expect(rows[1].get('age')).toBe(25);
            expect(rows[2].get('age')).toBe(30);
        });
    });

    describe('Empty results', () => {
        it('should return empty array when no rows match', () => {
            const sql = 'SELECT * FROM users WHERE id = 999';
            const result = executor.execute(sql, [SqlType.DQL]);

            expect(result.success).toBe(true);
            expect(result.message).toContain('Selected 0 row(s)');
            expect((result.data as any[]).length).toBe(0);
        });
    });
});
