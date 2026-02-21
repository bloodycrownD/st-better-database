import { describe, it, expect } from 'vitest';
import { SimpleSqlExecutor, SqlType, ActionType } from '@/infra/sql';

describe('Batch INSERT dml2row', () => {
    it('should convert batch INSERT to multiple Row objects', () => {
        const executor = new SimpleSqlExecutor();
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);

        const dml = 'INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25), (2, \'Bob\', 30), (3, \'Charlie\', 35)';
        const rows = executor.dml2row(dml);

        // 每个批量INSERT应该生成3个Row对象
        expect(rows).toHaveLength(3);

        expect(rows[0].action).toBe(ActionType.INSERT);
        expect(rows[0].after).toEqual({0: 1, 1: 'Alice', 2: 25});

        expect(rows[1].action).toBe(ActionType.INSERT);
        expect(rows[1].after).toEqual({0: 2, 1: 'Bob', 2: 30});

        expect(rows[2].action).toBe(ActionType.INSERT);
        expect(rows[2].after).toEqual({0: 3, 1: 'Charlie', 2: 35});
    });
});
