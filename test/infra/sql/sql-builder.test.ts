import { describe, it, expect } from 'vitest';
import { SQLBuilder, Where } from '../../../src/infra/sql/sql-builder';
import type { SqlValue } from '../../../src/infra/sql/types/core';

describe('Where', () => {
    it('should build simple condition', () => {
        const where = Where.of().eq('age', 25);
        expect(where.build()).toBe('age = 25');
    });

    it('should build AND condition', () => {
        const where = Where.of().eq('age', 25).and(Where.of().gt('id', 0));
        expect(where.build()).toBe('(age = 25 AND id > 0)');
    });

    it('should build OR condition', () => {
        const where = Where.of().eq('age', 25).or(Where.of().gt('age', 30));
        expect(where.build()).toBe('(age = 25 OR age > 30)');
    });

    it('should build complex nested conditions', () => {
        const where = Where.of()
            .eq('age', 25)
            .or(Where.of().gt('age', 30).and(Where.of().isNull('name')));
        expect(where.build()).toBe('(age = 25 OR (age > 30 AND name IS NULL))');
    });

    it('should build deeply nested conditions', () => {
        const where = Where.of()
            .eq('id', 1)
            .and(
                Where.of()
                    .or(Where.of().eq('age', 25))
                    .or(Where.of().ge('age', 30))
            );
        expect(where.build()).toBe('(id = 1 AND (age = 25 OR age >= 30))');
    });

    it('should build empty condition', () => {
        const where = Where.of();
        expect(where.build()).toBe('');
    });

    it('should build IN condition', () => {
        const where = Where.of().in('id', [1, 2, 3]);
        expect(where.build()).toBe('id IN (1, 2, 3)');
    });

    it('should build BETWEEN condition', () => {
        const where = Where.of().between('age', 18, 65);
        expect(where.build()).toBe('age BETWEEN 18 AND 65');
    });

    it('should build IS NULL condition', () => {
        const where = Where.of().isNull('name');
        expect(where.build()).toBe('name IS NULL');
    });
});

describe('SQLBuilder', () => {
    describe('SELECT', () => {
        it('should build basic SELECT query', () => {
            const sql = SQLBuilder.select()
                .from('users')
                .build();
            expect(sql).toBe('SELECT * FROM users');
        });

        it('should build SELECT with columns', () => {
            const sql = SQLBuilder.select()
                .from('users')
                .select('name', 'age')
                .build();
            expect(sql).toBe('SELECT name, age FROM users');
        });

        it('should build SELECT with WHERE condition', () => {
            const sql = SQLBuilder.select()
                .from('users')
                .where(Where.of().eq('age', 25))
                .build();
            expect(sql).toBe('SELECT * FROM users WHERE age = 25');
        });

        it('should build SELECT with ORDER BY', () => {
            const sql = SQLBuilder.select()
                .from('users')
                .orderBy('age', false)
                .build();
            expect(sql).toBe('SELECT * FROM users ORDER BY age DESC');
        });

        it('should build SELECT with multiple conditions', () => {
            const sql = SQLBuilder.select()
                .from('users')
                .where(Where.of().eq('age', 25).and(Where.of().gt('id', 0)))
                .build();
            expect(sql).toBe('SELECT * FROM users WHERE (age = 25 AND id > 0)');
        });

        it('should build SELECT with complex nested WHERE', () => {
            const sql = SQLBuilder.select()
                .from('users')
                .where(
                    Where.of()
                        .eq('age', 25)
                        .or(Where.of().gt('age', 30).and(Where.of().isNull('name')))
                )
                .build();
            expect(sql).toBe('SELECT * FROM users WHERE (age = 25 OR (age > 30 AND name IS NULL))');
        });
    });

    describe('INSERT', () => {
        it('should build basic INSERT query', () => {
            const data = new Map<string, SqlValue>([['name', 'Alice'], ['age', 25]]);
            const sql = SQLBuilder.insert()
                .into('users')
                .setValues(data)
                .build();
            expect(sql).toBe('INSERT INTO users (name, age) VALUES ("Alice", 25)');
        });

        it('should build INSERT with multiple rows', () => {
            const data: Map<string, SqlValue>[] = [
                new Map<string, SqlValue>([['name', 'Alice'], ['age', 25]]),
                new Map<string, SqlValue>([['name', 'Bob'], ['age', 30]])
            ];
            const sql = SQLBuilder.insert()
                .into('users')
                .batch(data)
                .build();
            expect(sql).toBe('INSERT INTO users (name, age) VALUES ("Alice", 25), ("Bob", 30)');
        });

        it('should build INSERT with null values', () => {
            const data = new Map<string, SqlValue>([['name', null], ['age', 25]]);
            const sql = SQLBuilder.insert()
                .into('users')
                .setValues(data)
                .build();
            expect(sql).toBe('INSERT INTO users (name, age) VALUES (NULL, 25)');
        });
    });

    describe('UPDATE', () => {
        it('should build basic UPDATE query', () => {
            const sql = SQLBuilder.update()
                .table('users')
                .set('age', 26)
                .where(Where.of().eq('id', 1))
                .build();
            expect(sql).toBe('UPDATE users SET age = 26 WHERE id = 1');
        });

        it('should build UPDATE with multiple SET clauses', () => {
            const data = new Map<string, SqlValue>([['name', 'Charlie'], ['age', 35]]);
            const sql = SQLBuilder.update()
                .table('users')
                .setValues(data)
                .where(Where.of().eq('id', 1))
                .build();
            expect(sql).toBe('UPDATE users SET name = "Charlie", age = 35 WHERE id = 1');
        });

        it('should build UPDATE without WHERE', () => {
            const sql = SQLBuilder.update()
                .table('users')
                .set('age', 0)
                .build();
            expect(sql).toBe('UPDATE users SET age = 0');
        });

        it('should build UPDATE with complex WHERE', () => {
            const sql = SQLBuilder.update()
                .table('users')
                .set('age', 0)
                .where(Where.of().eq('age', 25).or(Where.of().gt('age', 30)))
                .build();
            expect(sql).toBe('UPDATE users SET age = 0 WHERE (age = 25 OR age > 30)');
        });
    });

    describe('DELETE', () => {
        it('should build basic DELETE query', () => {
            const sql = SQLBuilder.delete()
                .from('users')
                .where(Where.of().eq('id', 1))
                .build();
            expect(sql).toBe('DELETE FROM users WHERE id = 1');
        });

        it('should build DELETE without WHERE', () => {
            const sql = SQLBuilder.delete()
                .from('users')
                .build();
            expect(sql).toBe('DELETE FROM users');
        });

        it('should build DELETE with multiple conditions', () => {
            const sql = SQLBuilder.delete()
                .from('users')
                .where(Where.of().eq('age', 25).and(Where.of().gt('id', 0)))
                .build();
            expect(sql).toBe('DELETE FROM users WHERE (age = 25 AND id > 0)');
        });
    });

    describe('APPEND', () => {
        it('should build basic APPEND query', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' Smith')
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" Smith")');
        });

        it('should build APPEND with WHERE condition', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' Smith')
                .where(Where.of().eq('id', 1))
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" Smith") WHERE id = 1');
        });

        it('should build APPEND with multiple WHERE conditions', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' Jr.')
                .where(Where.of().ge('age', 25).and(Where.of().lt('age', 30)))
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" Jr.") WHERE (age >= 25 AND age < 30)');
        });

        it('should build APPEND with complex nested WHERE', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' Sr.')
                .where(
                    Where.of()
                        .gt('age', 30)
                        .or(Where.of().isNull('name'))
                )
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" Sr.") WHERE (age > 30 OR name IS NULL)');
        });

        it('should build APPEND without WHERE', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' hello')
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" hello")');
        });

        it('should build APPEND with IN condition', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' Jr.')
                .where(Where.of().in('id', [1, 2, 3]))
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" Jr.") WHERE id IN (1, 2, 3)');
        });

        it('should build APPEND with BETWEEN condition', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' Jr.')
                .where(Where.of().between('age', 25, 30))
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" Jr.") WHERE age BETWEEN 25 AND 30');
        });

        it('should build APPEND with IS NULL condition', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' default')
                .where(Where.of().isNull('name'))
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" default") WHERE name IS NULL');
        });

        it('should build APPEND with IS NOT NULL condition', () => {
            const sql = SQLBuilder.append()
                .into('users')
                .column('name')
                .value(' suffix')
                .where(Where.of().isNotNull('name'))
                .build();
            expect(sql).toBe('APPEND INTO users (name) VALUES (" suffix") WHERE name IS NOT NULL');
        });
    });

    describe('DDL', () => {
        it('should build CREATE TABLE', () => {
            const columns = new Map([['name', 'STRING'], ['age', 'NUMBER']]);
            const sql = SQLBuilder.ddl().createTable('users', columns);
            expect(sql).toBe('CREATE TABLE users (name STRING, age NUMBER)');
        });

        it('should build ALTER TABLE ADD COLUMN', () => {
            const sql = SQLBuilder.ddl().alterTableAddColumn('users', 'email', 'STRING');
            expect(sql).toBe('ALTER TABLE users ADD COLUMN email STRING');
        });

        it('should build ALTER TABLE DROP COLUMN', () => {
            const sql = SQLBuilder.ddl().alterTableDropColumn('users', 'email');
            expect(sql).toBe('ALTER TABLE users DROP COLUMN email');
        });

        it('should build ALTER TABLE RENAME', () => {
            const sql = SQLBuilder.ddl().alterTableRename('users', 'accounts');
            expect(sql).toBe('ALTER TABLE users RENAME TO accounts');
        });

        it('should build DROP TABLE', () => {
            const sql = SQLBuilder.ddl().dropTable('users');
            expect(sql).toBe('DROP TABLE users');
        });
    });
});
