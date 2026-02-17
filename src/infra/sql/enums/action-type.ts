/**
 * Row格式操作类型枚举
 * 定义对数据行的四种基本操作
 */
export enum ActionType {
    /** 插入新行 */
    INSERT = 'insert',
    /** 字符串追加（STRING类型专用，在原有值后追加内容） */
    APPEND = 'append',
    /** 更新现有行 */
    UPDATE = 'update',
    /** 删除行 */
    DELETE = 'delete'
}
