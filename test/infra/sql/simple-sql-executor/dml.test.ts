import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType, SqlValidationError } from '@/infra/sql';

describe('DML Operations', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        const result = executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        if (!result.success) {
            throw new Error(`Failed to create table: ${result.message}`);
        }
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    describe('INSERT', () => {
        it('should insert a single row', () => {
            const sql = 'INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.message).toContain("Inserted 1 row(s) into 'users'");
            expect(result.data).toBe(1);
        });

        it('should insert multiple rows', () => {
            const sql = 'INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25), (2, \'Bob\', 30)';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(2);
        });

        it('should insert with default values', () => {
            executor.execute('CREATE TABLE items (id NUMBER, name STRING DEFAULT \'unknown\')', [SqlType.DDL]);
            const sql = 'INSERT INTO items (id) VALUES (1)';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);

            const selectResult = executor.execute('SELECT * FROM items', [SqlType.DQL]);
            const row = (selectResult.data as any[])[0];
            expect(row.name).toBe('unknown');
        });

        it('should throw error when inserting into non-existent column', () => {
            expect(() => {
                executor.execute('INSERT INTO users (nonexist) VALUES (1)', [SqlType.DML]);
            }).toThrow(SqlValidationError);
        });

        it('should throw error when inserting into non-existent table', () => {
            expect(() => {
                executor.execute('INSERT INTO nonexist (id) VALUES (1)', [SqlType.DML]);
            }).toThrow(SqlValidationError);
        });
    });

    describe('UPDATE', () => {
        beforeEach(() => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
        });

        it('should update rows with WHERE condition', () => {
            const sql = 'UPDATE users SET age = 26 WHERE id = 1';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);

            const selectResult = executor.execute('SELECT * FROM users WHERE id = 1', [SqlType.DQL]);
            const row = (selectResult.data as any[])[0];
            expect(row.age).toBe(26);
        });

        it('should update all rows when WHERE is omitted', () => {
            const sql = 'UPDATE users SET name = \'Updated\'';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(2);

            const selectResult = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            const rows = selectResult.data as any[];
            rows.forEach((row: any) => {
                expect(row.name).toBe('Updated');
            });
        });

        it('should update multiple columns', () => {
            const sql = 'UPDATE users SET name = \'Charlie\', age = 35 WHERE id = 1';
            executor.execute(sql, [SqlType.DML]);

            const selectResult = executor.execute('SELECT * FROM users WHERE id = 1', [SqlType.DQL]);
            const row = (selectResult.data as any[])[0];
            expect(row.name).toBe('Charlie');
            expect(row.age).toBe(35);
        });

        it('should throw error when updating non-existent column', () => {
            expect(() => {
                executor.execute('UPDATE users SET nonexist = 1', [SqlType.DML]);
            }).toThrow(SqlValidationError);
        });
    });

    describe('DELETE', () => {
        beforeEach(() => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)', [SqlType.DML]);
        });

        it('should delete rows with WHERE condition', () => {
            const sql = 'DELETE FROM users WHERE id = 1';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);

            const selectResult = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((selectResult.data as any[]).length).toBe(2);
        });

        it('should delete all rows when WHERE is omitted', () => {
            const sql = 'DELETE FROM users';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(3);

            const selectResult = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((selectResult.data as any[]).length).toBe(0);
        });

        it('should delete no rows when WHERE condition matches none', () => {
            const sql = 'DELETE FROM users WHERE id = 999';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(0);

            const selectResult = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((selectResult.data as any[]).length).toBe(3);
        });
    });

    describe('APPEND', () => {
        beforeEach(() => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
        });

        it('should append to STRING column for all rows', () => {
            const sql = 'APPEND INTO users (name) VALUES (\' Smith\')';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(2);

            const selectResult = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            const rows = selectResult.data as any[];
            expect(rows[0].name).toBe('Alice Smith');
            expect(rows[1].name).toBe('Bob Smith');
        });

        it('should append to STRING column with WHERE condition', () => {
            const sql = 'APPEND INTO users (name) VALUES (\' Smith\') WHERE id = 1';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);

            const selectResult = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            const rows = selectResult.data as any[];
            expect(rows[0].name).toBe('Alice Smith');
            expect(rows[1].name).toBe('Bob');
        });

        it('should append to STRING column with complex WHERE condition', () => {
            const sql = 'APPEND INTO users (name) VALUES (\' Jr.\') WHERE age >= 25';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(2);

            const selectResult = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            const rows = selectResult.data as any[];
            expect(rows[0].name).toBe('Alice Jr.');
            expect(rows[1].name).toBe('Bob Jr.');
        });

        it('should throw error when appending to NUMBER column', () => {
            expect(() => {
                executor.execute('APPEND INTO users (age) VALUES (\'25\')', [SqlType.DML]);
            }).toThrow(SqlValidationError);
        });

        it('should throw error when appending to primary key column', () => {
            expect(() => {
                executor.execute('APPEND INTO users (id) VALUES (\'100\')', [SqlType.DML]);
            }).toThrow(SqlValidationError);
        });

        it('should append to null values', () => {
            executor.execute('CREATE TABLE messages (id NUMBER, content STRING)', [SqlType.DDL]);
            executor.execute('INSERT INTO messages (id, content) VALUES (1, NULL)', [SqlType.DML]);

            executor.execute('APPEND INTO messages (content) VALUES (\' hello\')', [SqlType.DML]);

            const selectResult = executor.execute('SELECT * FROM messages', [SqlType.DQL]);
            const row = (selectResult.data as any[])[0];
            expect(row.content).toBe(' hello');
        });

        it('should append only when WHERE condition matches', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)', [SqlType.DML]);

            const sql = 'APPEND INTO users (name) VALUES (\' Sr.\') WHERE id = 3';
            const result = executor.execute(sql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);

            const selectResult = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            const rows = selectResult.data as any[];
            expect(rows[0].name).toBe('Alice');
            expect(rows[1].name).toBe('Bob');
            expect(rows[2].name).toBe('Charlie Sr.');
        });
    });
});
