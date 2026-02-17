import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql';
import { SqlType, ActionType } from '../../../src/infra/sql';

describe('Row Export - dml2row INSERT', () => {
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

    it('should convert INSERT to Row format', () => {
        const dml = 'INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)';
        const rowJson = executor.dml2row(dml);
        const rows = JSON.parse(rowJson);

        expect(rows).toHaveLength(1);
        expect(rows[0].action).toBe(ActionType.INSERT);
        expect(rows[0].tableIdx).toBeDefined();
        expect(rows[0].after).toBeDefined();
    });
});
