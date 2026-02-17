import {type SqlResult} from "@/infra/sql";

export interface SqlExecutorService{
    execute(sql: string): SqlResult;
}
