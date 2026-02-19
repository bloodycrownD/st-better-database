import type {SqlValue} from './core';
import {FieldType} from '../enums/field-type';

/**
 * 列结构定义
 * 描述表中的一个列的完整元数据
 */
export type ColumnSchema = {
    /** 列名 */
    name: string;
    /** 数据类型：NUMBER或STRING */
    type: FieldType;
    /** 是否为主键 */
    primitiveKey: boolean;
    /** 默认值，可选 */
    defaultValue?: SqlValue;
    /** 字段注释，可选 */
    comment?: string;
}
