import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType } from '@/infra/sql';

describe('DQL - ORDER BY clause', () => {
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

    it('should sort by column ascending', () => {
        const sql = 'SELECT * FROM users ORDER BY age ASC';
        const result = executor.execute(sql, [SqlType.DQL]);
        const rows = result.data as any[];

        expect(rows[0].age).toBe(25);
        expect(rows[1].age).toBe(30);
        expect(rows[2].age).toBe(35);
    });

    it('should sort by column descending', () => {
        const sql = 'SELECT * FROM users ORDER BY age DESC';
        const result = executor.execute(sql, [SqlType.DQL]);
        const rows = result.data as any[];

        expect(rows[0].age).toBe(35);
        expect(rows[1].age).toBe(30);
        expect(rows[2].age).toBe(25);
    });

    it('should sort with WHERE condition', () => {
        const sql = 'SELECT * FROM users WHERE age > 25 ORDER BY age ASC';
        const result = executor.execute(sql, [SqlType.DQL]);
        const rows = result.data as any[];

        expect(rows.length).toBe(2);
        expect(rows[0].age).toBe(30);
        expect(rows[1].age).toBe(35);
    });

    it('should handle NULL values in sorting', () => {
        executor.execute('CREATE TABLE items (id NUMBER, age NUMBER)', [SqlType.DDL]);
        executor.execute('INSERT INTO items (id, age) VALUES (1, NULL)', [SqlType.DML]);
        executor.execute('INSERT INTO items (id, age) VALUES (2, 30)', [SqlType.DML]);
        executor.execute('INSERT INTO items (id, age) VALUES (3, 25)', [SqlType.DML]);

        const sql = 'SELECT * FROM items ORDER BY age ASC';
        const result = executor.execute(sql, [SqlType.DQL]);
        const rows = result.data as any[];

        expect(rows[0].age).toBeNull();
        expect(rows[1].age).toBe(25);
        expect(rows[2].age).toBe(30);
    });
});
