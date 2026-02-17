import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql';
import { SqlType } from '../../../src/infra/sql';

describe('DQL - WHERE AND', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)', [SqlType.DML]);
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    it('should filter with multiple conditions using AND', () => {
        const sql = 'SELECT * FROM users WHERE age > 25 AND age < 35';
        const result = executor.execute(sql, [SqlType.DQL]);

        expect((result.data as any[]).length).toBe(1);
        expect((result.data as any[])[0].get('name')).toBe('Bob');
    });
});
