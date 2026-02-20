import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType, ExportFormat } from '@/infra/sql';

describe('Row Export - STANDARD_DATA format', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    it('should export single table as standard data format', () => {
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);

        const exported = executor.export(ExportFormat.STANDARD_DATA);

        expect(() => JSON.parse(exported)).not.toThrow();

        const parsed = JSON.parse(exported);
        expect(parsed.users).toBeDefined();
        expect(parsed.users).toHaveLength(2);
        expect(parsed.users[0]).toEqual({ id: 1, name: 'Alice', age: 25 });
        expect(parsed.users[1]).toEqual({ id: 2, name: 'Bob', age: 30 });
    });

    it('should export single table by name', () => {
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('CREATE TABLE posts (id NUMBER, title STRING)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
        executor.execute('INSERT INTO posts (id, title) VALUES (1, \'Post 1\')', [SqlType.DML]);

        const exported = executor.export(ExportFormat.STANDARD_DATA, 'users');

        expect(() => JSON.parse(exported)).not.toThrow();

        const parsed = JSON.parse(exported);
        expect(parsed.users).toBeDefined();
        expect(parsed.users).toHaveLength(1);
        expect(parsed.posts).toBeUndefined();
    });

    it('should export multiple tables as single valid JSON', () => {
        executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
        executor.execute('CREATE TABLE posts (id NUMBER, title STRING)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name) VALUES (1, \'Alice\')', [SqlType.DML]);
        executor.execute('INSERT INTO posts (id, title) VALUES (1, \'Post 1\')', [SqlType.DML]);

        const exported = executor.export(ExportFormat.STANDARD_DATA);

        expect(() => JSON.parse(exported)).not.toThrow();

        const parsed = JSON.parse(exported);
        expect(parsed.users).toBeDefined();
        expect(parsed.users).toHaveLength(1);
        expect(parsed.posts).toBeDefined();
        expect(parsed.posts).toHaveLength(1);
        expect(parsed.users[0]).toEqual({ id: 1, name: 'Alice' });
        expect(parsed.posts[0]).toEqual({ id: 1, title: 'Post 1' });
    });

    it('should handle NULL values', () => {
        executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id) VALUES (1)', [SqlType.DML]);

        const exported = executor.export(ExportFormat.STANDARD_DATA);
        const parsed = JSON.parse(exported);

        expect(parsed.users[0].name).toBeNull();
    });

    it('should handle empty tables', () => {
        executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);

        const exported = executor.export(ExportFormat.STANDARD_DATA);
        const parsed = JSON.parse(exported);

        expect(parsed.users).toEqual([]);
    });
});
