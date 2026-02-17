import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleSqlExecutor } from '../../../src/infra/sql';
import { SqlType, ActionType,ExportFormat } from '../../../src/infra/sql';

describe('Row Conversion and Export', () => {
    let executor: SimpleSqlExecutor;

    beforeEach(() => {
        executor = new SimpleSqlExecutor();
        executor.execute('CREATE TABLE users (id NUMBER, name STRING, age NUMBER)', [SqlType.DDL]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (1, \'Alice\', 25)', [SqlType.DML]);
        executor.execute('INSERT INTO users (id, name, age) VALUES (2, \'Bob\', 30)', [SqlType.DML]);
    });

    describe('dml2row', () => {
        it('should convert INSERT to Row format', () => {
            const dml = 'INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)';
            const rowJson = executor.dml2row(dml);
            const rows = JSON.parse(rowJson);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe(ActionType.INSERT);
            expect(rows[0].tableIdx).toBeDefined();
            expect(rows[0].after).toBeDefined();
        });

        it('should convert UPDATE to Row format', () => {
            const dml = 'UPDATE users SET age = 26 WHERE id = 1';
            const rowJson = executor.dml2row(dml);
            const rows = JSON.parse(rowJson);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe(ActionType.UPDATE);
            expect(rows[0].before).toBeDefined();
            expect(rows[0].after).toBeDefined();
        });

        it('should convert DELETE to Row format', () => {
            const dml = 'DELETE FROM users WHERE id = 1';
            const rowJson = executor.dml2row(dml);
            const rows = JSON.parse(rowJson);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe(ActionType.DELETE);
            expect(rows[0].before).toBeDefined();
        });

        it('should convert APPEND to Row format', () => {
            executor.execute('CREATE TABLE messages (id NUMBER, content STRING)', [SqlType.DDL]);
            const dml = 'APPEND INTO messages (content) VALUES (\' hello\')';
            const rowJson = executor.dml2row(dml);
            const rows = JSON.parse(rowJson);

            expect(rows).toHaveLength(1);
            expect(rows[0].action).toBe(ActionType.APPEND);
            expect(rows[0].after).toBeDefined();
        });

        it('should convert multiple statements', () => {
            const dml = 'INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35);UPDATE users SET age = 31 WHERE id = 2';
            const rowJson = executor.dml2row(dml);
            const rows = JSON.parse(rowJson);

            expect(rows).toHaveLength(2);
            expect(rows[0].action).toBe(ActionType.INSERT);
            expect(rows[1].action).toBe(ActionType.UPDATE);
        });
    });

    describe('row2dml', () => {
        it('should convert Row format to INSERT statement', () => {
            const rows = JSON.stringify([{
                action: ActionType.INSERT,
                tableIdx: 0,
                after: { 0: 3, 1: "Charlie", 2: 35 }
            }]);
            const dml = executor.row2dml(rows);

            expect(dml).toContain('INSERT INTO users');
            expect(dml).toContain('VALUES');
        });

        it('should convert Row format to UPDATE statement', () => {
            const rows = JSON.stringify([{
                action: ActionType.UPDATE,
                tableIdx: 0,
                before: { 0: 1 },
                after: { 2: 26 }
            }]);
            const dml = executor.row2dml(rows);

            expect(dml).toContain('UPDATE users SET');
            expect(dml).toContain('WHERE');
        });

        it('should convert Row format to DELETE statement', () => {
            const rows = JSON.stringify([{
                action: ActionType.DELETE,
                tableIdx: 0,
                before: { 0: 1 }
            }]);
            const dml = executor.row2dml(rows);

            expect(dml).toContain('DELETE FROM users');
        });

        it('should convert Row format to APPEND statement', () => {
            const rows = JSON.stringify([{
                action: ActionType.APPEND,
                tableIdx: 0,
                after: { 1: " hello" }
            }]);
            const dml = executor.row2dml(rows);

            expect(dml).toContain('APPEND INTO users');
        });

        it('should convert multiple Row entries', () => {
            const rows = JSON.stringify([
                {
                    action: ActionType.INSERT,
                    tableIdx: 0,
                    after: { 0: 3, 1: "Charlie", 2: 35 }
                },
                {
                    action: ActionType.UPDATE,
                    tableIdx: 0,
                    before: { 0: 1 },
                    after: { 2: 26 }
                }
            ]);
            const dml = executor.row2dml(rows);

            expect(dml).toContain('INSERT INTO users');
            expect(dml).toContain('UPDATE users SET');
        });
    });

    describe('export', () => {
        describe('INSERT_SQL format', () => {
            it('should export as INSERT SQL statements', () => {
                const exported = executor.export(ExportFormat.INSERT_SQL);

                expect(exported).toContain('INSERT INTO users');
                expect(exported).toContain('VALUES');
                expect(exported).toContain("('Alice'");
                expect(exported).toContain("('Bob'");
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

        describe('ROW_JSON format', () => {
            it('should export as Row JSON format', () => {
                const exported = executor.export(ExportFormat.ROW_JSON);
                const rows = JSON.parse(exported);

                expect(Array.isArray(rows)).toBe(true);
                expect(rows.length).toBe(2);
                expect(rows[0].action).toBe(ActionType.INSERT);
            });

            it('should include tableIdx in exported rows', () => {
                const exported = executor.export(ExportFormat.ROW_JSON);
                const rows = JSON.parse(exported);

                rows.forEach((row: any) => {
                    expect(row.tableIdx).toBeDefined();
                    expect(typeof row.tableIdx).toBe('number');
                });
            });
        });

        describe('TABLE_SCHEMA format', () => {
            it('should export table schema as JSON', () => {
                const exported = executor.export(ExportFormat.TABLE_SCHEMA);
                const schema = JSON.parse(exported);

                expect(schema.tableName).toBe('users');
                expect(schema.id2fieldName).toBeDefined();
                expect(schema.fieldName2id).toBeDefined();
                expect(schema.columnSchemas).toBeDefined();
            });
        });

        describe('Single table export', () => {
            it('should export specific table', () => {
                executor.execute('CREATE TABLE items (id NUMBER, name STRING)', [SqlType.DDL]);
                executor.execute('INSERT INTO items (id, name) VALUES (1, \'Item1\')', [SqlType.DML]);

                const exported = executor.export(ExportFormat.INSERT_SQL, 'users');

                expect(exported).toContain('users');
                expect(exported).not.toContain('items');
            });
        });
    });

    describe('Round-trip conversion', () => {
        it('should preserve data through dml2row and row2dml', () => {
            const originalDml = 'INSERT INTO users (id, name, age) VALUES (3, \'Charlie\', 35)';
            const rowJson = executor.dml2row(originalDml);
            const convertedDml = executor.row2dml(rowJson);

            expect(convertedDml).toContain('INSERT INTO users');
        });
    });
});
