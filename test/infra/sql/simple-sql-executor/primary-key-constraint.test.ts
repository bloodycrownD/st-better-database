import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType } from '@/infra/sql';

describe('Primary Key Constraints', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    describe('Single Column Primary Key', () => {
        beforeEach(() => {
            executor.execute('CREATE TABLE users (id NUMBER PRIMARY KEY, name STRING, age NUMBER)', [SqlType.DDL]);
        });

        it('should insert first row with primary key', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].id).toBe(1);
        });

        it('should update existing row when inserting duplicate primary key', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Bob\', 30)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].id).toBe(1);
            expect((result.data as any[])[0].name).toBe('Bob');
            expect((result.data as any[])[0].age).toBe(30);
        });

        it('should update only provided columns on duplicate key', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name) VALUES (1, \'Bob\')', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].id).toBe(1);
            expect((result.data as any[])[0].name).toBe('Bob');
            expect((result.data as any[])[0].age).toBe(25);
        });

        it('should allow inserting rows with different primary keys', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(2);
            expect((result.data as any[])[0].id).toBe(1);
            expect((result.data as any[])[1].id).toBe(2);
        });

        it('should handle multiple duplicate key inserts', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Bob\', 30)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Charlie\', 35)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].id).toBe(1);
            expect((result.data as any[])[0].name).toBe('Charlie');
            expect((result.data as any[])[0].age).toBe(35);
        });

        it('should handle bulk inserts with duplicate keys', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25), (2, \'Bob\', 30)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Charlie\', 35), (3, \'David\', 40)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(3);
            expect((result.data as any[])[0].id).toBe(1);
            expect((result.data as any[])[0].name).toBe('Charlie');
            expect((result.data as any[])[1].id).toBe(2);
            expect((result.data as any[])[2].id).toBe(3);
        });
    });

    describe('Multiple Column Primary Key', () => {
        beforeEach(() => {
            executor.execute('CREATE TABLE orders (order_id NUMBER, product_id NUMBER, quantity NUMBER)', [SqlType.DDL]);
            executor.execute('ALTER TABLE orders MODIFY COLUMN order_id NUMBER PRIMARY KEY', [SqlType.DDL]);
            executor.execute('ALTER TABLE orders MODIFY COLUMN product_id NUMBER PRIMARY KEY', [SqlType.DDL]);
        });

        it('should insert first row with composite primary key', () => {
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (1, 100, 5)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM orders', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].order_id).toBe(1);
            expect((result.data as any[])[0].product_id).toBe(100);
        });

        it('should update existing row when duplicate composite key', () => {
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (1, 100, 5)', [SqlType.DML]);
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (1, 100, 10)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM orders', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].order_id).toBe(1);
            expect((result.data as any[])[0].product_id).toBe(100);
            expect((result.data as any[])[0].quantity).toBe(10);
        });

        it('should allow different composite keys', () => {
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (1, 100, 5)', [SqlType.DML]);
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (1, 101, 3)', [SqlType.DML]);
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (2, 100, 7)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM orders ORDER BY order_id, product_id', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(3);
        });

        it('should update only provided columns on duplicate composite key', () => {
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (1, 100, 5)', [SqlType.DML]);
            executor.execute('INSERT INTO orders (order_id, product_id) VALUES (1, 100)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM orders', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].order_id).toBe(1);
            expect((result.data as any[])[0].product_id).toBe(100);
            expect((result.data as any[])[0].quantity).toBe(5);
        });

        it('should handle bulk inserts with duplicate composite keys', () => {
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (1, 100, 5), (1, 101, 3)', [SqlType.DML]);
            executor.execute('INSERT INTO orders (order_id, product_id, quantity) VALUES (1, 100, 10), (2, 100, 7)', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM orders ORDER BY order_id, product_id', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(3);
            expect((result.data as any[])[0].quantity).toBe(10);
            expect((result.data as any[])[1].quantity).toBe(3);
            expect((result.data as any[])[2].quantity).toBe(7);
        });
    });

    describe('Without Primary Key', () => {
        beforeEach(() => {
            executor.execute('CREATE TABLE logs (id NUMBER, message STRING)', [SqlType.DDL]);
        });

        it('should allow duplicate rows when no primary key', () => {
            executor.execute('INSERT INTO logs (id, message) VALUES (1, \'Error\')', [SqlType.DML]);
            executor.execute('INSERT INTO logs (id, message) VALUES (1, \'Error\')', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM logs', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(2);
        });

        it('should insert all rows without constraint checking', () => {
            executor.execute('INSERT INTO logs (id, message) VALUES (1, \'A\'), (1, \'B\')', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM logs', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(2);
        });
    });

    describe('String Primary Key', () => {
        beforeEach(() => {
            executor.execute('CREATE TABLE settings (name STRING PRIMARY KEY, value STRING)', [SqlType.DDL]);
        });

        it('should update existing row when duplicate string key', () => {
            executor.execute('INSERT INTO settings (name, value) VALUES (\'theme\', \'dark\')', [SqlType.DML]);
            executor.execute('INSERT INTO settings (name, value) VALUES (\'theme\', \'light\')', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM settings', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
            expect((result.data as any[])[0].name).toBe('theme');
            expect((result.data as any[])[0].value).toBe('light');
        });

        it('should handle different string keys', () => {
            executor.execute('INSERT INTO settings (name, value) VALUES (\'theme\', \'dark\')', [SqlType.DML]);
            executor.execute('INSERT INTO settings (name, value) VALUES (\'language\', \'en\')', [SqlType.DML]);

            const result = executor.execute('SELECT * FROM settings ORDER BY name', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(2);
        });
    });
});
