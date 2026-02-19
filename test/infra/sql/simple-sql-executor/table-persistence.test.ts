import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../../src/infra/sql/impl/core/sql-executor';
import { SqlType } from '../../../../src/infra/sql/enums/sql-type';

describe('Table Persistence Test', () => {
    let executor: any;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    it('should maintain tables after multiple serialize/deserialize cycles', () => {
        executor.execute('CREATE TABLE table1 (id NUMBER, name STRING) COMMENT "First table"', [SqlType.DDL]);
        executor.execute('CREATE TABLE table2 (id NUMBER, value NUMBER) COMMENT "Second table"', [SqlType.DDL]);

        let tables = executor.getTables();
        expect(tables.length).toBe(2);

        let serialized = executor.serialize();

        let newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized);

        tables = newExecutor.getTables();
        expect(tables.length).toBe(2);

        newExecutor.execute('CREATE TABLE table3 (id NUMBER, description STRING) COMMENT "Third table"', [SqlType.DDL]);

        tables = newExecutor.getTables();
        expect(tables.length).toBe(3);

        serialized = newExecutor.serialize();

        newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized);

        tables = newExecutor.getTables();
        expect(tables.length).toBe(3);
        expect(tables[0].tableName).toBe('table1');
        expect(tables[1].tableName).toBe('table2');
        expect(tables[2].tableName).toBe('table3');
        expect(tables[0].comment).toBe('First table');
        expect(tables[1].comment).toBe('Second table');
        expect(tables[2].comment).toBe('Third table');
    });

    it('should correctly deserialize after multiple table creations', () => {
        executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);

        const serialized1 = executor.serialize();

        let newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized1);

        newExecutor.execute('CREATE TABLE products (id NUMBER, name STRING, price NUMBER)', [SqlType.DDL]);

        const serialized2 = newExecutor.serialize();

        newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized2);

        const tables = newExecutor.getTables();
        expect(tables.length).toBe(2);
        expect(tables[0].tableName).toBe('users');
        expect(tables[1].tableName).toBe('products');
    });

    it('should handle table index counter correctly after deserialization', () => {
        executor.execute('CREATE TABLE table1 (id NUMBER)', [SqlType.DDL]);
        executor.execute('CREATE TABLE table2 (id NUMBER)', [SqlType.DDL]);
        executor.execute('CREATE TABLE table3 (id NUMBER)', [SqlType.DDL]);

        const serialized = executor.serialize();

        const newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized);

        const idx1 = newExecutor.getTableIdxByName('table1');
        const idx2 = newExecutor.getTableIdxByName('table2');
        const idx3 = newExecutor.getTableIdxByName('table3');

        expect(idx1).toBe(0);
        expect(idx2).toBe(1);
        expect(idx3).toBe(2);

        newExecutor.execute('CREATE TABLE table4 (id NUMBER)', [SqlType.DDL]);

        const idx4 = newExecutor.getTableIdxByName('table4');
        expect(idx4).toBe(3);
    });

    it('should correctly deserialize empty state and add tables', () => {
        const serialized = executor.serialize();

        let newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized);

        let tables = newExecutor.getTables();
        expect(tables.length).toBe(0);

        newExecutor.execute('CREATE TABLE table1 (id NUMBER)', [SqlType.DDL]);
        newExecutor.execute('CREATE TABLE table2 (id NUMBER)', [SqlType.DDL]);

        tables = newExecutor.getTables();
        expect(tables.length).toBe(2);

        const serialized2 = newExecutor.serialize();
        newExecutor = new SimpleSqlExecutor();
        newExecutor.deserialize(serialized2);

        tables = newExecutor.getTables();
        expect(tables.length).toBe(2);
    });
});
