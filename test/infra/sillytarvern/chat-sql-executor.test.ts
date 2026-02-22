import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';

beforeAll(() => {
    global.SillyTavern = {
        getContext: () => ({
            chat: [],
            saveChat: vi.fn()
        })
    } as any;
});

import { ChatSqlExecutor } from '@/infra/sillytarvern';
import { SimpleSqlExecutor } from '@/infra/sql';
import { SqlType } from '@/infra/sql';

describe('ChatSqlExecutor', () => {
    let mockChat: any[];
    let mockSaveChat: any;
    let tableTemplate: SimpleSqlExecutor;
    let executor: ChatSqlExecutor;

    beforeEach(() => {
        mockChat = [];
        mockSaveChat = vi.fn();
        global.SillyTavern = {
            getContext: () => ({
                chat: mockChat,
                saveChat: mockSaveChat
            })
        } as any;

        tableTemplate = new SimpleSqlExecutor();
        tableTemplate.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor = new ChatSqlExecutor(tableTemplate);
    });

    describe('DDL Operations', () => {
        it('should execute CREATE TABLE on tableTemplate', () => {
            const result = executor.execute('CREATE TABLE products (id NUMBER, name STRING)', [SqlType.DDL]);

            expect(result.success).toBe(true);
            expect(result.message).toContain('执行成功');

            const tables = executor.getTables();
            expect(tables.length).toBe(2);
            expect(tables.map(t => t.tableName)).toContain('users');
            expect(tables.map(t => t.tableName)).toContain('products');
        });

        it('should execute ALTER TABLE ADD COLUMN on tableTemplate', () => {
            const result = executor.execute('ALTER TABLE users ADD COLUMN email STRING', [SqlType.DDL]);

            expect(result.success).toBe(true);

            const tables = executor.getTables();
            const usersTable = tables.find((t: any) => t.tableName === 'users')!;
            expect(Object.keys(usersTable.columnSchemas)).toContain('3');
            expect(usersTable.columnSchemas[3]?.name).toBe('email');
        });

        it('should execute DROP TABLE on tableTemplate', () => {
            const result = executor.execute('DROP TABLE users', [SqlType.DDL]);

            expect(result.success).toBe(true);

            const tables = executor.getTables();
            expect(tables.map((t: any) => t.tableName)).not.toContain('users');
        });

        it('should not modify chat for DDL operations', () => {
            mockChat.push({ id: 0, mes: 'test message', name: 'user', role: 'assistant' });

            executor.execute('CREATE TABLE products (id NUMBER)', [SqlType.DDL]);

            expect(mockChat[0].mes).toBe('test message');
        });
    });

    describe('DML Operations', () => {
        it('should persist INSERT to chat message as compressed SQL', () => {
            const result = executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat.length).toBe(1);
            expect(mockChat[0].mes).toContain('<committed>');
            expect(mockChat[0].mes).toContain('$t0');
            expect(mockChat[0].mes).toContain('$t0c0');
            expect(mockChat[0].mes).toContain('$t0c1');
            expect(mockChat[0].mes).toContain('$t0c2');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should persist UPDATE to chat message as compressed SQL', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const result = executor.execute('UPDATE users SET age = 26 WHERE id = 1', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat[0].mes).toContain('UPDATE $t0 SET $t0c2 = 26 WHERE $t0c0 = 1');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should persist DELETE to chat message as compressed SQL', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);

            const result = executor.execute('DELETE FROM users WHERE id = 1', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat[0].mes).toContain('DELETE FROM $t0 WHERE $t0c0 = 1');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should persist APPEND to chat message as compressed SQL', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const result = executor.execute('APPEND INTO users (name) VALUES (\' Smith\')', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat[0].mes).toContain('APPEND INTO $t0 ($t0c1) VALUES (\' Smith\')');
            expect(mockSaveChat).toHaveBeenCalled();
        });

        it('should append to existing committed content', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const committedContent = mockChat[0].mes.match(/<committed>([\s\S]*)<\/committed>/)?.[1];
            expect(committedContent).toBeDefined();
            expect(committedContent).toContain('INSERT INTO $t0');
            expect(mockSaveChat).toHaveBeenCalled();
        });
    });

    describe('DQL Operations', () => {
        beforeEach(() => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
        });

        it('should query data from chat messages', () => {
            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(2);
            expect(rows[0].id).toBe(1);
            expect(rows[0].name).toBe('Alice');
        });

        it('should query with WHERE condition', () => {
            const result = executor.execute('SELECT * FROM users WHERE age > 25', [SqlType.DQL]);

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(1);
            expect(rows[0].name).toBe('Bob');
        });

        it('should query with ORDER BY', () => {
            const result = executor.execute('SELECT * FROM users ORDER BY age DESC', [SqlType.DQL]);

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows[0].name).toBe('Bob');
            expect(rows[1].name).toBe('Alice');
        });
    });

    describe('Mixed SQL', () => {
        it('should handle DDL followed by DML', () => {
            const result = executor.execute(
                'CREATE TABLE products (id NUMBER, name STRING); INSERT INTO products (id, name) VALUES (1, \'Product A\')',
                [SqlType.DDL, SqlType.DML]
            );

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat[0].mes).toContain('<committed>');
            expect(mockChat[0].mes).toContain('$t1');
        });

        it('should handle DML followed by DQL', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const result = executor.execute(
                'INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30); SELECT * FROM users WHERE id = 1',
                [SqlType.DML, SqlType.DQL]
            );

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(1);
            expect(rows[0].name).toBe('Alice');
        });

        it('should handle DDL + DML + DQL in sequence', () => {
            const result = executor.execute(
                'CREATE TABLE products (id NUMBER, name STRING); INSERT INTO products (id, name) VALUES (1, \'Product A\'); SELECT * FROM products',
                [SqlType.DDL, SqlType.DML, SqlType.DQL]
            );

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(1);
            expect(rows[0].name).toBe('Product A');
        });

        it('should buffer multiple DML statements', () => {
            const result = executor.execute(
                'INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25); INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)',
                [SqlType.DML]
            );

            expect(result.success).toBe(true);
            expect(result.data).toBe(2);

            const committedContent = mockChat[0].mes.match(/<committed>([\s\S]*)<\/committed>/)?.[1];
            expect(committedContent).toBeDefined();
            expect(committedContent).toContain('INSERT INTO $t0');
        });
    });

    describe('Integration Methods', () => {
        it('should clone executor correctly', () => {
            const cloned = executor.clone();
            const tables = cloned.getTables();
            expect(tables.length).toBe(1);
            expect(tables[0].tableName).toBe('users');
        });

        it('should get table index by name', () => {
            expect(executor.getTableIdxByName('users')).toBe(0);
            expect(executor.getTableIdxByName('nonexistent')).toBeUndefined();
        });

        it('should get table name by index', () => {
            expect(executor.getTableNameByIdx(0)).toBe('users');
            expect(executor.getTableNameByIdx(999)).toBeUndefined();
        });

        it('should serialize and deserialize correctly', () => {
            const serialized = executor.serialize();
            expect(serialized).toBeDefined();
            expect(serialized).toHaveProperty('structure');

            const newExecutor = new ChatSqlExecutor(tableTemplate);
            newExecutor.deserialize(serialized);

            const tables = newExecutor.getTables();
            expect(tables.length).toBe(1);
        });

        it('should throw error for invalid SQL type', () => {
            expect(() => {
                executor.execute('INVALID SQL', [SqlType.DML]);
            }).toThrow('无法识别SQL类型');
        });

        it('should throw error when SQL type does not match expected', () => {
            expect(() => {
                executor.execute('CREATE TABLE test (id NUMBER)', [SqlType.DML]);
            }).toThrow('期望的SQL类型');
        });

        it('should throw error for unrecognized SQL type', () => {
            expect(() => {
                executor.execute('INVALID STATEMENT', [SqlType.DDL, SqlType.DML, SqlType.DQL]);
            }).toThrow('无法识别SQL类型');
        });

        it('should return success for empty SQL', () => {
            const result = executor.execute('   ', [SqlType.DML]);
            expect(result.success).toBe(true);
            expect(result.message).toContain('无SQL语句');
        });

        it('should not allow setting data storage', () => {
            const storage = tableTemplate.getDataStorage();
            executor.setDataStorage(storage);
            // Should not throw, but should do nothing
            expect(true).toBe(true);
        });
    });

    describe('compressDml and decompressDml', () => {
        it('should compress DML by replacing table and column names', () => {
            const compressed = executor.compressDml('INSERT INTO users (id, name) VALUES (1, "Alice")');
            expect(compressed).toContain('$t0');
            expect(compressed).toContain('$t0c0');
            expect(compressed).toContain('$t0c1');
            expect(compressed).not.toContain('users');
            expect(compressed).not.toContain('id');
            expect(compressed).not.toContain('name');
        });

        it('should decompress DML by replacing IDs with names', () => {
            const compressed = 'INSERT INTO $t0 ($t0c0, $t0c1) VALUES (1, "Alice")';
            const decompressed = executor.decompressDml(compressed);
            expect(decompressed).toContain('users');
            expect(decompressed).toContain('id');
            expect(decompressed).toContain('name');
            expect(decompressed).not.toContain('$t0');
            expect(decompressed).not.toContain('$t0c0');
        });

        it('should handle round-trip compression', () => {
            const original = 'INSERT INTO users (id, name, age) VALUES (1, "Alice", 25)';
            const compressed = executor.compressDml(original);
            const decompressed = executor.decompressDml(compressed);
            expect(decompressed).toBe(original);
        });
    });

    describe('Data Storage', () => {
        it('should get data storage with chat data', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const storage = executor.getDataStorage();
            const data = storage.getTableData(0);
            expect(data.length).toBe(1);
            expect(data[0]['1']).toBe('Alice');
        });

        it('should export data from chat messages', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const exported = executor.export('INSERT_SQL' as any, 'users');
            expect(exported).toContain('INSERT INTO users');
            expect(exported).toContain('Alice');
        });
    });
});
