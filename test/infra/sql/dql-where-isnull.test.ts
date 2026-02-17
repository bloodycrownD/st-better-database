import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql';
import { SqlType } from '../../../src/infra/sql';

describe('DQL - WHERE IS NULL', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    it('should filter with IS NULL', () => {
        executor.execute('CREATE TABLE items (id NUMBER, name STRING)', [SqlType.DDL]);
        executor.execute('INSERT INTO items (id, name) VALUES (1, NULL)', [SqlType.DML]);
        executor.execute('INSERT INTO items (id, name) VALUES (2, \'Test\')', [SqlType.DML]);

        const sql = 'SELECT * FROM items WHERE name IS NULL';
        const result = executor.execute(sql, [SqlType.DQL]);

        expect((result.data as any[]).length).toBe(1);
    });
});
