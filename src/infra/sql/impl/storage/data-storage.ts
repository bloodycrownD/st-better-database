import type {DataStorage} from '../../interfaces/storage/data-storage';
import type {RowData} from '../../types/core';

/**
 * DataStorage实现类
 *
 * 数据结构：
 * {
 *   tableIdx: [                  // 表ID
 *     {0: '张三', 1: 25},        // 第一行数据（字段ID -> 值）
 *     {0: '李四', 1: 30}         // 第二行数据
 *   ]
 * }
 */
export class SimpleDataStorage implements DataStorage {
    private data: Map<number, RowData[]> = new Map();

    constructor(data?: Map<number, RowData[]>) {
        if (data) {
            data.forEach((rows, tableIdx) => {
                this.data.set(tableIdx, rows.map(row => new Map(row)));
            });
        }
    }

    /**
     * 克隆数据存储
     */
    clone(): DataStorage {
        const clonedData = new Map<number, RowData[]>();
        this.data.forEach((rows, tableIdx) => {
            clonedData.set(tableIdx, rows.map(row => new Map(row)));
        });
        return new SimpleDataStorage(clonedData);
    }

    /**
     * 获取指定表的所有数据
     */
    getTableData(tableIdx: number): RowData[] {
        return this.data.get(tableIdx) || [];
    }

    /**
     * 设置指定表的数据
     */
    setTableData(tableIdx: number, data: RowData[]): void {
        this.data.set(tableIdx, data.map(row => new Map(row)));
    }

    /**
     * 清空所有数据
     */
    clear(): void {
        this.data.clear();
    }
}
