import type {ColumnSchema, DataStorage, ExecutorStructure, SqlResult, TableSchema} from '@/infra/sql';
import {SqlType, SqlValidationError} from '@/infra/sql';

export class DdlExecutor {
    constructor(
        private structure: ExecutorStructure,
        private dataStorage: DataStorage,
        private getTableIdxByName: (tableName: string) => number | undefined
    ) {
    }

    executeCreateTable(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        this.validateTableNotExists(tableName);

        const tableIdx = this.allocateTableIdx();
        const columns = stmt.columns;
        const id2fieldName: Record<number, string> = {};
        const fieldName2id: Record<string, number> = {};
        const columnSchemas: Record<number, ColumnSchema> = {};

        let counter = 0;
        for (const col of columns) {
            const fieldIdx = counter++;
            id2fieldName[fieldIdx] = col.name;
            fieldName2id[col.name] = fieldIdx;
            const colSchema: ColumnSchema = {
                name: col.name,
                type: col.type,
                primitiveKey: col.primitiveKey || false,
                defaultValue: col.defaultValue,
                comment: col.comment || ''
            };
            columnSchemas[fieldIdx] = colSchema;
        }

        const newTableSchema: TableSchema = {
            tableName,
            id2fieldName,
            fieldName2id,
            columnSchemas,
            counter,
            comment: stmt.comment || ''
        };
        this.structure.tableSchemas = {...this.structure.tableSchemas, [tableIdx]: newTableSchema};
        this.structure.tableName2Idx = {...this.structure.tableName2Idx, [tableName]: tableIdx};

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
        const schema = this.structure.tableSchemas[tableIdx]!;

        switch (stmt.opType) {
            case 'ADD_COLUMN':
                return this.addColumn(schema, tableName, stmt.columnDef);

            case 'DROP_COLUMN':
                return this.removeColumn(schema, tableName, stmt.columnName);

            case 'RENAME':
                return this.renameTable(schema, tableIdx, tableName, stmt.newTableName);

            case 'RENAME_COLUMN':
                return this.renameColumn(schema, tableName, stmt.columnName, stmt.newColumnName);

            case 'MODIFY_COLUMN_COMMENT':
                return this.modifyColumnComment(schema, tableName, stmt.columnName, stmt.comment);

            case 'ALTER_TABLE_COMMENT':
                return this.modifyTableComment(schema, tableName, stmt.comment);
        }

        throw new Error('Invalid ALTER TABLE statement');
    }

    executeDropTable(stmt: any): SqlResult {
        const tableName = stmt.tableName;
        const tableIdx = this.validateTableExists(tableName);

        const {[tableIdx]: _, ...restTableSchemas} = this.structure.tableSchemas;
        const {[tableName]: __, ...restTableName2Idx} = this.structure.tableName2Idx;

        this.structure.tableSchemas = restTableSchemas;
        this.structure.tableName2Idx = restTableName2Idx;
        this.dataStorage.setTableData(tableIdx, []);

        if (Object.keys(this.structure.tableSchemas).length === 0) {
            this.structure.tableIdxCounter = 0;
        }

        return {
            success: true,
            message: `Table '${tableName}' dropped`,
            data: 0,
            type: SqlType.DDL
        };
    }

    private addColumn(schema: TableSchema, tableName: string, columnDef: any): SqlResult {
        if (schema.fieldName2id[columnDef.name] !== undefined) {
            throw new SqlValidationError(
                `Column '${columnDef.name}' already exists in table '${tableName}'`,
                `ALTER TABLE ${tableName} ADD COLUMN ${columnDef.name}`
            );
        }

        const fieldIdx = schema.counter;
        const colSchema: ColumnSchema = {
            name: columnDef.name,
            type: columnDef.type,
            primitiveKey: columnDef.primitiveKey || false,
            defaultValue: columnDef.defaultValue,
            comment: columnDef.comment || ''
        };

        schema.id2fieldName = {...schema.id2fieldName, [fieldIdx]: colSchema.name};
        schema.fieldName2id = {...schema.fieldName2id, [colSchema.name]: fieldIdx};
        schema.columnSchemas = {...schema.columnSchemas, [fieldIdx]: colSchema};
        schema.counter = fieldIdx + 1;

        const updatedSchema: TableSchema = {...schema};
        const tableIdx = this.structure.tableName2Idx[tableName]!;
        this.structure.tableSchemas = {...this.structure.tableSchemas, [tableIdx]: updatedSchema};

        return {
            success: true,
            message: `Column '${columnDef.name}' added to table '${tableName}'`,
            data: 0,
            type: SqlType.DDL
        };
    }

    private removeColumn(schema: TableSchema, tableName: string, columnName: string): SqlResult {
        const fieldIdx = schema.fieldName2id[columnName];
        if (fieldIdx === undefined) {
            throw new SqlValidationError(
                `Column '${columnName}' does not exist in table '${tableName}'`,
                `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`
            );
        }

        const {[fieldIdx]: _, ...newId2fieldName} = schema.id2fieldName;
        const {[columnName]: __, ...newFieldName2id} = schema.fieldName2id;
        const {[fieldIdx]: ___, ...newColumnSchemas} = schema.columnSchemas;

        schema.id2fieldName = newId2fieldName;
        schema.fieldName2id = newFieldName2id;
        schema.columnSchemas = newColumnSchemas;

        const updatedSchema: TableSchema = {...schema};
        const tableIdx = this.structure.tableName2Idx[tableName]!;
        this.structure.tableSchemas = {...this.structure.tableSchemas, [tableIdx]: updatedSchema};

        return {
            success: true,
            message: `Column '${columnName}' dropped from table '${tableName}'`,
            data: 0,
            type: SqlType.DDL
        };
    }

    private renameTable(schema: TableSchema, tableIdx: number, tableName: string, newTableName: string): SqlResult {
        if (!newTableName) {
            throw new SqlValidationError('New table name is required', `ALTER TABLE ${tableName} RENAME TO`);
        }

        if (this.getTableIdxByName(newTableName) !== undefined) {
            throw new SqlValidationError(
                `Table '${newTableName}' already exists`,
                `ALTER TABLE ${tableName} RENAME TO ${newTableName}`
            );
        }

        const updatedSchema: TableSchema = {...schema, tableName: newTableName};
        const {[tableName]: _, ...rest} = this.structure.tableName2Idx;
        this.structure.tableName2Idx = {...rest, [newTableName]: tableIdx};
        this.structure.tableSchemas = {...this.structure.tableSchemas, [tableIdx]: updatedSchema};

        return {
            success: true,
            message: `Table renamed from '${tableName}' to '${newTableName}'`,
            data: 0,
            type: SqlType.DDL
        };
    }

    private renameColumn(schema: TableSchema, tableName: string, columnName: string, newColumnName: string): SqlResult {
        if (!columnName || !newColumnName) {
            throw new SqlValidationError('Column names are required', `ALTER TABLE ${tableName} RENAME COLUMN`);
        }

        const fieldIdx = schema.fieldName2id[columnName];
        if (fieldIdx === undefined) {
            throw new SqlValidationError(
                `Column '${columnName}' does not exist in table '${tableName}'`,
                `ALTER TABLE ${tableName} RENAME COLUMN ${columnName} TO ${newColumnName}`
            );
        }
        if (schema.fieldName2id[newColumnName] !== undefined) {
            throw new SqlValidationError(
                `Column '${newColumnName}' already exists in table '${tableName}'`,
                `ALTER TABLE ${tableName} RENAME COLUMN ${columnName} TO ${newColumnName}`
            );
        }

        const {[columnName]: _, ...newFieldName2id} = schema.fieldName2id;
        const newId2fieldName = {...schema.id2fieldName, [fieldIdx]: newColumnName};
        const colSchema = schema.columnSchemas[fieldIdx]!;
        const updatedColSchema: ColumnSchema = {
            name: newColumnName,
            type: colSchema.type,
            primitiveKey: colSchema.primitiveKey,
            defaultValue: colSchema.defaultValue,
            comment: colSchema.comment
        };
        const {[fieldIdx]: __, ...restColumnSchemas} = schema.columnSchemas;
        const newColumnSchemas: Record<number, ColumnSchema> = {...restColumnSchemas, [fieldIdx]: updatedColSchema};

        schema.fieldName2id = {...newFieldName2id, [newColumnName]: fieldIdx};
        schema.id2fieldName = newId2fieldName;
        schema.columnSchemas = newColumnSchemas;

        const updatedSchema: TableSchema = {...schema};
        const tableIdx = this.structure.tableName2Idx[tableName]!;
        this.structure.tableSchemas = {...this.structure.tableSchemas, [tableIdx]: updatedSchema};

        return {
            success: true,
            message: `Column '${columnName}' renamed to '${newColumnName}' in table '${tableName}'`,
            data: 0,
            type: SqlType.DDL
        };
    }

    private modifyColumnComment(schema: TableSchema, tableName: string, columnName: string, comment?: string): SqlResult {
        if (!columnName) {
            throw new SqlValidationError('Column name is required', `ALTER TABLE ${tableName} MODIFY COLUMN`);
        }

        const fieldIdx = schema.fieldName2id[columnName];
        if (fieldIdx === undefined) {
            throw new SqlValidationError(
                `Column '${columnName}' does not exist in table '${tableName}'`,
                `ALTER TABLE ${tableName} MODIFY COLUMN ${columnName}`
            );
        }

        const colSchema = schema.columnSchemas[fieldIdx]!;
        const updatedColSchema: ColumnSchema = {
            name: colSchema.name,
            type: colSchema.type,
            primitiveKey: colSchema.primitiveKey,
            defaultValue: colSchema.defaultValue,
            comment: comment
        };
        const {[fieldIdx]: _, ...restColumnSchemas} = schema.columnSchemas;
        schema.columnSchemas = {...restColumnSchemas, [fieldIdx]: updatedColSchema};

        const updatedSchema: TableSchema = {...schema};
        const tableIdx = this.structure.tableName2Idx[tableName]!;
        this.structure.tableSchemas = {...this.structure.tableSchemas, [tableIdx]: updatedSchema};

        return {
            success: true,
            message: `Column '${columnName}' comment updated in table '${tableName}'`,
            data: 0,
            type: SqlType.DDL
        };
    }

    private modifyTableComment(schema: TableSchema, tableName: string, comment?: string): SqlResult {
        const updatedSchema: TableSchema = {...schema, comment: comment};
        const tableIdx = this.structure.tableName2Idx[tableName]!;
        this.structure.tableSchemas = {...this.structure.tableSchemas, [tableIdx]: updatedSchema};

        return {
            success: true,
            message: `Table '${tableName}' comment updated`,
            data: 0,
            type: SqlType.DDL
        };
    }

    private allocateTableIdx(): number {
        return this.structure.tableIdxCounter++;
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
