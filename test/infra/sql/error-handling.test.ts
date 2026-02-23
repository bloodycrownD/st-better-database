import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType } from '@/infra/sql';
import { CompactSqlConverter } from '@/infra/sql/impl/utils/compact-sql-converter';

describe('SQL Error Handling', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        const result = executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        if (!result.success) {
            throw new Error(`Failed to create table: ${result.message}`);
        }
    });

    describe('CompactSqlConverter.validateSql', () => {
        it('should detect unclosed single quotes', () => {
            const sql = "INSERT INTO users (id, name, age) VALUES (1, 'John, 25)";
            const errors = CompactSqlConverter.validateSql(sql);
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should detect unclosed parentheses', () => {
            const sql = "INSERT INTO users (id, name, age) VALUES (1, 'John', 25";
            const errors = CompactSqlConverter.validateSql(sql);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors.some(e => e.includes('括号'))).toBe(true);
        });

        it('should not report errors for valid SQL', () => {
            const sql = "INSERT INTO users (id, name, age) VALUES (1, 'John', 25)";
            const errors = CompactSqlConverter.validateSql(sql);
            expect(errors.length).toBe(0);
        });

        it('should handle multiple statements', () => {
            const sql = "INSERT INTO users (id, name, age) VALUES (1, 'John', 25); INSERT INTO users (id, name, age) VALUES (2, 'Jane', 30)";
            const errors = CompactSqlConverter.validateSql(sql);
            expect(errors.length).toBe(0);
        });

        it('should detect parser syntax errors', () => {
            const sql = "INSERT INTO users (id, name, age) VALUES (1, 'John', 25";
            const errors = CompactSqlConverter.validateSql(sql);
            expect(errors.length).toBeGreaterThan(0);
        });
    });

    describe('Multi-statement with errors', () => {
        it('should handle mix of valid and invalid statements', () => {
            const validSql = "INSERT INTO users (id, name, age) VALUES (1, 'John', 25)";
            const invalidSql = "INSERT INTO users (id, name, age) VALUES (2, 'Jane', 30";

            const validErrors = CompactSqlConverter.validateSql(validSql);
            const invalidErrors = CompactSqlConverter.validateSql(invalidSql);

            expect(validErrors.length).toBe(0);
            expect(invalidErrors.length).toBeGreaterThan(0);
        });
    });

    describe('Error recovery', () => {
        it('should continue processing after syntax error', () => {
            const validSql = "INSERT INTO users (id, name, age) VALUES (1, 'John', 25)";
            executor.execute(validSql, [SqlType.DML]);

            const selectResult = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            const rows = selectResult.data as any[];
            expect(rows.length).toBe(1);
            expect(rows[0].name).toBe('John');
        });
    });
});
