import { describe, it, expect } from 'vitest';
import { Parser, StatementType } from '../../../../src/infra/sql';

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

describe('Parser - CREATE TABLE with Comments', () => {
    it('should parse CREATE TABLE with table comment', () => {
        const sql = 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER) COMMENT "User information table"';
        const result = Parser.parse(sql);

        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.CREATE_TABLE);
        
        const stmt = result.statements[0] as any;
        expect(stmt.tableName).toBe('users');
        expect(stmt.comment).toBe('User information table');
        expect(stmt.columns.length).toBe(3);
    });

    it('should parse CREATE TABLE with column comments', () => {
        const sql = 'CREATE TABLE users (id NUMBER COMMENT "Primary key", name STRING COMMENT "User name", age NUMBER COMMENT "User age")';
        const result = Parser.parse(sql);

        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.CREATE_TABLE);
        
        const stmt = result.statements[0] as any;
        expect(stmt.tableName).toBe('users');
        expect(stmt.columns.length).toBe(3);
        expect(stmt.columns[0].comment).toBe('Primary key');
        expect(stmt.columns[1].comment).toBe('User name');
        expect(stmt.columns[2].comment).toBe('User age');
    });

    it('should parse CREATE TABLE with both table and column comments', () => {
        const sql = 'CREATE TABLE users (id NUMBER COMMENT "Primary key", name STRING COMMENT "User name", age NUMBER COMMENT "User age") COMMENT "User information table"';
        const result = Parser.parse(sql);

        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.CREATE_TABLE);
        
        const stmt = result.statements[0] as any;
        expect(stmt.tableName).toBe('users');
        expect(stmt.comment).toBe('User information table');
        expect(stmt.columns.length).toBe(3);
        expect(stmt.columns[0].comment).toBe('Primary key');
        expect(stmt.columns[1].comment).toBe('User name');
        expect(stmt.columns[2].comment).toBe('User age');
    });

    it('should parse CREATE TABLE without comments', () => {
        const sql = 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER)';
        const result = Parser.parse(sql);

        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.CREATE_TABLE);
        
        const stmt = result.statements[0] as any;
        expect(stmt.tableName).toBe('users');
        expect(stmt.comment).toBeUndefined();
        expect(stmt.columns.length).toBe(3);
        expect(stmt.columns[0].comment).toBeUndefined();
        expect(stmt.columns[1].comment).toBeUndefined();
        expect(stmt.columns[2].comment).toBeUndefined();
    });

    it('should parse ALTER TABLE MODIFY COLUMN COMMENT', () => {
        const sql = 'ALTER TABLE users MODIFY COLUMN name STRING COMMENT "Updated comment"';
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.ALTER_TABLE);
        
        const stmt = result.statements[0] as any;
        expect(stmt.tableName).toBe('users');
        expect(stmt.opType).toBe('MODIFY_COLUMN_COMMENT');
        expect(stmt.columnName).toBe('name');
        expect(stmt.comment).toBe('Updated comment');
    });

    it('should parse ALTER TABLE COMMENT', () => {
        const sql = 'ALTER TABLE users COMMENT "Updated table comment"';
        const result = Parser.parse(sql);

        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.ALTER_TABLE);
        
        const stmt = result.statements[0] as any;
        expect(stmt.tableName).toBe('users');
        expect(stmt.opType).toBe('ALTER_TABLE_COMMENT');
        expect(stmt.comment).toBe('Updated table comment');
    });

    it('should parse ALTER TABLE MODIFY COLUMN COMMENT with PRIMARY KEY', () => {
        const sql = 'ALTER TABLE users MODIFY COLUMN id NUMBER PRIMARY KEY COMMENT "Updated primary key"';
        const result = Parser.parse(sql);

        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.ALTER_TABLE);
        
        const stmt = result.statements[0] as any;
        expect(stmt.tableName).toBe('users');
        expect(stmt.opType).toBe('MODIFY_COLUMN_COMMENT');
        expect(stmt.columnName).toBe('id');
        expect(stmt.comment).toBe('Updated primary key');
    });

    it('should parse ALTER TABLE RENAME COLUMN', () => {
        const sql = 'ALTER TABLE users RENAME COLUMN name TO username';
        const result = Parser.parse(sql);

        if (result.errors.length > 0) {
            console.log('Parse errors:', result.errors);
        }
        expect(result.errors.length).toBe(0);
        expect(result.statements.length).toBe(1);
        expect(result.statements[0].type).toBe(StatementType.ALTER_TABLE);
        
        const stmt = result.statements[0] as any;
        expect(stmt.tableName).toBe('users');
        expect(stmt.opType).toBe('RENAME_COLUMN');
        expect(stmt.columnName).toBe('name');
        expect(stmt.newColumnName).toBe('username');
    });
});

