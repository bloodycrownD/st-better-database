import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql';
import { SqlType, ExportFormat } from '../../../src/infra/sql';

describe('Row Export - TABLE_SCHEMA format', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    it('should export table schema as JSON', () => {
        const exported = executor.export(ExportFormat.TABLE_SCHEMA);
        const schema = JSON.parse(exported);

        expect(schema.tableName).toBe('users');
        expect(schema.id2fieldName).toBeDefined();
        expect(schema.fieldName2id).toBeDefined();
        expect(schema.columnSchemas).toBeDefined();
    });
});
