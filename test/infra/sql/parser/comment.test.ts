import { describe, it, expect } from 'vitest';
import { Parser, StatementType } from '../../../../src/infra/sql';

describe('Parser - SQL Comments (--)', () => {
    it('should parse INSERT with comment before statement', () => {
        const sql = `-- 注释
INSERT INTO users (id, name) VALUES (1, 'Alice')`;
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.INSERT);
    });

    it('should parse multiple statements with comments between them', () => {
        const sql = `INSERT INTO users (id, name) VALUES (1, 'Alice');
-- 这是一个注释
INSERT INTO users (id, name) VALUES (2, 'Bob')`;
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(2);
        expect(result.statements[0].type).toBe(StatementType.INSERT);
        expect(result.statements[1].type).toBe(StatementType.INSERT);
    });

    it('should parse comment at end of line', () => {
        const sql = `INSERT INTO users (id, name) VALUES (1, 'Alice') -- end of line comment`;
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.INSERT);
    });

    it('should parse CREATE TABLE with comment', () => {
        const sql = `-- Create users table
CREATE TABLE users (id NUMBER, name STRING)`;
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.CREATE_TABLE);
    });

    it('should handle multiple consecutive comments', () => {
        const sql = `-- Comment 1
-- Comment 2
INSERT INTO users (id, name) VALUES (1, 'Alice')`;
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.INSERT);
    });
});
