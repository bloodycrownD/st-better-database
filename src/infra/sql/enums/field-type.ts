/**
 * 字段数据类型枚举
 * 简化设计，仅支持NUMBER和STRING两种基础类型
 */
export enum FieldType {
    /** 数值类型，对应JavaScript的number（支持整数和浮点数） */
    NUMBER = 'NUMBER',
    /** 字符串类型 */
    STRING = 'STRING'
}
