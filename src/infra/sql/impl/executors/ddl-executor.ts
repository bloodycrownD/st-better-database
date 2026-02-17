import type {ColumnSchema, TableSchema} from '../../index';
import {SqlType, SqlValidationError} from '../../index';
import type {SqlResult} from '@/infra/sql';
import type {DataStorage} from '@/infra/sql';

export class DdlExecutor {
    constructor(
        private tableSchemas: Map<number, TableSchema>,
        private tableName2Idx: Map<string, number>,
        private tableIdxCounter: { value: number },
        private dataStorage: DataStorage,
        private getTableIdxByName: (tableName: string) => number | undefined
    ) {
    }

    executeCreateTable(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        this.validateTableNotExists(tableName);

        const tableIdx = this.allocateTableIdx();
        const columns = stmt.columns;

        const id2fieldName = new Map<number, string>();
        const fieldName2id = new Map<string, number>();
        const columnSchemas = new Map<number, ColumnSchema>();

        let counter = 0;
        for (const col of columns) {
            const fieldIdx = counter++;
            id2fieldName.set(fieldIdx, col.name);
            fieldName2id.set(col.name, fieldIdx);
            columnSchemas.set(fieldIdx, {
                name: col.name,
                type: col.type,
                primitiveKey: col.primitiveKey || false,
                defaultValue: col.defaultValue,
                comment: ''
            });
        }

        const schema: TableSchema = {
            tableName,
            id2fieldName,
            fieldName2id,
            columnSchemas,
            counter
        };

        this.tableSchemas.set(tableIdx, schema);
        this.tableName2Idx.set(tableName, tableIdx);

        return {
            success: true,
            message: `Table '${tableName}' created successfully`,
            data: 0,
            type: SqlType.DDL
        };
    }

    executeAlterTable(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        const tableIdx = this.validateTableExists(tableName);
        const schema = this.tableSchemas.get(tableIdx)!;

        switch (stmt.opType) {
            case 'ADD_COLUMN':
                if (stmt.columnDef) {
                    const colDef = stmt.columnDef;
                    if (schema.fieldName2id.has(colDef.name)) {
                        throw new SqlValidationError(
                            `Column '${colDef.name}' already exists in table '${tableName}'`,
                            `ALTER TABLE ${tableName} ADD COLUMN ${colDef.name}`
                        );
                    }

                    const fieldIdx = schema.counter++;
                    schema.id2fieldName.set(fieldIdx, colDef.name);
                    schema.fieldName2id.set(colDef.name, fieldIdx);
                    schema.columnSchemas.set(fieldIdx, {
                        name: colDef.name,
                        type: colDef.type,
                        primitiveKey: colDef.primitiveKey || false,
                        defaultValue: colDef.defaultValue,
                        comment: colDef.comment || ''
                    });

                    return {
                        success: true,
                        message: `Column '${colDef.name}' added to table '${tableName}'`,
                        data: 0,
                        type: SqlType.DDL
                    };
                }
                break;

            case 'DROP_COLUMN':
                if (stmt.columnName) {
                    const colName = stmt.columnName;
                    const fieldIdx = schema.fieldName2id.get(colName);
                    if (fieldIdx === undefined) {
                        throw new SqlValidationError(
                            `Column '${colName}' does not exist in table '${tableName}'`,
                            `ALTER TABLE ${tableName} DROP COLUMN ${colName}`
                        );
                    }

                    schema.id2fieldName.delete(fieldIdx);
                    schema.fieldName2id.delete(colName);
                    schema.columnSchemas.delete(fieldIdx);

                    return {
                        success: true,
                        message: `Column '${colName}' dropped from table '${tableName}'`,
                        data: 0,
                        type: SqlType.DDL
                    };
                }
                break;

            case 'RENAME':
                if (stmt.newTableName) {
                    const newTableName = stmt.newTableName;
                    if (this.getTableIdxByName(newTableName) !== undefined) {
                        throw new SqlValidationError(
                            `Table '${newTableName}' already exists`,
                            `ALTER TABLE ${tableName} RENAME TO ${newTableName}`
                        );
                    }

                    schema.tableName = newTableName;
                    this.tableName2Idx.delete(tableName);
                    this.tableName2Idx.set(newTableName, tableIdx);

                    return {
                        success: true,
                        message: `Table renamed from '${tableName}' to '${newTableName}'`,
                        data: 0,
                        type: SqlType.DDL
                    };
                }
                break;

            case 'RENAME_COLUMN':
                if (stmt.columnName && stmt.newColumnName) {
                    const colName = stmt.columnName;
                    const newColName = stmt.newColumnName;
                    const fieldIdx = schema.fieldName2id.get(colName);
                    if (fieldIdx === undefined) {
                        throw new SqlValidationError(
                            `Column '${colName}' does not exist in table '${tableName}'`,
                            `ALTER TABLE ${tableName} RENAME COLUMN ${colName} TO ${newColName}`
                        );
                    }
                    if (schema.fieldName2id.has(newColName)) {
                        throw new SqlValidationError(
                            `Column '${newColName}' already exists in table '${tableName}'`,
                            `ALTER TABLE ${tableName} RENAME COLUMN ${colName} TO ${newColName}`
                        );
                    }

                    schema.id2fieldName.set(fieldIdx, newColName);
                    schema.fieldName2id.delete(colName);
                    schema.fieldName2id.set(newColName, fieldIdx);

                    const columnSchema = schema.columnSchemas.get(fieldIdx);
                    if (columnSchema) {
                        columnSchema.name = newColName;
                    }

                    return {
                        success: true,
                        message: `Column '${colName}' renamed to '${newColName}' in table '${tableName}'`,
                        data: 0,
                        type: SqlType.DDL
                    };
                }
                break;

            case 'MODIFY_COLUMN_COMMENT':
                if (stmt.columnName && stmt.comment !== undefined) {
                    const colName = stmt.columnName;
                    const fieldIdx = schema.fieldName2id.get(colName);
                    if (fieldIdx === undefined) {
                        throw new SqlValidationError(
                            `Column '${colName}' does not exist in table '${tableName}'`,
                            `ALTER TABLE ${tableName} MODIFY COLUMN ${colName}`
                        );
                    }

                    const columnSchema = schema.columnSchemas.get(fieldIdx);
                    if (columnSchema) {
                        columnSchema.comment = stmt.comment;
                    }

                    return {
                        success: true,
                        message: `Column '${colName}' comment updated in table '${tableName}'`,
                        data: 0,
                        type: SqlType.DDL
                    };
                }
                break;

            case 'ALTER_TABLE_COMMENT':
                if (stmt.comment !== undefined) {
                    schema.comment = stmt.comment;

                    return {
                        success: true,
                        message: `Table '${tableName}' comment updated`,
                        data: 0,
                        type: SqlType.DDL
                    };
                }
                break;
        }

        throw new Error('Invalid ALTER TABLE statement');
    }

    executeDropTable(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        const tableIdx = this.validateTableExists(tableName);

        this.tableSchemas.delete(tableIdx);
        this.tableName2Idx.delete(tableName);
        this.dataStorage.setTableData(tableIdx, []);

        return {
            success: true,
            message: `Table '${tableName}' dropped`,
            data: 0,
            type: SqlType.DDL
        };
    }

    private allocateTableIdx(): number {
        return this.tableIdxCounter.value++;
    }

    private validateTableExists(tableName: string): number {
        const tableIdx = this.getTableIdxByName(tableName);
        if (tableIdx === undefined) {
            throw new SqlValidationError(
                `Table '${tableName}' does not exist`,
                `Table '${tableName}' does not exist`
            );
        }
        return tableIdx;
    }

    private validateTableNotExists(tableName: string): void {
        if (this.getTableIdxByName(tableName) !== undefined) {
            throw new SqlValidationError(
                `Table '${tableName}' already exists`,
                `Table '${tableName}' already exists`
            );
        }
    }
}
