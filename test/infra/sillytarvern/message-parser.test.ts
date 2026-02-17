import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor, SqlType } from '../../../src/infra/sql';

import {MessageParser} from "../../../src/infra/sillytarvern/message-parser";

describe('MessageParser', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('CREATE TABLE inventory (id NUMBER, item STRING, count NUMBER)', [SqlType.DDL]);
    });

    afterEach(() => {
        executor = null as any;
        if (global.gc) global.gc();
    });

    describe('extractRowFromMessage', () => {
        it('should extract single row array', () => {
            const messageText = 'Hello <row>[{"action": "insert", "tableIdx": 0, "after": {"0": 1, "1": "Alice", "2": 25}}]</row> world';

            const result = MessageParser.extractRowFromMessage(messageText);

            expect(result).toHaveLength(1);
            expect(result[0]).toBeInstanceOf(Object);
            expect(result[0].action).toBe('insert');
        });

        it('should extract multiple row arrays from separate tags', () => {
            const messageText = '<row>[{"action": "insert", "tableIdx": 0, "after": {"0": 1}}]</row> <row>[{"action": "update", "tableIdx": 1, "after": {"1": 10}}]</row>';

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

        it('should handle row tags with only whitespace', () => {
            const result = MessageParser.extractRowFromMessage('<row>   </row>');
            expect(result).toHaveLength(0);
        });

        it('should handle multiple row tags in same message', () => {
            const messageText = 'First <row>[{"action": "insert", "tableIdx": 0, "after": {"0": 1}}]</row> second <row>[{"action": "insert", "tableIdx": 0, "after": {"0": 2}}]</row>';

            const result = MessageParser.extractRowFromMessage(messageText);

            expect(result).toHaveLength(2);
        });

        it('should handle row array with multiple items', () => {
            const messageText = '<row>[{"action": "insert", "tableIdx": 0, "after": {}}, {"action": "insert", "tableIdx": 1, "after": {}}]</row>';

            const result = MessageParser.extractRowFromMessage(messageText);

            expect(result).toHaveLength(2);
        });
    });

    describe('extractCommitFromMessage', () => {
        it('should extract single commit statement', () => {
            const messageText = 'Hello <commit>INSERT INTO users (id, name) VALUES (1, "Alice")</commit> world';

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

        it('should return empty array when no commit tags found', () => {
            const result = MessageParser.extractCommitFromMessage('No tags here');
            expect(result).toHaveLength(0);
        });

        it('should handle empty commit tags', () => {
            const result = MessageParser.extractCommitFromMessage('<commit></commit>');
            expect(result).toHaveLength(0);
        });
    });

    describe('processCommitToRow', () => {
        it('should convert INSERT commit to row array and replace in message', () => {
            const messageText = 'Data <commit>INSERT INTO users (id, name, age) VALUES (1, "Alice", 25)</commit> end';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toContain('<row>');
            expect(result).not.toContain('<commit>');
            const rowMatch = result.match(/<row>(.*?)<\/row>/s);
            expect(rowMatch).toBeTruthy();
            const rowContent = rowMatch![1];
            expect(rowContent.startsWith('[')).toBe(true);
            expect(rowContent.endsWith(']')).toBe(true);
        });

        it('should convert UPDATE commit to row array', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, "Alice", 25)', [SqlType.DML]);

            const messageText = 'Update <commit>UPDATE users SET age = 26 WHERE id = 1</commit> done';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toContain('<row>');
            const rowMatch = result.match(/<row>(.*?)<\/row>/s);
            expect(rowMatch).toBeTruthy();
            expect(rowMatch![1]).toContain('"action": "update"');
        });

        it('should convert DELETE commit to row array', () => {
            executor.execute('INSERT INTO users (id, name) VALUES (1, "Alice")', [SqlType.DML]);

            const messageText = 'Delete <commit>DELETE FROM users WHERE id = 1</commit> done';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toContain('<row>');
            const rowMatch = result.match(/<row>(.*?)<\/row>/s);
            expect(rowMatch).toBeTruthy();
            expect(rowMatch![1]).toContain('"action": "delete"');
        });

        it('should convert APPEND commit to row array', () => {
            executor.execute('INSERT INTO users (id, name) VALUES (1, "Alice")', [SqlType.DML]);

            const messageText = 'Append <commit>APPEND INTO users (name) VALUES (" Bob")</commit> done';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toContain('<row>');
            const rowMatch = result.match(/<row>(.*?)<\/row>/s);
            expect(rowMatch).toBeTruthy();
            expect(rowMatch![1]).toContain('"action": "append"');
        });

        it('should return original message if row already exists', () => {
            const messageText = 'Hello <row>[{"action": "insert", "tableIdx": 0}]</row> <commit>INSERT INTO users</commit>';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toBe(messageText);
        });

        it('should return original message if no commit tag found', () => {
            const messageText = 'Hello world';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toBe(messageText);
        });

        it('should append converted rows to existing rows', () => {
            const existingRow = '[{"action": "insert", "tableIdx": 0, "after": {"0": 1, "1": "Alice"}}]';
            const messageText = `Hello <row>${existingRow}</row> <commit>INSERT INTO users (id, name) VALUES (2, "Bob")</commit> end`;

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toContain('<row>');
            expect(result).not.toContain('<commit>');
            const rowMatch = result.match(/<row>(.*?)<\/row>/s);
            expect(rowMatch).toBeTruthy();
            const rowContent = rowMatch![1];
            const parsed = JSON.parse(rowContent);
            expect(parsed).toHaveLength(2);
        });

        it('should handle multiple commit statements in single tag', () => {
            const messageText = '<commit>INSERT INTO users (id, name) VALUES (1, "Alice");INSERT INTO users (id, name) VALUES (2, "Bob")</commit>';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toContain('<row>');
            expect(result).not.toContain('<commit>');
            const rowMatch = result.match(/<row>(.*?)<\/row>/s);
            expect(rowMatch).toBeTruthy();
            const rowContent = rowMatch![1];
            const parsed = JSON.parse(rowContent);
            expect(parsed).toHaveLength(2);
        });

        it('should handle invalid SQL gracefully', () => {
            const messageText = '<commit>INVALID SQL</commit>';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toContain('<commit>');
        });

        it('should handle empty commit content', () => {
            const messageText = '<commit></commit>';

            const result = MessageParser.processCommitToRow(messageText, executor);

            expect(result).toBe(messageText);
        });
    });
});
