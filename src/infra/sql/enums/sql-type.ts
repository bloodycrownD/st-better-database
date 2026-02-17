/**
 * SQL语句类型枚举
 * 用于区分不同类型的SQL操作，执行时进行类型校验
 */
export enum SqlType {
    /** 数据定义语言：CREATE TABLE, ALTER TABLE, DROP TABLE */
    DDL = 'DDL',
    /** 数据操作语言：INSERT, UPDATE, DELETE, APPEND */
    DML = 'DML',
    /** 数据查询语言：SELECT */
    DQL = 'DQL',
    /** Row格式操作：JSON格式的批量数据操作 */
    ROW = 'ROW'
}
