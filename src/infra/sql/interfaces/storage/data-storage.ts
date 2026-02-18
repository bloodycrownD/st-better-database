import type {RowData} from '@/infra/sql';

/**
 * 数据存储接口
 *
 * 职责：存储表数据的快照
 * 注意：不存储表结构映射，映射由SqlExecutor管理
 *
 * 数据结构：
 * {
 *   tableIdx: [                  // 表ID
 *     {0: '张三', 1: 25},        // 第一行数据（字段ID -> 值）
 *     {0: '李四', 1: 30}         // 第二行数据
 *   ]
 * }
 */
export interface DataStorage {
    /**
     * 克隆数据存储
     * 创建当前数据存储的深拷贝，用于保存数据快照
     * @returns 新的DataStorage实例
     */
    clone(): DataStorage;

    /**
     * 获取指定表的所有数据
     * @param tableIdx 表ID
     * @returns 该表的所有行数据数组
     */
    getTableData(tableIdx: number): RowData[];

    /**
     * 设置指定表的数据
     * @param tableIdx 表ID
     * @param data 行数据数组
     */
    setTableData(tableIdx: number, data: RowData[]): void;

    /**
     * 清空所有数据
     */
    clear(): void;
}
