import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor, SqlType } from '../../../src/infra/sql';
import {MessageParser} from "../../../src/infra/sillytarvern/message-parser";

describe('MessageParser - extractRowFromMessage', () => {
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
