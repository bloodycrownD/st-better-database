import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SimpleSqlExecutor, SqlType } from '../../../src/infra/sql';
import type {Row} from '../../../src/infra/sql';

import {MessageParser} from "../../../src/infra/sillytarvern/message-parser";

const mockSillyTavernContext = {
    chat: [],
    chatMetadata: {},
    saveMetadata: vi.fn()
};

global.SillyTavern = {
    getContext: vi.fn(() => mockSillyTavernContext)
};

function createRowData(obj: Record<number, any>): Map<number, any> {
    return new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));
}

describe('ChatDataManager', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    describe('extractRowFromMessage', () => {
        it('should extract row array from message text', () => {
            const messageText = 'Hello <row>[{"action": "insert", "tableIdx": 0, "after": {"0": "张三"}}]</row> world';

            const result = MessageParser.extractRowFromMessage(messageText);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(Object);
        });

        it('should extract multiple row arrays', () => {
            const messageText = '<row>[{"action": "insert", "tableIdx": 0, "after": {}}]</row> <row>[{"action": "update", "tableIdx": 0, "after": {}}]</row>';

            const result = MessageParser.extractRowFromMessage(messageText);

            expect(result).toHaveLength(2);
        });

        it('should return empty array for empty message', () => {
            const result = MessageParser.extractRowFromMessage('');
            expect(result).toHaveLength(0);
        });

        it('should return empty array when no row tags found', () => {
            const result = MessageParser.extractRowFromMessage('No tags here');
            expect(result).toHaveLength(0);
        });

        it('should handle empty row tags', () => {
            const result = MessageParser.extractRowFromMessage('<row></row>');
            expect(result).toHaveLength(0);
        });

        it('should handle row tag with multiple items in array', () => {
            const messageText = '<row>[{"action": "insert", "tableIdx": 0, "after": {}}, {"action": "insert", "tableIdx": 1, "after": {}}]</row>';

            const result = MessageParser.extractRowFromMessage(messageText);

            expect(result).toHaveLength(2);
        });
    });

    describe('extractCommitFromMessage', () => {
        it('should extract commit statements from message text', () => {
            const messageText = 'Hello <commit>INSERT INTO users (name) VALUES ("Alice")</commit> world';

            const result = MessageParser.extractCommitFromMessage(messageText);

            expect(result).toHaveLength(1);
            expect(result[0]).toContain('INSERT INTO users');
        });

        it('should extract multiple commit statements separated by semicolon', () => {
            const messageText = '<commit>INSERT INTO users (name) VALUES ("Alice");UPDATE users SET age = 25</commit>';

            const result = MessageParser.extractCommitFromMessage(messageText);

            expect(result).toHaveLength(2);
        });

        it('should return empty array for empty message', () => {
            const result = MessageParser.extractCommitFromMessage('');
            expect(result).toHaveLength(0);
        });
    });

    describe('processCommitToRow', () => {
        it('should convert commit to row array and replace in message', () => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);

            const messageText = 'Data <commit>INSERT INTO users (id, name) VALUES (1, "Alice")</commit> end';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toContain('<row>');
            expect(result).not.toContain('<commit>');
            const rowMatch = result.match(/<row>(.*?)<\/row>/s);
            expect(rowMatch).toBeTruthy();
            const rowContent = rowMatch![1];
            expect(rowContent.startsWith('[')).toBe(true);
            expect(rowContent.endsWith(']')).toBe(true);
        });

        it('should return original message if row already exists', () => {
            const messageText = 'Hello <row>[{"action": "insert"}]</row> <commit>INSERT INTO users</commit>';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toBe(messageText);
        });

        it('should return original message if no commit tag found', () => {
            const messageText = 'Hello world';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toBe(messageText);
        });

        it('should merge multiple commit statements into single array', () => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);

            const messageText = '<commit>INSERT INTO users (id, name) VALUES (1, "Alice");INSERT INTO users (id, name) VALUES (2, "Bob")</commit>';

            const result = MessageParser.processCommitToRow(messageText, executor);

            const rowMatch = result.match(/<row>(.*?)<\/row>/s);
            expect(rowMatch).toBeTruthy();
            const rowContent = rowMatch![1];
            const parsed = JSON.parse(rowContent);
            expect(parsed).toHaveLength(2);
        });
    });

    describe('storage integration', () => {
        it('should process row statements and execute them', () => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);

            const rows: Row[] = [
                { action: 'insert', tableIdx: 0, after: createRowData({ 0: 1, 1: 'Alice' }) }
            ];

            const dml = executor.row2dml(rows);
            const result = executor.execute(dml, [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
        });

        it('should handle multiple row operations', () => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);

            const rows: Row[] = [
                { action: 'insert', tableIdx: 0, after: createRowData({ 0: 1, 1: 'Alice', 2: 25 }) },
                { action: 'insert', tableIdx: 0, after: createRowData({ 0: 2, 1: 'Bob', 2: 30 }) }
            ];

            const dml = executor.row2dml(rows);
            const dmlStatements = dml.split(';').filter(s => s.trim());
            let totalAffected = 0;
            
            for (const stmt of dmlStatements) {
                const result = executor.execute(stmt, [SqlType.DML]);
                expect(result.success).toBe(true);
                totalAffected += result.data as number;
            }

            expect(totalAffected).toBe(2);
        });

        it('should handle update operations', () => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
            executor.execute('INSERT INTO users (id, name) VALUES (1, "Alice")', [SqlType.DML]);

            const rows: Row[] = [
                {
                    action: 'update',
                    tableIdx: 0,
                    before: createRowData({ 0: 1 }),
                    after: createRowData({ 1: 'Alice Updated' })
                }
            ];

            const dml = executor.row2dml(rows);
            const result = executor.execute(dml, [SqlType.DML]);

            expect(result.success).toBe(true);
        });

        it('should handle delete operations', () => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
            executor.execute('INSERT INTO users (id, name) VALUES (1, "Alice")', [SqlType.DML]);

            const rows: Row[] = [
                {
                    action: 'delete',
                    tableIdx: 0,
                    before: createRowData({ 0: 1 })
                }
            ];

            const dml = executor.row2dml(rows);
            const result = executor.execute(dml, [SqlType.DML]);

            expect(result.success).toBe(true);

            const selectResult = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            expect(selectResult.data).toEqual([]);
        });

        it('should handle append operations', () => {
            executor.execute('CREATE TABLE users (id NUMBER, name STRING)', [SqlType.DDL]);
            executor.execute('INSERT INTO users (id, name) VALUES (1, "Alice")', [SqlType.DML]);

            const rows: Row[] = [
                {
                    action: 'append',
                    tableIdx: 0,
                    after: createRowData({ 1: ' Bob' })
                }
            ];

            const dml = executor.row2dml(rows);
            const result = executor.execute(dml, [SqlType.DML]);

            expect(result.success).toBe(true);

            const selectResult = executor.execute('SELECT * FROM users', [SqlType.DQL]);
            const row = (selectResult.data as any[])[0];
            expect(row.get('name')).toBe('Alice Bob');
        });
    });
});
