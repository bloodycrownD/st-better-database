import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType, ExportFormat } from '@/infra/sql';

describe('Row Export - Single table export', () => {
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

    it('should export specific table', () => {
        executor.execute('CREATE TABLE items (id NUMBER, name STRING)', [SqlType.DDL]);
        executor.execute('INSERT INTO items (id, name) VALUES (1, \'Item1\')', [SqlType.DML]);

        const exported = executor.export(ExportFormat.INSERT_SQL, 'users');

        expect(exported).toContain('users');
        expect(exported).not.toContain('items');
    });
});
