import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

beforeAll(() => {
    global.SillyTavern = {
        getContext: () => ({
            chat: [],
            chatMetadata: {},
            extensionSettings: {},
            saveChat: vi.fn(),
            saveMetadata: vi.fn(),
            saveSettingsDebounced: vi.fn()
        })
    } as any;
});

import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType } from '@/infra/sql';

describe('Primary Key and NULL handling', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
    });

    it('should create table with PRIMARY KEY', () => {
        const result = executor.execute('CREATE TABLE story_setting (name STRING PRIMARY KEY, content STRING)', [SqlType.DDL]);

        expect(result.success).toBe(true);
        const tables = executor.getTables();
        expect(tables.length).toBe(1);
        expect(tables[0].tableName).toBe('story_setting');
    });

    it('should convert INSERT with NULL value to row', () => {
        executor.execute('CREATE TABLE story_setting (name STRING PRIMARY KEY, content STRING)', [SqlType.DDL]);

        const rows = executor.dml2row("INSERT INTO story_setting (name, content) VALUES ('xx', NULL)");

        expect(rows.length).toBe(1);
        expect(rows[0].tableIdx).toBe(0);
        expect(rows[0].action).toBe('insert');
        expect(rows[0].after['0']).toBe('xx');
        expect(rows[0].after['1']).toBeNull();
    });

    it('should handle full table creation with COMMENT', () => {
        const sql = 'CREATE TABLE story_setting (name STRING PRIMARY KEY, content STRING) COMMENT "故事设定表"';
        const result = executor.execute(sql, [SqlType.DDL]);

        expect(result.success).toBe(true);
        const tables = executor.getTables();
        expect(tables[0].comment).toBe('故事设定表');
    });
});
