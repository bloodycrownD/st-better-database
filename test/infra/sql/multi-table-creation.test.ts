import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql/impl/core/sql-executor';
import { SqlType } from '../../../src/infra/sql/enums/sql-type';
import { SqlValidationError } from '../../../src/infra/sql/errors/sql-validation-error';

describe('Multi-Table Creation Test', () => {
    let executor: any;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    it('should create multiple tables without overwriting', () => {
        const sql1 = 'CREATE TABLE users (id NUMBER, name STRING) COMMENT "Users table"';
        const sql2 = 'CREATE TABLE products (id NUMBER, product_name STRING, price NUMBER) COMMENT "Products table"';
        const sql3 = 'CREATE TABLE orders (id NUMBER, user_id NUMBER, product_id NUMBER) COMMENT "Orders table"';

        const result1 = executor.execute(sql1, [SqlType.DDL]);
        expect(result1.success).toBe(true);

        const result2 = executor.execute(sql2, [SqlType.DDL]);
        expect(result2.success).toBe(true);

        const result3 = executor.execute(sql3, [SqlType.DDL]);
        expect(result3.success).toBe(true);

        const tables = executor.getTables();
        expect(tables.length).toBe(3);
        expect(tables[0].tableName).toBe('users');
        expect(tables[1].tableName).toBe('products');
        expect(tables[2].tableName).toBe('orders');

        expect(tables[0].comment).toBe('Users table');
        expect(tables[1].comment).toBe('Products table');
        expect(tables[2].comment).toBe('Orders table');

        const idx1 = executor.getTableIdxByName('users');
        const idx2 = executor.getTableIdxByName('products');
        const idx3 = executor.getTableIdxByName('orders');

        expect(idx1).toBe(0);
        expect(idx2).toBe(1);
        expect(idx3).toBe(2);

        const table1 = tables[idx1];
        expect(Object.keys(table1.columnSchemas).length).toBe(2);
 
        const table2 = tables[idx2];
        expect(Object.keys(table2.columnSchemas).length).toBe(3);
 
        const table3 = tables[idx3];
        expect(Object.keys(table3.columnSchemas).length).toBe(3);
    });

    it('should serialize and deserialize multiple tables correctly', () => {
        const sql1 = 'CREATE TABLE users (id NUMBER, name STRING)';
        const sql2 = 'CREATE TABLE products (id NUMBER, product_name STRING, price NUMBER)';

        executor.execute(sql1, [SqlType.DDL]);
        executor.execute(sql2, [SqlType.DDL]);

        const serialized = executor.serialize();

        const newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized);

        const tables = newExecutor.getTables();
        expect(tables.length).toBe(2);
 
        expect(tables[0].tableName).toBe('users');
        expect(Object.keys(tables[0].columnSchemas).length).toBe(2);
 
        expect(tables[1].tableName).toBe('products');
        expect(Object.keys(tables[1].columnSchemas).length).toBe(3);
    });

    it('should prevent duplicate table creation', () => {
        const sql = 'CREATE TABLE users (id NUMBER, name STRING)';
        executor.execute(sql, [SqlType.DDL]);

        expect(() => {
            executor.execute(sql, [SqlType.DDL]);
        }).toThrow(SqlValidationError);
    });

    it('should maintain table indices after serialization roundtrip', () => {
        const sql1 = 'CREATE TABLE users (id NUMBER, name STRING)';
        const sql2 = 'CREATE TABLE products (id NUMBER, product_name STRING)';
        const sql3 = 'CREATE TABLE orders (id NUMBER)';

        executor.execute(sql1, [SqlType.DDL]);
        executor.execute(sql2, [SqlType.DDL]);
        executor.execute(sql3, [SqlType.DDL]);

        const serialized = executor.serialize();

        const newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized);

        const idx1 = newExecutor.getTableIdxByName('users');
        const idx2 = newExecutor.getTableIdxByName('products');
        const idx3 = newExecutor.getTableIdxByName('orders');

        expect(idx1).toBe(0);
        expect(idx2).toBe(1);
        expect(idx3).toBe(2);
    });

    it('should handle table creation with insert data', () => {
        const createSql1 = 'CREATE TABLE users (id NUMBER, name STRING)';
        const createSql2 = 'CREATE TABLE products (id NUMBER, name STRING)';

        executor.execute(createSql1, [SqlType.DDL]);
        executor.execute(createSql2, [SqlType.DDL]);

        executor.execute('INSERT INTO users (id, name) VALUES (1, \'Alice\')', [SqlType.DML]);
        executor.execute('INSERT INTO products (id, name) VALUES (1, \'Product A\')', [SqlType.DML]);

        const users = executor.execute('SELECT * FROM users', [SqlType.DQL]);
        const products = executor.execute('SELECT * FROM products', [SqlType.DQL]);

        expect((users.data as any[]).length).toBe(1);
        expect((products.data as any[]).length).toBe(1);
        const serialized = executor.serialize();

        const newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized);

        const newUsers = newExecutor.execute('SELECT * FROM users', [SqlType.DQL]);
        const newProducts = newExecutor.execute('SELECT * FROM products', [SqlType.DQL]);

        expect((newUsers.data as any[]).length).toBe(1);
        expect((newProducts.data as any[]).length).toBe(1);
    });
});
