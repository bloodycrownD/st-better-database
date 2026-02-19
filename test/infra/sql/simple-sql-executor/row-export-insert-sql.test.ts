import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../../src/infra/sql';
import { SqlType, ExportFormat } from '../../../../src/infra/sql';

describe('Row Export - INSERT_SQL format', () => {
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

    it('should export as INSERT SQL statements', () => {
        const exported = executor.export(ExportFormat.INSERT_SQL);

        expect(exported).toContain('INSERT INTO users');
        expect(exported).toContain('VALUES');
        expect(exported).toContain("(1, 'Alice', 25)");
        expect(exported).toContain("(2, 'Bob', 30)");
    });

    it('should escape single quotes in strings', () => {
        executor.execute('INSERT INTO users (id, name, age) VALUES (3, \'O\'\'Neil\', 40)', [SqlType.DML]);
        const exported = executor.export(ExportFormat.INSERT_SQL);

        expect(exported).toContain("O''Neil");
    });

    it('should handle NULL values', () => {
        executor.execute('INSERT INTO users (id, name) VALUES (3, \'David\')', [SqlType.DML]);
        const exported = executor.export(ExportFormat.INSERT_SQL);

        expect(exported).toContain('NULL');
    });
});
