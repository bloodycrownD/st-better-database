import type {SqlExecutor} from "./interfaces/core/sql-executor.ts";
import {SimpleSqlExecutor} from "./impl/core";
import type {DataStorage} from "./interfaces/storage/data-storage.ts";
import {SimpleDataStorage} from "./impl/storage";

export class DatabaseBuilder {
    public static buildExecutor():SqlExecutor{
        return new SimpleSqlExecutor();
    }
    public static buildStorage():DataStorage{
        return new SimpleDataStorage();
    }
}
