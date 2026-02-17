import { describe, it, expect } from 'vitest';
import { Parser, StatementType } from '../../../../src/infra/sql/parser';

describe('Parser - UPDATE Statement', () => {
    it('should parse UPDATE with WHERE clause', () => {
        const sql = 'UPDATE users SET age = 26 WHERE id = 1';
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.UPDATE);
    });

    it('should parse UPDATE without WHERE clause', () => {
        const sql = 'UPDATE users SET name = "Updated"';
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.UPDATE);
    });

    it('should parse UPDATE with multiple columns', () => {
        const sql = 'UPDATE users SET name = "Charlie", age = 35 WHERE id = 1';
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.UPDATE);
    });
});

describe('Parser - DELETE Statement', () => {
    it('should parse DELETE with WHERE clause', () => {
        const sql = 'DELETE FROM users WHERE id = 1';
        const result = Parser.parse(sql);

        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.DELETE);
    });

    it('should parse DELETE without WHERE clause', () => {
        const sql = 'DELETE FROM users';
        const result = Parser.parse(sql);

        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.DELETE);
    });
});
