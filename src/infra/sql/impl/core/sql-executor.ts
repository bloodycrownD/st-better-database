import {
    DatabaseBuilder,
    type ExecutorStructure,
    ExportFormat,
    SqlExecutionError,
    SqlSyntaxError,
    SqlType,
    SqlValidationError,
    type TableSchema
} from '../../index';
import type {DataStorage, SqlExecutor, SqlResult, Statement} from '@/infra/sql';
import {DdlExecutor, DmlExecutor, DqlExecutor, Parser, StatementType} from '@/infra/sql';
import {DataExporter} from '../utils';

export class SimpleSqlExecutor implements SqlExecutor {
    private structure: ExecutorStructure;
    private dataStorage: DataStorage;
    private ddlExecutor: DdlExecutor;
    private dmlExecutor: DmlExecutor;
    private dqlExecutor: DqlExecutor;
    private dataExporter: DataExporter;

    constructor(dataStorage?: DataStorage, structure?: ExecutorStructure) {
        this.dataStorage = dataStorage || DatabaseBuilder.newStorage();
        this.structure = structure || this.createEmptyStructure();

        this.ddlExecutor = new DdlExecutor(
            this.structure,
            this.dataStorage,
            this.getTableIdxByName.bind(this)
        );
        this.dmlExecutor = new DmlExecutor(
            this.structure,
            this.dataStorage,
            this.validateTableExists.bind(this)
        );
        this.dqlExecutor = new DqlExecutor(
            this.structure,
            this.dataStorage,
            this.validateTableExists.bind(this)
        );
        this.dataExporter = new DataExporter();
    }

    private createEmptyStructure(): ExecutorStructure {
        return {
            tableSchemas: {},
            tableName2Idx: {},
            tableIdxCounter: 0
        };
    }

    getTables(): TableSchema[] {
        const tableSchemas = Object.values(this.structure.tableSchemas);
        return tableSchemas.map(schema => ({
            ...schema,
            id2fieldName: {...schema.id2fieldName},
            fieldName2id: {...schema.fieldName2id},
            columnSchemas: {...schema.columnSchemas}
        }));
    }

    execute(sql: string, sqlTypes: SqlType[]): SqlResult {
        try {
            const parseResult = Parser.parse(sql);

            if (parseResult.errors.length > 0) {
                throw new SqlSyntaxError(
                    parseResult.errors.join('; '),
                    0,
                    sql
                );
            }

            const statements = parseResult.statements;
            if (statements.length === 0) {
                throw new SqlSyntaxError('No valid SQL statement found', 0, sql);
            }

            let result: SqlResult | undefined;
            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i];
                if (!stmt) continue;
                const stmtType = this.getStatementType(stmt);
                if (!sqlTypes.includes(stmtType)) {
                    throw new SqlValidationError(
                        `Expected SQL type ${sqlTypes.join(' or ')}, got ${stmtType}`,
                        sql
                    );
                }
                result = this.executeStatement(stmt);
            }

            if (!result) {
                throw new SqlSyntaxError('No valid statement executed', 0, sql);
            }

            return result;
        } catch (e) {
            if (e instanceof SqlSyntaxError || e instanceof SqlValidationError || e instanceof SqlExecutionError) {
                throw e;
            }
            throw new SqlExecutionError((e as Error).message, sql);
        }
    }

    private getStatementType(stmt: Statement): SqlType {
        const type = stmt.type;
        switch (type) {
            case StatementType.CREATE_TABLE:
            case StatementType.ALTER_TABLE:
            case StatementType.DROP_TABLE:
                return SqlType.DDL;
            case StatementType.INSERT:
            case StatementType.UPDATE:
            case StatementType.DELETE:
            case StatementType.APPEND:
                return SqlType.DML;
            case StatementType.SELECT:
                return SqlType.DQL;
            default:
                throw new SqlExecutionError(`Unknown statement type: ${type}`);
        }
    }

    private executeStatement(stmt: Statement): SqlResult {
        switch (stmt.type) {
            case StatementType.CREATE_TABLE:
                return this.ddlExecutor.executeCreateTable(stmt as any);
            case StatementType.ALTER_TABLE:
                return this.ddlExecutor.executeAlterTable(stmt as any);
            case StatementType.DROP_TABLE:
                return this.ddlExecutor.executeDropTable(stmt as any);
            case StatementType.INSERT:
                return this.dmlExecutor.executeInsert(stmt as any);
            case StatementType.UPDATE:
                return this.dmlExecutor.executeUpdate(stmt as any);
            case StatementType.DELETE:
                return this.dmlExecutor.executeDelete(stmt as any);
            case StatementType.APPEND:
                return this.dmlExecutor.executeAppend(stmt as any);
            case StatementType.SELECT:
                return this.dqlExecutor.executeSelect(stmt as any);
            default:
                throw new SqlExecutionError(`Unsupported statement type`);
        }
    }

    getTableIdxByName(tableName: string): number | undefined {
        return this.structure.tableName2Idx[tableName];
    }

    getTableNameByIdx(tableIdx: number): string | undefined {
        const schema = this.structure.tableSchemas[tableIdx];
        return schema?.tableName;
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

    getDataStorage(): DataStorage {
        return this.dataStorage;
    }

    setDataStorage(dataStorage: DataStorage): void {
        this.dataStorage = dataStorage;
    }

    export(format: ExportFormat, table?: string): string {
        return this.dataExporter.export(
            this.dataStorage,
            this.structure.tableSchemas,
            format,
            table,
            this.getTableIdxByName.bind(this)
        );
    }

    clone(): SqlExecutor {
        const clonedStructure = JSON.parse(JSON.stringify(this.structure)) as ExecutorStructure;
        return new SimpleSqlExecutor(undefined, clonedStructure);
    }

    serialize(): object {
        return {
            structure: this.structure,
            dataStorage: this.dataStorage.serialize()
        };
    }

    deserialize(data: object): void {
        const dataObj = data as any;

        if (dataObj.structure) {
            this.structure = dataObj.structure;
        } else {
            this.structure = this.createEmptyStructure();
        }

        if (dataObj.dataStorage) {
            this.dataStorage.deserialize(dataObj.dataStorage);
        } else {
            this.dataStorage.clear();
        }

        this.rebuildExecutors();
    }

    private rebuildExecutors(): void {
        this.ddlExecutor = new DdlExecutor(
            this.structure,
            this.dataStorage,
            this.getTableIdxByName.bind(this)
        );
        this.dmlExecutor = new DmlExecutor(
            this.structure,
            this.dataStorage,
            this.validateTableExists.bind(this)
        );
        this.dqlExecutor = new DqlExecutor(
            this.structure,
            this.dataStorage,
            this.validateTableExists.bind(this)
        );
    }
}
