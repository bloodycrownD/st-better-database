import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType } from '@/infra/sql';

describe('APPEND WHERE Conversion', () => {
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

    describe('dml2row - WHERE preservation', () => {
        it('should preserve WHERE condition in row.before for APPEND with simple WHERE', () => {
            const appendSql = "APPEND INTO users (name) VALUES (' Smith') WHERE id = 1";
            const rows = executor.dml2row(appendSql);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe('append');
            expect(rows[0].before).toBeDefined();
            expect(rows[0].after).toBeDefined();
        });

        it('should convert APPEND without WHERE to row with undefined before', () => {
            const appendSql = "APPEND INTO users (name) VALUES (' Jr.')";
            const rows = executor.dml2row(appendSql);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe('append');
            expect(rows[0].before).toBeUndefined();
            expect(rows[0].after).toBeDefined();
        });
    });

    describe('row2dml - WHERE reconstruction', () => {
        it('should reconstruct APPEND SQL with WHERE condition from row.before', () => {
            const appendSql = "APPEND INTO users (name) VALUES (' Smith') WHERE id = 1";
            const rows = executor.dml2row(appendSql);
            const convertedSql = executor.row2dml(rows);

            expect(convertedSql).toContain('APPEND INTO users');
            expect(convertedSql).toContain("(' Smith')");
            expect(convertedSql).toContain('WHERE id = 1');
        });

        it('should reconstruct APPEND SQL without WHERE when row.before is undefined', () => {
            const appendSql = "APPEND INTO users (name) VALUES (' Jr.')";
            const rows = executor.dml2row(appendSql);
            const convertedSql = executor.row2dml(rows);

            expect(convertedSql).toContain('APPEND INTO users');
            expect(convertedSql).toContain("(' Jr.')");
            expect(convertedSql).not.toContain('WHERE');
        });
    });

    describe('Round-trip conversion', () => {
        it('should preserve APPEND behavior through dml2row -> row2dml -> execute', () => {
            const appendSql = "APPEND INTO users (name) VALUES (' Smith') WHERE id = 1";
            
            const rows = executor.dml2row(appendSql);
            const convertedSql = executor.row2dml(rows);
            const result = executor.execute(convertedSql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);

            const selectResult = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            const dataRows = selectResult.data as any[];
            expect(dataRows[0].name).toBe('Alice Smith');
            expect(dataRows[1].name).toBe('Bob');
            expect(dataRows[2].name).toBe('Charlie');
        });

        it('should preserve APPEND without WHERE through round-trip', () => {
            const appendSql = "APPEND INTO users (name) VALUES (' Jr.')";
            
            const rows = executor.dml2row(appendSql);
            const convertedSql = executor.row2dml(rows);
            const result = executor.execute(convertedSql, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(3);

            const selectResult = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            const dataRows = selectResult.data as any[];
            expect(dataRows[0].name).toBe('Alice Jr.');
            expect(dataRows[1].name).toBe('Bob Jr.');
            expect(dataRows[2].name).toBe('Charlie Jr.');
        });

        it('should handle multiple APPEND operations with different WHERE conditions', () => {
            const appendSql1 = "APPEND INTO users (name) VALUES (' Smith') WHERE id = 1";
            const appendSql2 = "APPEND INTO users (name) VALUES (' Jr.') WHERE id = 2";
            const appendSql3 = "APPEND INTO users (name) VALUES (' Sr.') WHERE id = 3";

            const rows1 = executor.dml2row(appendSql1);
            const rows2 = executor.dml2row(appendSql2);
            const rows3 = executor.dml2row(appendSql3);

            const allRows = [...rows1, ...rows2, ...rows3];
            const convertedSql = executor.row2dml(allRows);

            const result = executor.execute(convertedSql, [SqlType.DML]);

            expect(result.success).toBe(true);

            const selectResult = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            const dataRows = selectResult.data as any[];
            expect(dataRows[0].name).toBe('Alice Smith');
            expect(dataRows[1].name).toBe('Bob Jr.');
            expect(dataRows[2].name).toBe('Charlie Sr.');
        });
    });

    describe('Mixed DML operations', () => {
        it('should handle INSERT, UPDATE, DELETE, and APPEND in round-trip', () => {
            const mixedSql = `
                INSERT INTO users (id, name, age) VALUES (4, 'David', 40);
                UPDATE users SET age = 26 WHERE id = 1;
                DELETE FROM users WHERE id = 2;
                APPEND INTO users (name) VALUES (' III') WHERE id = 3;
            `;

            const dmlRows = executor.dml2row(mixedSql);
            executor.row2dml(dmlRows);

            const insertResult = executor.execute('INSERT INTO users (id, name, age) VALUES (4, \'David\', 40)', [SqlType.DML]);
            expect(insertResult.success).toBe(true);

            const updateResult = executor.execute('UPDATE users SET age = 26 WHERE id = 1', [SqlType.DML]);
            expect(updateResult.success).toBe(true);
            expect(updateResult.data).toBe(1);

            const deleteResult = executor.execute('DELETE FROM users WHERE id = 2', [SqlType.DML]);
            expect(deleteResult.success).toBe(true);
            expect(deleteResult.data).toBe(1);

            const appendResult = executor.execute('APPEND INTO users (name) VALUES (\' III\') WHERE id = 3', [SqlType.DML]);
            expect(appendResult.success).toBe(true);
            expect(appendResult.data).toBe(1);

            const selectResult = executor.execute('SELECT * FROM users ORDER BY id', [SqlType.DQL]);
            const dataRows = selectResult.data as any[];
            expect(dataRows.length).toBe(3);
            expect(dataRows[0]).toEqual({ id: 1, name: 'Alice', age: 26 });
            expect(dataRows[1]).toEqual({ id: 3, name: 'Charlie III', age: 35 });
            expect(dataRows[2]).toEqual({ id: 4, name: 'David', age: 40 });
        });
    });
});
