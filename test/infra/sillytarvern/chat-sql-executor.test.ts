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
            const usersTable = tables.find(t => t.tableName === 'users')!;
            expect(Object.keys(usersTable.columnSchemas)).toContain('3');
            expect(usersTable.columnSchemas[3]?.name).toBe('email');
        });

        it('should execute DROP TABLE on tableTemplate', () => {
            const result = executor.execute('DROP TABLE users', [SqlType.DDL]);

            expect(result.success).toBe(true);

            const tables = executor.getTables();
            expect(tables.map(t => t.tableName)).not.toContain('users');
        });

        it('should not modify chat for DDL operations', () => {
            mockChat.push({ id: 0, mes: 'test message', name: 'user', role: 'assistant' });

            executor.execute('CREATE TABLE products (id NUMBER)', [SqlType.DDL]);

            expect(mockChat[0].mes).toBe('test message');
        });
    });

    describe('DML Operations', () => {
        it('should persist INSERT to chat message', () => {
            const result = executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat.length).toBe(1);
            expect(mockChat[0].mes).toContain('<row>');
            expect(mockChat[0].mes).toContain('"action":"insert"');
            expect(mockChat[0].mes).toContain('"tableIdx":0');
            expect(mockChat[0].mes).toContain('"1":"Alice"');
            expect(mockChat[0].mes).toContain('"0":1');
        });

        it('should persist UPDATE to chat message', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const result = executor.execute('UPDATE users SET age = 26 WHERE id = 1', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat[0].mes).toContain('"action":"update"');
        });

        it('should persist DELETE to chat message', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);

            const result = executor.execute('DELETE FROM users WHERE id = 1', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat[0].mes).toContain('"action":"delete"');
        });

        it('should persist APPEND to chat message', () => {
            executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);

            const result = executor.execute('APPEND INTO users (name) VALUES (\' Smith\')', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.data).toBe(1);
            expect(mockChat[0].mes).toContain('"action":"append"');
        });

        it('should append to existing chat message', () => {
            mockChat.push({ id: 0, mes: '<row>[{"tableIdx":0,"action":"insert","after":{"0":1,"1":"Alice","2":25}}]</row>', name: 'user', role: 'assistant' });

            executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);

            expect(mockChat[0].mes).toContain('"after":{"0":1');
            expect(mockChat[0].mes).toContain('"after":{"0":2');
        });
    });

    describe('DQL Operations', () => {
        it('should query data from chat messages', () => {
            mockChat.push({
                id: 0,
                mes: '<row>[{"tableIdx":0,"action":"insert","after":{"0":1,"1":"Alice","2":25}}]</row>',
                name: 'user',
                role: 'assistant'
            });

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(1);
            expect(rows[0].id).toBe(1);
            expect(rows[0].name).toBe('Alice');
            expect(rows[0].age).toBe(25);
        });

        it('should query with WHERE condition', () => {
            mockChat.push({
                id: 0,
                mes: '<row>[{"tableIdx":0,"action":"insert","after":{"0":1,"1":"Alice","2":25}},{"tableIdx":0,"action":"insert","after":{"0":2,"1":"Bob","2":30}}]</row>',
                name: 'user',
                role: 'assistant'
            });

            const result = executor.execute('SELECT * FROM users WHERE age > 25', [SqlType.DQL]);

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(1);
            expect(rows[0].name).toBe('Bob');
        });

        it('should query with ORDER BY', () => {
            mockChat.push({
                id: 0,
                mes: '<row>[{"tableIdx":0,"action":"insert","after":{"0":1,"1":"Alice","2":25}},{"tableIdx":0,"action":"insert","after":{"0":2,"1":"Bob","2":30}}]</row>',
                name: 'user',
                role: 'assistant'
            });

            const result = executor.execute('SELECT * FROM users ORDER BY age DESC', [SqlType.DQL]);

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows[0].name).toBe('Bob');
            expect(rows[1].name).toBe('Alice');
        });

        it('should handle empty chat', () => {
            mockChat = [];

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(0);
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
            expect(mockChat[0].mes).toContain('"action":"insert"');
            expect(mockChat[0].mes).toContain('"1":"Product A"');

            const tables = executor.getTables();
            expect(tables.map(t => t.tableName)).toContain('products');
        });

        it('should handle DML followed by DQL', () => {
            const result = executor.execute(
                'INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25); SELECT * FROM users',
                [SqlType.DML, SqlType.DQL]
            );

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(1);
            expect(rows[0].name).toBe('Alice');
        });

        it('should handle DDL + DML + DQL in sequence', () => {
            const result = executor.execute(
                'CREATE TABLE orders (id NUMBER, total NUMBER); INSERT INTO orders (id, total) VALUES (1, 100); SELECT * FROM orders',
                [SqlType.DDL, SqlType.DML, SqlType.DQL]
            );

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(1);
            expect(rows[0].total).toBe(100);
        });

        it('should buffer multiple DML statements', () => {
            const result = executor.execute(
                'INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25); INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)',
                [SqlType.DML]
            );

            expect(result.success).toBe(true);
            expect(result.data).toBe(2);
            expect(mockChat[0].mes).toContain('"after":{"0":1');
            expect(mockChat[0].mes).toContain('"after":{"0":2');
        });
    });

    describe('Integration Methods', () => {
        it('should clone executor correctly', () => {
            const cloned = executor.clone();

            expect(cloned.getTables()).toEqual(executor.getTables());
        });

        it('should get table index by name', () => {
            const idx = executor.getTableIdxByName('users');
            expect(idx).toBeDefined();
        });

        it('should get table name by index', () => {
            const name = executor.getTableNameByIdx(0);
            expect(name).toBe('users');
        });

        it('should convert DML to rows', () => {
            const rows = executor.dml2row('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)');

            expect(rows.length).toBe(1);
            expect(rows[0].tableIdx).toBe(0);
            expect(rows[0].action).toBe('insert');
        });

        it('should serialize and deserialize correctly', () => {
            executor.execute('ALTER TABLE users ADD COLUMN email STRING', [SqlType.DDL]);

            const serialized = executor.serialize();
            const newExecutor = new ChatSqlExecutor(new SimpleSqlExecutor());
            newExecutor.deserialize(serialized);

            const tables = newExecutor.getTables();
            const usersTable = tables.find(t => t.tableName === 'users')!;
            expect(Object.keys(usersTable.columnSchemas)).toContain('3');
        });
    });

    describe('Error Handling', () => {
        it('should throw error for invalid SQL type', () => {
            expect(() => {
                executor.execute('INVALID SQL', [SqlType.DDL]);
            }).toThrow();
        });

        it('should throw error when SQL type does not match expected', () => {
            expect(() => {
                executor.execute('SELECT * FROM users', [SqlType.DDL]);
            }).toThrow('期望的SQL类型');
        });

        it('should throw error for unrecognized SQL type', () => {
            expect(() => {
                executor.execute('UNKNOWN OPERATION', [SqlType.DML]);
            }).toThrow('无法识别SQL类型');
        });

        it('should return success for empty SQL', () => {
            const result = executor.execute('   ', [SqlType.DML]);

            expect(result.success).toBe(true);
            expect(result.message).toBe('无SQL语句');
        });

        it('should handle malformed row data in chat', () => {
            mockChat.push({
                id: 0,
                mes: '<row>[invalid json]</row>',
                name: 'user',
                role: 'assistant'
            });

            const result = executor.execute('SELECT * FROM users', [SqlType.DQL]);

            expect(result.success).toBe(true);
            const rows = result.data as any[];
            expect(rows.length).toBe(0);
        });
    });

    describe('Data Storage', () => {
        it('should not allow setting data storage', () => {
            expect(() => {
                executor.setDataStorage({} as any);
            }).not.toThrow();
        });

        it('should get data storage with chat data', () => {
            mockChat.push({
                id: 0,
                mes: '<row>[{"tableIdx":0,"action":"insert","after":{"0":1,"1":"Alice","2":25}}]</row>',
                name: 'user',
                role: 'assistant'
            });

            const storage = executor.getDataStorage();
            const data = storage.getTableData(0);

            expect(data.length).toBe(1);
            expect(data[0]['1']).toBe('Alice');
        });
    });

    describe('Export', () => {
        it('should export data from chat messages', () => {
            mockChat.push({
                id: 0,
                mes: '<row>[{"tableIdx":0,"action":"insert","after":{"0":1,"1":"Alice","2":25}}]</row>',
                name: 'user',
                role: 'assistant'
            });

            const exported = executor.export('ROW_JSON' as any);

            expect(exported).toContain('tableIdx');
            expect(exported).toContain('action');
            expect(exported).toContain('insert');
        });
    });
});
