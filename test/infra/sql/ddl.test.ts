import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql';
import { SqlType, SqlValidationError } from '../../../src/infra/sql';

describe('DDL Operations', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    describe('CREATE TABLE', () => {
        it('should create a table with valid schema', () => {
            const sql = 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER)';
            const result = executor.execute(sql, [SqlType.DDL]);

            expect(result.success).toBe(true);
            expect(result.message).toContain("Table 'users' created successfully");
            expect(result.type).toBe(SqlType.DDL);

            const tableIdx = executor.getTableIdxByName('users');
            expect(tableIdx).toBeDefined();
        });

        it('should throw error when creating duplicate table', () => {
            const sql = 'CREATE TABLE users (id NUMBER, name STRING)';
            executor.execute(sql, [SqlType.DDL]);

            expect(() => {
                executor.execute(sql, [SqlType.DDL]);
            }).toThrow(SqlValidationError);
        });

        it('should assign sequential table IDs', () => {
            executor.execute('CREATE TABLE table1 (id NUMBER)', [SqlType.DDL]);
            executor.execute('CREATE TABLE table2 (name STRING)', [SqlType.DDL]);

            const idx1 = executor.getTableIdxByName('table1');
            const idx2 = executor.getTableIdxByName('table2');

            expect(idx1).toBe(0);
            expect(idx2).toBe(1);
        });
    });

    describe('ALTER TABLE - ADD COLUMN', () => {
        beforeEach(() => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
        });

        it('should add a new column', () => {
            const sql = 'ALTER TABLE users ADD COLUMN age NUMBER';
            const result = executor.execute(sql, [SqlType.DDL]);

            expect(result.success).toBe(true);
            expect(result.message).toContain("Column 'age' added to table 'users'");
        });

        it('should throw error when adding duplicate column', () => {
            expect(() => {
                executor.execute('ALTER TABLE users ADD COLUMN name STRING', [SqlType.DDL]);
            }).toThrow(SqlValidationError);
        });

        it('should preserve existing data', () => {
            executor.execute('INSERT INTO users (id, name) VALUES (1, \'Alice\')', [SqlType.DML]);
            executor.execute('ALTER TABLE users ADD COLUMN age NUMBER', [SqlType.DDL]);

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(1);
        });
    });

    describe('ALTER TABLE - DROP COLUMN', () => {
        beforeEach(() => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        });

        it('should drop an existing column', () => {
            const sql = 'ALTER TABLE users DROP COLUMN age';
            const result = executor.execute(sql, [SqlType.DDL]);

            expect(result.success).toBe(true);
            expect(result.message).toContain("Column 'age' dropped from table 'users'");
        });

        it('should throw error when dropping non-existent column', () => {
            expect(() => {
                executor.execute('ALTER TABLE users DROP COLUMN nonexist', [SqlType.DDL]);
            }).toThrow(SqlValidationError);
        });
    });

    describe('ALTER TABLE - RENAME', () => {
        beforeEach(() => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
        });

        it('should rename a table', () => {
            const sql = 'ALTER TABLE users RENAME TO accounts';
            const result = executor.execute(sql, [SqlType.DDL]);

            expect(result.success).toBe(true);
            expect(result.message).toContain("Table renamed from 'users' to 'accounts'");

            expect(executor.getTableIdxByName('users')).toBeUndefined();
            expect(executor.getTableIdxByName('accounts')).toBeDefined();
        });

        it('should throw error when renaming to existing table name', () => {
            executor.execute('CREATE TABLE accounts (id NUMBER)', [SqlType.DDL]);

            expect(() => {
                executor.execute('ALTER TABLE users RENAME TO accounts', [SqlType.DDL]);
            }).toThrow(SqlValidationError);
        });
    });

    describe('DROP TABLE', () => {
        beforeEach(() => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
            executor.execute('INSERT INTO users (id, name) VALUES (1, \'Alice\')', [SqlType.DML]);
        });

        it('should drop an existing table', () => {
            const sql = 'DROP TABLE users';
            const result = executor.execute(sql, [SqlType.DDL]);

            expect(result.success).toBe(true);
            expect(result.message).toContain("Table 'users' dropped");

            expect(executor.getTableIdxByName('users')).toBeUndefined();
        });

        it('should throw error when dropping non-existent table', () => {
            expect(() => {
                executor.execute('DROP TABLE nonexist', [SqlType.DDL]);
            }).toThrow(SqlValidationError);
        });

        it('should clear table data', () => {
            executor.execute('DROP TABLE users', [SqlType.DDL]);
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect((result.data as any[]).length).toBe(0);
        });
    });
});
