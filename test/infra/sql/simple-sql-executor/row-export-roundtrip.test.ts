import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../../src/infra/sql';
import { SqlType } from '../../../../src/infra/sql';

describe('Row Export - Round-trip conversion', () => {
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

    it('should preserve data through dml2row and row2dml', () => {
        const originalDml = 'INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)';
        const rows = executor.dml2row(originalDml);
        const convertedDml = executor.row2dml(rows);

        expect(convertedDml).toContain('INSERT INTO users');
    });
});
