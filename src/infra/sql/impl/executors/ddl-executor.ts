import type {ColumnSchema, TableSchema} from '@/infra/sql';
import {SqlType, SqlValidationError} from '@/infra/sql';
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

        console.log('[DDL] Create Table columns:', columns);
        console.log('[DDL] Table comment:', stmt.comment);

        const id2fieldName = new Map<number, string>();
        const fieldName2id = new Map<string, number>();
        const columnSchemas = new Map<number, ColumnSchema>();

        let counter = 0;
        for (const col of columns) {
            const fieldIdx = counter++;
            id2fieldName.set(fieldIdx, col.name);
            fieldName2id.set(col.name, fieldIdx);
            const colSchema = {
                name: col.name,
                type: col.type,
                primitiveKey: col.primitiveKey || false,
                defaultValue: col.defaultValue,
                comment: col.comment || ''
            };
            console.log('[DDL] Creating column:', colSchema);
            columnSchemas.set(fieldIdx, colSchema);
        }

        const schema: TableSchema = {
            tableName,
            id2fieldName,
            fieldName2id,
            columnSchemas,
            counter,
            comment: stmt.comment || ''
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
                    console.log('[DDL] ADD COLUMN:', colDef);
                    if (schema.fieldName2id.has(colDef.name)) {
                        throw new SqlValidationError(
                            `Column '${colDef.name}' already exists in table '${tableName}'`,
                            `ALTER TABLE ${tableName} ADD COLUMN ${colDef.name}`
                        );
                    }

                    const fieldIdx = schema.counter;
                    const colSchema = {
                        name: colDef.name,
                        type: colDef.type,
                        primitiveKey: colDef.primitiveKey || false,
                        defaultValue: colDef.defaultValue,
                        comment: colDef.comment || ''
                    };
                    console.log('[DDL] Created column schema:', colSchema);

                    this.tableSchemas.set(tableIdx, this.addColumn(schema, fieldIdx, colSchema));

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

                    this.tableSchemas.set(tableIdx, this.removeColumn(schema, fieldIdx, colName));

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

                    const newSchema = {
                        ...schema,
                        tableName: newTableName
                    };

                    this.tableSchemas.set(tableIdx, newSchema);
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

                    const tempSchema = this.removeColumn(schema, fieldIdx, colName);
                    const newColumnSchema: ColumnSchema = {
                        name: newColName,
                        type: tempSchema.columnSchemas.get(fieldIdx)!.type,
                        primitiveKey: tempSchema.columnSchemas.get(fieldIdx)!.primitiveKey,
                        defaultValue: tempSchema.columnSchemas.get(fieldIdx)!.defaultValue,
                        comment: tempSchema.columnSchemas.get(fieldIdx)!.comment
                    };
                    const finalSchema = this.addColumn(tempSchema, fieldIdx, newColumnSchema);
                    this.tableSchemas.set(tableIdx, finalSchema);

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
                    console.log('[DDL] ALTER COLUMN COMMENT:', {tableName, colName, comment: stmt.comment, fieldIdx});
                    if (fieldIdx === undefined) {
                        throw new SqlValidationError(
                            `Column '${colName}' does not exist in table '${tableName}'`,
                            `ALTER TABLE ${tableName} MODIFY COLUMN ${colName}`
                        );
                    }

                    const newSchema = this.updateColumnSchema(schema, fieldIdx, {comment: stmt.comment});
                    this.tableSchemas.set(tableIdx, newSchema);

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
                    const newSchema = {
                        ...schema,
                        comment: stmt.comment
                    };

                    this.tableSchemas.set(tableIdx, newSchema);

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

    private cloneMap<K, V>(map: Map<K, V>): Map<K, V> {
        return new Map(map);
    }

    private cloneColumnSchema(columnSchema: ColumnSchema): ColumnSchema {
        return {
            name: columnSchema.name,
            type: columnSchema.type,
            primitiveKey: columnSchema.primitiveKey,
            defaultValue: columnSchema.defaultValue,
            comment: columnSchema.comment
        };
    }

    private updateIdMappings(schema: TableSchema, fieldId: number, action: 'add' | 'remove', colName: string): TableSchema {
        const newId2fieldName = this.cloneMap(schema.id2fieldName);
        const newFieldName2id = this.cloneMap(schema.fieldName2id);

        if (action === 'add') {
            newId2fieldName.set(fieldId, colName);
            newFieldName2id.set(colName, fieldId);
        } else {
            newId2fieldName.delete(fieldId);
            newFieldName2id.delete(colName);
        }

        return {
            ...schema,
            id2fieldName: newId2fieldName,
            fieldName2id: newFieldName2id
        };
    }

    private addColumn(schema: TableSchema, fieldId: number, column: ColumnSchema): TableSchema {
        const newSchema = this.updateIdMappings(schema, fieldId, 'add', column.name);
        const newColumnSchemas = this.cloneMap(newSchema.columnSchemas);
        newColumnSchemas.set(fieldId, this.cloneColumnSchema(column));

        return {
            ...newSchema,
            counter: fieldId + 1,
            columnSchemas: newColumnSchemas
        };
    }

    private removeColumn(schema: TableSchema, fieldId: number, colName: string): TableSchema {
        const newSchema = this.updateIdMappings(schema, fieldId, 'remove', colName);
        const newColumnSchemas = this.cloneMap(newSchema.columnSchemas);
        newColumnSchemas.delete(fieldId);

        return {
            ...newSchema,
            columnSchemas: newColumnSchemas
        };
    }

    private updateColumnSchema(schema: TableSchema, fieldId: number, updates: Partial<ColumnSchema>): TableSchema {
        const columnSchema = schema.columnSchemas.get(fieldId);
        if (!columnSchema) {
            return schema;
        }

        const newColumnSchemas = this.cloneMap(schema.columnSchemas);
        newColumnSchemas.set(fieldId, {
            ...columnSchema,
            ...updates
        });

        return {
            ...schema,
            columnSchemas: newColumnSchemas
        };
    }
}
