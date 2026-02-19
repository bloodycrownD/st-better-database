import { describe, it, expect } from 'vitest';
import { SimpleSqlExecutor, SqlType, SqlValidationError } from '../../../src/infra/sql';

describe('ALTER TABLE RENAME COLUMN Integration', () => {
    it('should successfully rename a column', () => {
        const executor = new SimpleSqlExecutor();

        const createTableSql = 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER)';
        executor.execute(createTableSql, [SqlType.DDL]);

        const insertSql = 'INSERT INTO users (id, name, age) VALUES (1, "Alice", 25)';
        executor.execute(insertSql, [SqlType.DML]);

        const renameSql = 'ALTER TABLE users RENAME COLUMN name TO username';
        const result = executor.execute(renameSql, [SqlType.DDL]);

        expect(result.success).toBe(true);
        expect(result.message).toContain("name' renamed to 'username'");
        expect(result.data).toBe(0);

        const querySql = 'SELECT id, username, age FROM users';
        const queryResult = executor.execute(querySql, [SqlType.DQL]);
 
        expect(queryResult.success).toBe(true);
        expect((queryResult.data as any)).toHaveLength(1);
        expect((queryResult.data as any)[0].username).toBe('Alice');
    });

    it('should fail when column does not exist', () => {
        const executor = new SimpleSqlExecutor();

        const createTableSql = 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER)';
        executor.execute(createTableSql, [SqlType.DDL]);

        const renameSql = 'ALTER TABLE users RENAME COLUMN non_existent TO new_name';

        expect(() => {
            executor.execute(renameSql, [SqlType.DDL]);
        }).toThrow(SqlValidationError);
        expect(() => {
            executor.execute(renameSql, [SqlType.DDL]);
        }).toThrow("Column 'non_existent' does not exist");
    });

    it('should fail when new column name already exists', () => {
        const executor = new SimpleSqlExecutor();

        const createTableSql = 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER)';
        executor.execute(createTableSql, [SqlType.DDL]);

        const renameSql = 'ALTER TABLE users RENAME COLUMN name TO age';

        expect(() => {
            executor.execute(renameSql, [SqlType.DDL]);
        }).toThrow(SqlValidationError);
        expect(() => {
            executor.execute(renameSql, [SqlType.DDL]);
        }).toThrow("Column 'age' already exists");
    });

    it('should fail when table does not exist', () => {
        const executor = new SimpleSqlExecutor();

        const renameSql = 'ALTER TABLE non_existent_table RENAME COLUMN name TO username';

        expect(() => {
            executor.execute(renameSql, [SqlType.DDL]);
        }).toThrow(SqlValidationError);
        expect(() => {
            executor.execute(renameSql, [SqlType.DDL]);
        }).toThrow("Table 'non_existent_table' does not exist");
    });

    it('should preserve column schema after rename', () => {
        const executor = new SimpleSqlExecutor();

        const createTableSql = 'CREATE TABLE users (id NUMBER PRIMARY KEY, name STRING COMMENT "User name", age NUMBER)';
        executor.execute(createTableSql, [SqlType.DDL]);

        const renameSql = 'ALTER TABLE users RENAME COLUMN name TO username';
        executor.execute(renameSql, [SqlType.DDL]);

        const tableIdx = executor.getTableIdxByName('users');
        expect(tableIdx).toBeDefined();
    });

    it('should update both id2fieldName and fieldName2id mappings', () => {
        const executor = new SimpleSqlExecutor();

        const createTableSql = 'CREATE TABLE users (id NUMBER, name STRING, age NUMBER)';
        executor.execute(createTableSql, [SqlType.DDL]);

        let tableIdx = executor.getTableIdxByName('users');
        expect(tableIdx).toBeDefined();

        const renameSql = 'ALTER TABLE users RENAME COLUMN name TO username';
        const result = executor.execute(renameSql, [SqlType.DDL]);

        expect(result.success).toBe(true);

        tableIdx = executor.getTableIdxByName('users');
        expect(tableIdx).toBeDefined();
    });
});
