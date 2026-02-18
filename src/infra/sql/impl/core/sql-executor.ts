import {DatabaseBuilder, type Row, type TableSchema} from '../../index';
import {ExportFormat, SqlExecutionError, SqlSyntaxError, SqlType, SqlValidationError} from '../../index';
import type {SqlExecutor} from '@/infra/sql';
import type {SqlResult} from '@/infra/sql';
import type {Statement} from '@/infra/sql';
import {Parser, StatementType} from '@/infra/sql';
import type {DataStorage} from '@/infra/sql';
import {DdlExecutor, DmlExecutor, DqlExecutor} from '@/infra/sql';
import {RowConverter, DataExporter} from '../utils';

export class SimpleSqlExecutor implements SqlExecutor {
    private tableSchemas: Map<number, TableSchema> = new Map();
    private tableName2Idx: Map<string, number> = new Map();
    private tableIdxCounter: number = 0;
    private dataStorage: DataStorage;
    private ddlExecutor: DdlExecutor;
    private dmlExecutor: DmlExecutor;
    private dqlExecutor: DqlExecutor;
    private rowConverter: RowConverter;
    private dataExporter: DataExporter;

    constructor(dataStorage?: DataStorage) {
        this.dataStorage = dataStorage || DatabaseBuilder.newStorage();
        const tableIdxCounter = {value: 0};
        this.ddlExecutor = new DdlExecutor(
            this.tableSchemas,
            this.tableName2Idx,
            tableIdxCounter,
            this.dataStorage,
            this.getTableIdxByName.bind(this)
        );
        this.dmlExecutor = new DmlExecutor(
            this.tableSchemas,
            this.dataStorage,
            this.validateTableExists.bind(this)
        );
        this.dqlExecutor = new DqlExecutor(
            this.tableSchemas,
            this.dataStorage,
            this.validateTableExists.bind(this)
        );
        this.rowConverter = new RowConverter();
        this.dataExporter = new DataExporter();
    }

    getTables(): TableSchema[] {
        return Array.from(this.tableSchemas.values());
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
        return this.tableName2Idx.get(tableName);
    }

    getTableNameByIdx(tableIdx: number): string | undefined {
        const schema = this.tableSchemas.get(tableIdx);
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
            this.tableSchemas,
            format,
            table,
            this.getTableIdxByName.bind(this)
        );
    }

    dml2row(sql: string): Row[] {
        const parseResult = Parser.parse(sql);
        return this.rowConverter.dml2row(parseResult.statements, this.tableSchemas, this.getTableIdxByName.bind(this));
    }

    row2dml(rows: Row[]): string {
        return this.rowConverter.row2dml(rows, this.tableSchemas, this.getTableNameByIdx.bind(this));
    }

    clone(): SqlExecutor {
        // 只复制表结构
        const clonedExecutor = new SimpleSqlExecutor();

        for (const [tableIdx, schema] of this.tableSchemas.entries()) {
            const clonedColumnSchemas: any = new Map();
            for (const [fieldIdx, colSchema] of schema.columnSchemas.entries()) {
                clonedColumnSchemas.set(fieldIdx, {
                    name: colSchema.name,
                    type: colSchema.type,
                    primitiveKey: colSchema.primitiveKey,
                    defaultValue: colSchema.defaultValue,
                    comment: colSchema.comment
                });
            }

            clonedExecutor.tableSchemas.set(tableIdx, {
                tableName: schema.tableName,
                id2fieldName: new Map(schema.id2fieldName),
                fieldName2id: new Map(schema.fieldName2id),
                columnSchemas: clonedColumnSchemas,
                counter: schema.counter,
                comment: schema.comment
            });
        }

        clonedExecutor.tableName2Idx = new Map(this.tableName2Idx);
        clonedExecutor.tableIdxCounter = this.tableIdxCounter;

        return clonedExecutor;
    }
}
