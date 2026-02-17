import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimpleSqlExecutor, SqlType } from '../../../src/infra/sql';
import {ChatMessageUtil} from "../../../src/infra/sillytarvern/chat-message-util";

describe('MessageParser - extractCommitFromMessage', () => {
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

    it('should extract single commit statement', () => {
        const messageText = 'Hello <commit>INSERT INTO users (id, name) VALUES (1, "Alice")</commit> world';

        const result = ChatMessageUtil.extractCommit(messageText);

        expect(result).toHaveLength(1);
        expect(result[0]).toContain('INSERT INTO users');
    });

    it('should extract multiple commit statements separated by semicolon', () => {
        const messageText = '<commit>INSERT INTO users (name) VALUES ("Alice");UPDATE users SET age = 25</commit>';

        const result = ChatMessageUtil.extractCommit(messageText);

        expect(result).toHaveLength(2);
    });

    it('should return empty array for empty message', () => {
        const result = ChatMessageUtil.extractCommit('');
        expect(result).toHaveLength(0);
    });

    it('should return empty array when no commit tags found', () => {
        const result = ChatMessageUtil.extractCommit('No tags here');
        expect(result).toHaveLength(0);
    });

    it('should handle empty commit tags', () => {
        const result = ChatMessageUtil.extractCommit('<commit></commit>');
        expect(result).toHaveLength(0);
    });
});
